import BentoTile from './BentoTile.jsx'
import CountUp from './CountUp.jsx'
import HouseCanvas from './HouseCanvas.jsx'
import Icon from '../components/icons.jsx'
import { HOUSE_INFO } from '../houseInfo.js'

// 房屋即時資訊 bento 版 — 卡片感應後顯示,連動寶舖 Sensor。
// 房子那格(three.js)以中性燈光自動旋轉(尚未選情境)。
const byKey = Object.fromEntries(HOUSE_INFO.map((m) => [m.key, m]))

function Stat({ k, color, area, big = false }) {
  const m = byKey[k]
  if (!m) return null
  return (
    <BentoTile color={color} style={{ gridColumn: area.gc, gridRow: area.gr }} delay={area.d || 0}>
      <span className="t-row" style={{ justifyContent: 'space-between' }}>
        <span className="t-eyebrow">{m.label}</span>
        <span className="t-icon"><Icon name={m.icon} /></span>
      </span>
      <span className="t-spacer" />
      {m.text ? (
        <>
          <span className={`t-num ${big ? '' : 't-num--sm'}`}>{m.text}</span>
          <p className="t-foot"><CountUp value={m.value} />{m.unit}</p>
        </>
      ) : (
        <span className={`t-num ${big ? '' : 't-num--sm'}`}>
          <CountUp value={m.value} decimals={m.decimals || 0} /><span className="t-unit"> {m.unit}</span>
        </span>
      )}
    </BentoTile>
  )
}

export default function HouseInfoBento() {
  return (
    <div className="bento">
      {/* hero(加高成 2 列;標題在格內置中留白,不貼底)*/}
      <BentoTile color="cream" style={{ gridColumn: '1 / 3', gridRow: '1 / 3' }}>
        <p className="t-eyebrow">寶舖 Sensor · 數位孿生平台</p>
        <span className="t-spacer" />
        <p className="t-label--lg t-label">這間房子的<br />即時健康資訊</p>
        <span className="t-spacer" />
      </BentoTile>

      <Stat k="pm25"     color="green"  area={{ gc: '3 / 4', gr: '1 / 2', d: 0.05 }} />
      <Stat k="pm25_out" color="orange" area={{ gc: '4 / 5', gr: '1 / 2', d: 0.1 }} />

      {/* 右上 cols5-6 rows1-2 保留給未來的「你的未來居家」3D 房子(目前先空著)*/}

      <Stat k="co2"   color="sky"    area={{ gc: '3 / 4', gr: '2 / 3', d: 0.2 }} />
      <Stat k="temp"  color="coral"  area={{ gc: '4 / 5', gr: '2 / 3', d: 0.25 }} />

      {/* 天氣(大)*/}
      <Stat k="weather" color="sky" area={{ gc: '1 / 3', gr: '3 / 5', d: 0.4 }} big />
      <Stat k="sound"   color="green" area={{ gc: '3 / 4', gr: '3 / 5', d: 0.45 }} />
      <Stat k="rh"    color="purple" area={{ gc: '4 / 5', gr: '3 / 4', d: 0.3 }} />
      <Stat k="light" color="yellow" area={{ gc: '4 / 5', gr: '4 / 5', d: 0.35 }} />

      {/* 宣言(縮成 2 欄,移到右下)*/}
      <BentoTile color="cream" style={{ gridColumn: '5 / 7', gridRow: '3 / 5' }} delay={0.5}>
        <p className="t-eyebrow">12-in-1 Sensor · 24/7</p>
        <span className="t-spacer" />
        <p className="t-label--lg t-label">房子的健康<br />就是你的健康</p>
        <span className="t-spacer" />
        <p className="t-foot">選一個情境鑰匙圈，看寶舖怎麼解</p>
      </BentoTile>
    </div>
  )
}
