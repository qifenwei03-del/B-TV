import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import BentoTile from './BentoTile.jsx'
import CountUp from './CountUp.jsx'
import HouseCanvas from './HouseCanvas.jsx'
import LineChartTile from './LineChartTile.jsx'
import DonutTile from './DonutTile.jsx'
import { DIMENSION_ORDER, DIMENSION_META, SCENES } from '../scenes.js'

// 情境解方 bento 牆 — 5 情境共用版面,資料由 persona 驅動。
//
// ▍數字:每張卡「出現時」count-up 一次到定位,之後鎖住不再跳(卡片元件為穩定型別,
//   不會因 re-render 重掛而重數)。
// ▍卡片輪替:固定錨點(主角 / 房子 / 趨勢圖 / 甜甜圈)之外,有 6 個小格 + 1 個大格
//   會像 reference GIF 那樣,每隔幾秒從卡池抽下一張、以遮罩滑動換卡(新卡數字才 count-up)。
// ▍房子燈光:仍依 4 維度(光照→空氣→溫濕度→聲音)輪一次驅動 three.js 房子變光,
//   走完 onComplete()(→ App 的 loop);輪替動畫在 play / loop 都持續。
const DIM_MS    = 3800   // 房子燈光每維度停留
const ROTATE_MS = 4200   // 卡片輪替間隔

const isNum = (v) => /^[\d.]+$/.test(String(v))
const dec = (v) => (String(v).includes('.') ? 1 : 0)

// 各情境健康趨勢(0–1,呈上升)— 展演用,真值待寶舖數據表。
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

// ── 卡池(輪替用)──────────────────────────────────────────────────────────────
// 小卡(1×1):數字 / 短資訊。注意:輪替格內不放無限動畫(避免 exit 卡死)。
function buildStatPool(persona, data) {
  const cards = []
  for (const k of DIMENSION_ORDER) {
    const meta = DIMENSION_META[k]
    const m0 = data[k].metrics[0]
    cards.push({ key: `${k}-0`, color: DIM_COLOR[k], badge: DIM_BADGE[k], eyebrow: meta.label, value: m0.value, unit: m0.unit, foot: data[k].headline })
    const m1 = data[k].metrics[1]
    if (m1) cards.push({ key: `${k}-1`, color: k === 'light' ? 'orange' : 'cream', eyebrow: `${meta.label} · ${m1.note}`, value: m1.value, unit: m1.unit, foot: meta.en })
  }
  cards.push({ key: 'score',   color: 'coral', eyebrow: '全健築指數', value: SCORE[persona.id]   || 90, unit: '/100', foot: 'WELL Building Standard' })
  cards.push({ key: 'save',    color: 'green', eyebrow: '預估節能',   value: SAVE[persona.id]    || 25, unit: '%',    foot: '對比一般住宅' })
  cards.push({ key: 'comfort', color: 'sky',   eyebrow: '體感舒適',   value: COMFORT[persona.id] || 94, unit: '%',    foot: '入住回饋' })
  cards.push({ key: 'well',    color: 'cream', eyebrow: 'WELL 認證',  value: 5, unit: '維達標', foot: '空氣 / 水 / 光 / 熱 / 聲' })
  return cards
}

// 大卡(2×2):解方標語(文字)。
function buildFeaturePool(persona, data) {
  return [
    { key: 'sol',     accent: persona.accent, eyebrow: '你的痛點 · 寶舖有解方', text: persona.line },
    { key: 'f-light', accent: DIMENSION_META.light.tint, eyebrow: '① 光照解方',   text: data.light.headline },
    { key: 'f-air',   accent: DIMENSION_META.air.tint,   eyebrow: '② 空氣解方',   text: data.air.headline },
    { key: 'f-temp',  accent: DIMENSION_META.temp.tint,  eyebrow: '③ 溫濕度解方', text: data.temp.headline },
    { key: 'f-sound', accent: DIMENSION_META.sound.tint, eyebrow: '④ 聲音解方',   text: data.sound.headline },
  ]
}

