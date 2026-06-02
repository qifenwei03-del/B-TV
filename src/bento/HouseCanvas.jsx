import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { lightingTarget } from './houseLighting.js'

// ── 房子 3D cell(全專案唯一的 three.js)─────────────────────────────────────
// bento 牆裡的一格:自動旋轉的房子,燈光隨情境(persona)與當前維度(dimKey)變化。
// 模型:優先載入 public/house.glb(客戶之後提供);載不到則用程序化 placeholder house,
// 旋轉與燈光邏輯一模一樣,屆時把 .glb 丟到 public/ 即自動接上。
//
// props:
//   persona  — { id, accent }(決定基礎燈光與窗戶/點光顏色)
//   dimKey   — 'light'|'air'|'temp'|'sound'|null(scene 解方展演中的當前維度,微調燈光)
const MODEL_URL = '/house.glb'

export default function HouseCanvas({ persona, dimKey = null }) {
  const mountRef = useRef(null)
  // 把會變動的 props 放 ref,避免重建整個 three 場景
  const propsRef = useRef({ persona, dimKey })
  propsRef.current = { persona, dimKey }

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const W = mount.clientWidth || 400
    const H = mount.clientHeight || 400

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100)
    camera.position.set(0, 2.4, 6.2)
    camera.lookAt(0, 0.6, 0)

    // ── 燈光 rig ────────────────────────────────────────────────────────────
    const ambient = new THREE.AmbientLight(0xffffff, 0.5)
    const hemi    = new THREE.HemisphereLight(0xffffff, 0x202830, 0.5)
    const key     = new THREE.DirectionalLight(0xffffff, 2.2)
    key.position.set(4, 6, 5)
    const fill    = new THREE.DirectionalLight(0xffffff, 0.6)
    fill.position.set(-5, 2, -3)
    const accent  = new THREE.PointLight(0x4dbaba, 1.4, 18, 2)
    accent.position.set(-2, 2.4, 3)
    scene.add(ambient, hemi, key, fill, accent)

    // ── 旋轉容器 ────────────────────────────────────────────────────────────
    const pivot = new THREE.Group()
    scene.add(pivot)

    // 收集會吃 emissive 的窗戶材質,讓窗戶隨情境發光
    const windowMats = []

    function buildPlaceholderHouse() {
      const g = new THREE.Group()
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xeae6df, roughness: 0.85, metalness: 0.0 })
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x3b3f46, roughness: 0.7 })
      const doorMat = new THREE.MeshStandardMaterial({ color: 0x6b4a32, roughness: 0.8 })

      // 牆體
      const walls = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 1.9), wallMat)
      walls.position.y = 0.8
      g.add(walls)

      // 屋頂(四坡 pyramid)
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.95, 1.1, 4), roofMat)
      roof.position.y = 2.15
      roof.rotation.y = Math.PI / 4
      g.add(roof)

      // 門
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.85, 0.08), doorMat)
      door.position.set(0, 0.42, 0.97)
      g.add(door)

      // 窗戶(發光,吃情境色)
      const winGeo = new THREE.BoxGeometry(0.42, 0.42, 0.08)
      const winMat = () => {
        const m = new THREE.MeshStandardMaterial({ color: 0x9fd0e0, emissive: 0x4dbaba, emissiveIntensity: 0.3, roughness: 0.3 })
        windowMats.push(m)
        return m
      }
      const wPos = [[-0.7, 0.95, 0.97], [0.7, 0.95, 0.97], [-1.21, 0.95, 0], [1.21, 0.95, 0]]
      for (const [x, y, z] of wPos) {
        const w = new THREE.Mesh(winGeo, winMat())
        w.position.set(x, y, z)
        if (Math.abs(x) > 1) w.rotation.y = Math.PI / 2
        g.add(w)
      }

      // 地台
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(2.6, 2.6, 0.12, 48),
        new THREE.MeshStandardMaterial({ color: 0x1a2228, roughness: 0.9 })
      )
      base.position.y = -0.06
      g.add(base)

      return g
    }

    let model = null
    function setModel(obj) {
      // 置中 + 正規化大小,讓任何來源的模型都填滿格子
      const box = new THREE.Box3().setFromObject(obj)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z) || 1
      const scale = 3.0 / maxDim
      obj.scale.setScalar(scale)
      obj.position.sub(center.multiplyScalar(scale))
      obj.position.y += (size.y * scale) / 2 - 0.2
      pivot.add(obj)
      model = obj
    }

    // 先放 placeholder,若 glb 載入成功再替換
    const placeholder = buildPlaceholderHouse()
    setModel(placeholder)

    const loader = new GLTFLoader()
    loader.load(
      MODEL_URL,
      (gltf) => {
        pivot.remove(placeholder)
        windowMats.length = 0
        gltf.scene.traverse((o) => {
          if (o.isMesh && o.material && 'emissive' in o.material) windowMats.push(o.material)
        })
        setModel(gltf.scene)
      },
      undefined,
      () => { /* 沒有 house.glb → 維持 placeholder,正常情況 */ }
    )

    // ── 當前燈光狀態(每幀 lerp 到 target)────────────────────────────────────
    const cur = {
      keyColor: new THREE.Color(0xffffff), keyInt: 2.2,
      accent: new THREE.Color(0x4dbaba), accentInt: 1.4,
      ambient: 0.5, fill: 0.6, emissive: 0.3, bg: new THREE.Color(0x0a1416),
    }

    let raf = 0
    const clock = new THREE.Clock()
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const dt = clock.getDelta()
      const t = clock.elapsedTime

      // 自動旋轉
      if (model) pivot.rotation.y += dt * 0.5

      // 目標燈光(依當前 props)
      const { persona, dimKey } = propsRef.current
      const tgt = lightingTarget(persona?.id, dimKey, persona?.accent)
      const k = Math.min(1, dt * 2.5) // lerp 速度
      cur.keyColor.lerp(tgt.keyColor, k)
      cur.accent.lerp(tgt.accent, k)
      cur.bg.lerp(tgt.bg, k)
      cur.keyInt  += (tgt.keyInt  - cur.keyInt)  * k
      cur.accentInt += (tgt.accentInt - cur.accentInt) * k
      cur.ambient += (tgt.ambient - cur.ambient) * k
      cur.fill    += (tgt.fill    - cur.fill)    * k
      cur.emissive += (tgt.emissive - cur.emissive) * k

      // 聲音維度:點光脈動
      const pulse = tgt.pulse ? 1 + Math.sin(t * 6) * 0.35 : 1

      key.color.copy(cur.keyColor); key.intensity = cur.keyInt
      accent.color.copy(cur.accent); accent.intensity = cur.accentInt * pulse
      ambient.intensity = cur.ambient
      fill.intensity = cur.fill
      for (const m of windowMats) {
        m.emissive.copy(cur.accent)
        m.emissiveIntensity = cur.emissive * pulse
      }

      renderer.render(scene, camera)
    }
    animate()

    // ── resize ───────────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth, h = mount.clientHeight
      if (!w || !h) return
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    })
    ro.observe(mount)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      renderer.dispose()
      scene.traverse((o) => {
        if (o.isMesh) { o.geometry?.dispose?.(); const m = o.material; if (Array.isArray(m)) m.forEach(x => x.dispose?.()); else m?.dispose?.() }
      })
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className="house-canvas" />
}
