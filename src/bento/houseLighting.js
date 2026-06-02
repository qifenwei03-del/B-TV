import * as THREE from 'three'

// ── 每情境 × 每維度的房子燈光預設 ─────────────────────────────────────────────
// 「隨著每個情境變換燈光」:persona 決定基礎光氛(對應 OTA120 情境調性),
// scene 解方依序展演時,當前維度再微調(光照→提亮暖冷、聲音→脈動…)。
// HouseCanvas 每幀把當前燈光 lerp 到此處算出的 target,過場平滑。
//
// 欄位:key(主光色/強度)、accent(情境主色點光)、ambient、bg(畫布底色)、
//       fill(補光強度)、emissive(窗戶自發光強度 0-1)。

const PRESET = {
  'anti-aging': { keyColor: 0xcfe2ff, keyInt: 2.2, ambient: 0.45, fill: 0.6, emissive: 0.35, bg: 0x0d1626 }, // 晝夜節律 · 冷白晝光
  child:        { keyColor: 0xffffff, keyInt: 2.6, ambient: 0.65, fill: 0.8, emissive: 0.30, bg: 0x0c1c14 }, // 全光譜 · 明亮中性
  elder:        { keyColor: 0xffd9a0, keyInt: 2.4, ambient: 0.5,  fill: 0.6, emissive: 0.5,  bg: 0x1c1408 }, // 高照度暖白
  pregnancy:    { keyColor: 0xffcbe0, keyInt: 1.5, ambient: 0.4,  fill: 0.45, emissive: 0.4, bg: 0x1c0d16 }, // 柔和無頻閃暖光 · 偏暗
  nomad:        { keyColor: 0xdff0ff, keyInt: 2.5, ambient: 0.5,  fill: 0.7, emissive: 0.3,  bg: 0x0a1820 }, // 專注日光白
}

// 當前維度對基礎預設的微調(乘 / 加)。
const DIM_MOD = {
  light: { keyMul: 1.25, emissiveAdd: 0.25, ambientMul: 1.15 },  // 光照展演:整體提亮
  air:   { keyTint: 0xbfe9ff, keyMul: 1.0 },                      // 空氣:微冷
  temp:  { keyTint: 0xffd2a8, keyMul: 1.0 },                      // 溫濕度:微暖
  sound: { keyMul: 1.0, pulse: true },                            // 聲音:脈動(在 canvas 內以時間調變)
}

const FALLBACK = { keyColor: 0xffffff, keyInt: 2.2, ambient: 0.5, fill: 0.6, emissive: 0.3, bg: 0x0a1416 }

// 回傳該 persona + dimension 的 target 燈光物件(色用 THREE.Color)。
export function lightingTarget(personaId, dimKey, accentHex) {
  const base = PRESET[personaId] || FALLBACK
  const mod  = dimKey ? DIM_MOD[dimKey] : null

  const keyColor = new THREE.Color(mod?.keyTint ?? base.keyColor)
  const accent   = new THREE.Color(accentHex || '#4dbaba')

  return {
    keyColor,
    keyInt:    base.keyInt * (mod?.keyMul ?? 1),
    accent,
    accentInt: 1.4,
    ambient:   base.ambient * (mod?.ambientMul ?? 1),
    fill:      base.fill,
    emissive:  Math.min(1, base.emissive + (mod?.emissiveAdd ?? 0)),
    bg:        new THREE.Color(base.bg),
    pulse:     !!mod?.pulse,
  }
}