// 小卡內容(穩定型別 → 只在「換卡掛載」時 count-up 一次,之後鎖住)
function StatFace({ card, delay = 0 }) {
  return (
    <motion.div
      className={`tile tile--${card.color} card-face`}
      initial={{ opacity: 0, y: '45%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '-45%' }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {card.badge && <span className="t-badge">{card.badge}</span>}
      <span className="t-eyebrow">{card.eyebrow}</span>
      <span className="t-spacer" />
      <span className="t-num t-num--sm">
        {isNum(card.value) ? <CountUp value={card.value} decimals={dec(card.value)} /> : card.value}
        <span className="t-unit"> {card.unit}</span>
      </span>
      {card.foot && <p className="t-foot">{card.foot}</p>}
    </motion.div>
  )
}

function FeatureFace({ card, delay = 0 }) {
  return (
    <motion.div
      className="tile tile--ink card-face"
      initial={{ opacity: 0, y: '30%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '-30%' }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="t-eyebrow" style={{ color: card.accent }}>{card.eyebrow}</span>
      <span className="t-spacer" />
      <p className="t-label--lg t-label" style={{ color: '#fff' }}>{card.text}</p>
    </motion.div>
  )
}

// 輪替格:固定 grid 位置,內容每 tick 換下一張卡(遮罩滑動)。
function RotatingSlot({ pool, index, tick, area, big = false }) {
  const card = pool[(tick + index) % pool.length]
  const Face = big ? FeatureFace : StatFace
  return (
    <div className="slot" style={{ gridColumn: area.gc, gridRow: area.gr }}>
      <AnimatePresence>
        <Face key={card.key} card={card} delay={(index % 4) * 0.07} />
      </AnimatePresence>
    </div>
  )
}

export default function SceneBento({ persona, mode = 'play', onComplete }) {
  const data = SCENES[persona.id]
  const [step, setStep] = useState(mode === 'play' ? 0 : -1)
  const [tick, setTick] = useState(0)

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

  // 卡片輪替(play / loop 都持續)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), ROTATE_MS)
    return () => clearInterval(id)
  }, [persona.id])

  const activeDim = step >= 0 ? DIMENSION_ORDER[step] : null
  const statPool = buildStatPool(persona, data)
  const featurePool = buildFeaturePool(persona, data)

  const wellSegments = DIMENSION_ORDER
    .map((k) => ({ value: 1, color: DIMENSION_META[k].tint, label: DIMENSION_META[k].label }))
    .concat([{ value: 1, color: persona.accent, label: '整體' }])

  // 6 個小卡輪替格的位置
  const STAT_SLOTS = [
    { gc: '3 / 4', gr: '1 / 2' }, { gc: '4 / 5', gr: '1 / 2' },
    { gc: '1 / 2', gr: '2 / 3' }, { gc: '2 / 3', gr: '2 / 3' },
    { gc: '3 / 4', gr: '2 / 3' }, { gc: '4 / 5', gr: '2 / 3' },
  ]

  return (
    <div className="bento">
      {/* ── 錨點:情境主角 ── */}
      <BentoTile color="cream" style={{ gridColumn: '1 / 3', gridRow: '1 / 2' }}>
        <p className="t-eyebrow" style={{ color: persona.accent }}>情境 · {persona.name}</p>
        <span className="t-spacer" />
        <p className="t-label--lg t-label">{persona.prompt}</p>
        <p className="t-foot">{persona.title}</p>
      </BentoTile>

      {/* ── 錨點:房子 3D（唯一 three.js,燈光隨維度變化）── */}
      <BentoTile color="ink" flush className="house-tile" style={{ gridColumn: '5 / 7', gridRow: '1 / 3' }}>
        <span className="house-tile__badge">3D · 自動旋轉</span>
        <HouseCanvas persona={persona} dimKey={activeDim} />
        <div className="house-tile__cap">
          <b>你的未來居家</b>
          <span>環境隨情境即時調節</span>
        </div>
      </BentoTile>

      {/* ── 輪替:6 個小卡 ── */}
      {STAT_SLOTS.map((area, i) => (
        <RotatingSlot key={i} pool={statPool} index={i} tick={tick} area={area} />
      ))}

      {/* ── 錨點:健康趨勢 線圖 ── */}
      <BentoTile color="cream" style={{ gridColumn: '1 / 3', gridRow: '3 / 5' }}>
        <LineChartTile values={TREND[persona.id] || TREND['anti-aging']} title="健康趨勢 · 入住後 30 天" accent={persona.accent} />
      </BentoTile>

      {/* ── 錨點:WELL 五維 甜甜圈 ── */}
      <BentoTile color="cream" style={{ gridColumn: '3 / 5', gridRow: '3 / 5' }}>
        <p className="t-eyebrow">WELL 五維</p>
        <DonutTile segments={wellSegments} centerTop="WELL" centerSub="balanced" />
      </BentoTile>

      {/* ── 輪替:大卡(解方標語)── */}
      <RotatingSlot pool={featurePool} index={0} tick={tick} area={{ gc: '5 / 7', gr: '3 / 5' }} big />
    </div>
  )
}
