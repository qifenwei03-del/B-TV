import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import CountUp from './CountUp.jsx'
import HouseCanvas from './HouseCanvas.jsx'
import LineChartTile from './LineChartTile.jsx'
import DonutTile from './DonutTile.jsx'
import { DIMENSION_ORDER, DIMENSION_META, SCENES } from '../scenes.js'

// 情境解方牆 — 參考 reference GIF 的「3 欄」結構:
//   ▍版面分 3 欄;每欄是一個垂直捲軸(reel)。
//   ▍一次只動「一欄」:左→中→右輪流,輪到的那欄「整欄卡片一起往上捲」換到下一頁。
//   ▍方向一致(往上),不是每格各自亂跳。
//   ▍3D 房子(右欄)與情境主角(左欄)是固定錨點,不參與捲動。
//   ▍數字只在卡片「換頁掛載」時 count-up 一次到定位,之後鎖住。
//   ▍房子燈光仍依 4 維度輪一次驅動(play 走完 → onComplete → loop)。
const DIM_MS  = 3800   // 房子燈光每維度停留
const BEAT_MS  = 2400  // 每拍動一欄(每欄等於每 3 拍換一次頁)

const isNum = (v) => /^[\d.]+$/.test(String(v))
const dec = (v) => (String(v).includes('.') ? 1 : 0)

const TREND = {
  'anti-aging': [0.35, 0.4, 0.46, 0.52, 0.6, 0.66, 0.74, 0.82],
  child:        [0.4, 0.48, 0.52, 0.58, 0.63, 0.71, 0.78, 0.85],
  elder:        [0.3, 0.36, 0.45, 0.5, 0.55, 0.62, 0.7, 0.76],
  pregnancy:    [0.45, 0.5, 0.55, 0.6, 0.66, 0.72, 0.8, 0.88],
  nomad:        [0.38, 0.46, 0.5, 0.57, 0.64, 0.69, 0.77, 0.84],
}
const SCORE   = { 'anti-aging': 94, child: 92, elder: 88, pregnancy: 96, nomad: 90 }
const SAVE    = { 'anti-aging': 26, child: 22, elder: 20, pregnancy: 24, nomad: 30 }
const COMFORT = { 'anti-aging': 95, child: 93, elder: 90, pregnancy: 97, nomad: 92 }
const DIM_COLOR = { light: 'yellow', air: 'green', temp: 'sky', sound: 'purple' }
const DIM_BADGE = { light: '①', air: '②', temp: '③', sound: '④' }

// 取某欄第 p 頁的 size 張卡(modulo 循環)
function pageItems(pool, p, size) {
  const out = []
  for (let i = 0; i < size; i++) out.push(pool[(p * size + i) % pool.length])
  return out
}

// ── 卡片內容(純元件,只在掛載時 count-up 一次)───────────────────────────────
function CardFace({ card }) {
  if (card.kind === 'line') {
    return (
      <div className="tile tile--cream col-card">
        <LineChartTile values={card.values} title={card.title} accent={card.accent} />
      </div>
    )
  }
  if (card.kind === 'donut') {
    return (
      <div className="tile tile--cream col-card">
        <p className="t-eyebrow">WELL 五維</p>
        <DonutTile segments={card.segments} centerTop="WELL" centerSub="balanced" />
      </div>
    )
  }
  if (card.kind === 'feature') {
    return (
      <div className="tile tile--ink col-card">
        <span className="t-eyebrow" style={{ color: card.accent }}>{card.eyebrow}</span>
        <span className="t-spacer" />
        <p className="t-label--lg t-label" style={{ color: '#fff' }}>{card.text}</p>
      </div>
    )
  }
  // stat
  return (
    <div className={`tile tile--${card.color} col-card`}>
      {card.badge && <span className="t-badge">{card.badge}</span>}
      <span className="t-eyebrow">{card.eyebrow}</span>
      <span className="t-spacer" />
      <span className="t-num t-num--sm">
        {isNum(card.value) ? <CountUp value={card.value} decimals={dec(card.value)} /> : card.value}
        <span className="t-unit"> {card.unit}</span>
      </span>
      {card.foot && <p className="t-foot">{card.foot}</p>}
    </div>
  )
}

