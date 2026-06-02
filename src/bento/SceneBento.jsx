import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import BentoTile from './BentoTile.jsx'
import CountUp from './CountUp.jsx'
import HouseCanvas from './HouseCanvas.jsx'
import LineChartTile from './LineChartTile.jsx'
import DonutTile from './DonutTile.jsx'
import Icon from '../components/icons.jsx'
import { DIMENSION_ORDER, DIMENSION_META, SCENES } from '../scenes.js'

// 情境解方 bento 牆 — 5 情境共用版面,資料由 persona 驅動。
// mode='play':依序點亮 4 維度(光照→空氣→溫濕度→聲音),同步把 dimKey 餵給 HouseCanvas
//   讓房子燈光隨維度變化;走完 onComplete()(→ App 的 loop)。
// mode='settled'(loop):全部呈現、房子維持情境基礎燈光,提示換下一個情境。
const DIM_MS = 3800

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
const SCORE = { 'anti-aging': 94, child: 92, elder: 88, pregnancy: 96, nomad: 90 }

export default function SceneBento({ persona, mode = 'play', onComplete }) {
  const [step, setStep] = useState(mode === 'play' ? 0 : -1)
  const data = SCENES[persona.id]

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

  const activeDim = step >= 0 ? DIMENSION_ORDER[step] : null
  const m = (k) => DIMENSION_META[k]
  const dimMetric = (k) => data[k].metrics[0]

  const wellSegments = DIMENSION_ORDER.map((k) => ({ value: 1, color: m(k).tint, label: m(k).label }))
    .concat([{ value: 1, color: persona.accent, label: '整體' }])

  // 大數字磚:把 metric 轉成 count-up 或純文字
  const Num = ({ k, cls = '' }) => {
    const mt = dimMetric(k)
    return (
      <span className={`t-num ${cls}`}>
        {isNum(mt.value) ? <CountUp value={mt.value} decimals={dec(mt.value)} /> : mt.value}
        <span className="t-unit"> {mt.unit}</span>
      </span>
    )
  }

  return (
    <div className="bento">
      {/* 情境主角 hero */}
      <BentoTile color="cream" delay={0} style={{ gridColumn: '1 / 3', gridRow: '1 / 2' }}>
        <p className="t-eyebrow" style={{ color: persona.accent }}>情境 · {persona.name}</p>
        <span className="t-spacer" />
        <p className="t-label--lg t-label">{persona.prompt}</p>
        <p className="t-foot">{persona.title}</p>
      </BentoTile>

      {/* ① 光照 */}
      <BentoTile color="yellow" delay={0.05} active={activeDim === 'light'} style={{ gridColumn: '3 / 4', gridRow: '1 / 2' }}>
        <span className="t-badge">①</span>
        <Num k="light" cls="t-num--sm" />
        <span className="t-spacer" />
        <p className="t-label">{m('light').label} · {data.light.headline}</p>
      </BentoTile>

      {/* ② 空氣 */}
      <BentoTile color="green" delay={0.1} active={activeDim === 'air'} style={{ gridColumn: '4 / 5', gridRow: '1 / 2' }}>
        <span className="t-badge">②</span>
        <Num k="air" cls="t-num--sm" />
        <span className="t-spacer" />
        <p className="t-label">{m('air').label} · PM2.5</p>
      </BentoTile>

      {/* 房子 3D（唯一 three.js）— 對應 reference 右上人臉那格 */}
      <BentoTile color="ink" flush delay={0.15} className="house-tile" style={{ gridColumn: '5 / 7', gridRow: '1 / 3' }}>
        <span className="house-tile__badge">3D · 自動旋轉</span>
        <HouseCanvas persona={persona} dimKey={activeDim} />
        <div className="house-tile__cap">
          <b>你的未來居家</b>
          <span>環境隨情境即時調節</span>
        </div>
      </BentoTile>

      {/* ③ 溫濕度 */}
      <BentoTile color="sky" delay={0.2} active={activeDim === 'temp'} style={{ gridColumn: '1 / 2', gridRow: '2 / 3' }}>
        <span className="t-badge">③</span>
        <Num k="temp" cls="t-num--sm" />
        <span className="t-spacer" />
        <p className="t-label">{m('temp').label}</p>
      </BentoTile>

      {/* ④ 聲音 EQ */}
      <BentoTile color="purple" delay={0.25} active={activeDim === 'sound'} style={{ gridColumn: '2 / 4', gridRow: '2 / 3' }}>
        <span className="t-badge">④</span>
        <div className="t-row" style={{ alignItems: 'baseline' }}>
          <span className="t-num t-num--sm"><CountUp value={dimMetric('sound').value} /><span className="t-unit"> {dimMetric('sound').unit}</span></span>
        </div>
        <Eq active={activeDim === 'sound' || mode !== 'play'} />
        <p className="t-foot">{m('sound').label} · {data.sound.sound}</p>
      </BentoTile>

      {/* 全健築指數(大數字宣言)*/}
      <BentoTile color="coral" delay={0.3} style={{ gridColumn: '4 / 5', gridRow: '2 / 3' }}>
        <p className="t-eyebrow">全健築指數</p>
        <span className="t-spacer" />
        <span className="t-num t-num--sm"><CountUp value={SCORE[persona.id] || 90} /><span className="t-unit">/100</span></span>
      </BentoTile>

      {/* 健康趨勢 線圖 */}
      <BentoTile color="cream" delay={0.35} style={{ gridColumn: '1 / 4', gridRow: '3 / 5' }}>
        <LineChartTile values={TREND[persona.id] || TREND['anti-aging']} title="健康趨勢 · 入住後 30 天" accent={persona.accent} />
      </BentoTile>

      {/* WELL 五維 甜甜圈 */}
      <BentoTile color="cream" delay={0.4} style={{ gridColumn: '4 / 5', gridRow: '3 / 5' }}>
        <p className="t-eyebrow">WELL 五維</p>
        <DonutTile segments={wellSegments} centerTop="WELL" centerSub="balanced" />
      </BentoTile>

      {/* 解方宣言 + 進度 */}
      <BentoTile color="ink" delay={0.45} style={{ gridColumn: '5 / 7', gridRow: '3 / 5' }}>
        <p className="t-eyebrow" style={{ color: persona.accent }}>你的痛點 · 寶舖有解方</p>
        <span className="t-spacer" />
        <p className="t-label--lg t-label" style={{ color: '#fff' }}>{persona.line}</p>
        <span className="t-spacer" />
        <div className="dim-dots" style={{ color: persona.accent }}>
          {DIMENSION_ORDER.map((k, i) => <i key={k} className={mode !== 'play' || i <= step ? 'on' : ''} />)}
        </div>
        <p className="t-foot" style={{ color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
          {mode === 'play' ? '環境同步中 · 燈光 / 空氣 / 溫濕度 / 聲音' : '拿起鑰匙圈，換下一個情境'}
        </p>
      </BentoTile>
    </div>
  )
}

// 聲音 EQ 條(bento 版)
function Eq({ active }) {
  const N = 16
  return (
    <div className="bento-eq">
      {Array.from({ length: N }, (_, i) => {
        const env = 0.3 + Math.sin((i / (N - 1)) * Math.PI) * 0.7
        return (
          <motion.span
            key={i}
            style={{ background: 'currentColor', height: '100%' }}
            animate={active
              ? { scaleY: [env * 0.3, env, env * 0.5, env * 0.85, env * 0.3] }
              : { scaleY: 0.2 }}
            transition={active ? { duration: 0.8 + (i % 5) * 0.12, delay: (i % 6) * 0.06, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
          />
        )
      })}
    </div>
  )
}