// ── 一欄:固定錨點(可選)+ 捲軸(整頁一起往上滑)────────────────────────────
function Column({ className, anchor, pool, size, page }) {
  const cards = pageItems(pool, page, size)
  return (
    <div className={`scene-col ${className || ''}`}>
      {anchor}
      <div className="reel">
        <AnimatePresence initial={false}>
          <motion.div
            key={page}
            className="reel-page"
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {cards.map((c) => <CardFace key={c.key} card={c} />)}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function SceneBento({ persona, mode = 'play', onComplete }) {
  const data = SCENES[persona.id]
  const [step, setStep] = useState(mode === 'play' ? 0 : -1)
  const [pages, setPages] = useState([0, 0, 0]) // 三欄各自的頁碼

  // 房子燈光:依序輪 4 維度;play 走完 → onComplete(→ loop)
  useEffect(() => {
    if (mode !== 'play') { setStep(-1); return }
    setStep(0)
    let i = 0
    const id = setInterval(() => {
      i += 1
      if (i >= DIMENSION_ORDER.length) {
        clearInterval(id)
        setTimeout(() => onComplete?.(), DIM_MS)
        return
      }
      setStep(i)
    }, DIM_MS)
    return () => clearInterval(id)
  }, [persona.id, mode, onComplete])

  // 一次動一欄:每拍讓「下一欄」換頁(左→中→右輪流)
  useEffect(() => {
    setPages([0, 0, 0])
    let beat = 0
    const id = setInterval(() => {
      const col = beat % 3
      setPages((p) => { const n = [...p]; n[col] += 1; return n })
      beat += 1
    }, BEAT_MS)
    return () => clearInterval(id)
  }, [persona.id])

  const activeDim = step >= 0 ? DIMENSION_ORDER[step] : null
  const dimCard = (k) => ({
    key: `${k}0`, kind: 'stat', color: DIM_COLOR[k], badge: DIM_BADGE[k],
    eyebrow: DIMENSION_META[k].label, value: data[k].metrics[0].value,
    unit: data[k].metrics[0].unit, foot: data[k].headline,
  })
  const sec = (k, color, eyebrow) => {
    const m1 = data[k].metrics[1]
    return m1 && { key: `${k}1`, kind: 'stat', color, eyebrow, value: m1.value, unit: m1.unit, foot: m1.note }
  }

  const wellSegments = DIMENSION_ORDER
    .map((k) => ({ value: 1, color: DIMENSION_META[k].tint, label: DIMENSION_META[k].label }))
    .concat([{ value: 1, color: persona.accent, label: '整體' }])

  // 三欄卡池
  const poolL = [
    dimCard('light'), dimCard('air'), dimCard('temp'), dimCard('sound'),
    { key: 'score', kind: 'stat', color: 'coral', eyebrow: '全健築指數', value: SCORE[persona.id] || 90, unit: '/100', foot: 'WELL Building Standard' },
    { key: 'save', kind: 'stat', color: 'orange', eyebrow: '預估節能', value: SAVE[persona.id] || 25, unit: '%', foot: '對比一般住宅' },
  ]
  const poolM = [
    { key: 'line', kind: 'line', title: '健康趨勢 · 入住後 30 天', values: TREND[persona.id] || TREND['anti-aging'], accent: persona.accent },
    { key: 'donut', kind: 'donut', segments: wellSegments },
    { key: 'comfort', kind: 'stat', color: 'sky', eyebrow: '體感舒適', value: COMFORT[persona.id] || 94, unit: '%', foot: '入住回饋' },
    { key: 'well', kind: 'stat', color: 'green', eyebrow: 'WELL 認證', value: 5, unit: '維達標', foot: '空氣 / 水 / 光 / 熱 / 聲' },
    sec('light', 'yellow', `光照 · ${data.light.metrics[1]?.note || ''}`),
    sec('temp', 'purple', `溫濕度 · ${data.temp.metrics[1]?.note || ''}`),
  ].filter(Boolean)
  const poolR = [
    { key: 'sol', kind: 'feature', accent: persona.accent, eyebrow: '你的痛點 · 寶舖有解方', text: persona.line },
    { key: 'fl', kind: 'feature', accent: DIMENSION_META.light.tint, eyebrow: '① 光照解方', text: data.light.headline },
    { key: 'fa', kind: 'feature', accent: DIMENSION_META.air.tint, eyebrow: '② 空氣解方', text: data.air.headline },
    { key: 'ft', kind: 'feature', accent: DIMENSION_META.temp.tint, eyebrow: '③ 溫濕度解方', text: data.temp.headline },
    { key: 'fs', kind: 'feature', accent: DIMENSION_META.sound.tint, eyebrow: '④ 聲音解方', text: data.sound.headline },
  ]

  const hero = (
    <div className="tile tile--cream col-anchor col-anchor--hero">
      <p className="t-eyebrow" style={{ color: persona.accent }}>情境 · {persona.name}</p>
      <span className="t-spacer" />
      <p className="t-label--lg t-label">{persona.prompt}</p>
      <p className="t-foot">{persona.title}</p>
    </div>
  )
  const house = (
    <div className="tile tile--ink col-anchor col-anchor--house house-tile" style={{ padding: 0 }}>
      <span className="house-tile__badge">3D · 自動旋轉</span>
      <HouseCanvas persona={persona} dimKey={activeDim} />
      <div className="house-tile__cap"><b>你的未來居家</b><span>環境隨情境即時調節</span></div>
    </div>
  )

  return (
    <div className="scene-cols">
      <Column className="scene-col--l" anchor={hero} pool={poolL} size={2} page={pages[0]} />
      <Column className="scene-col--m" pool={poolM} size={2} page={pages[1]} />
      <Column className="scene-col--r" anchor={house} pool={poolR} size={1} page={pages[2]} />
    </div>
  )
}
