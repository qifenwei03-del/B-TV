import { useEffect, useReducer, useCallback } from 'react'
import { motion } from 'framer-motion'
import { PERSONAS, PERSONA_ORDER } from './personas.js'
import { useNfcSocket } from './useNfcSocket.js'

import Idle from './components/Idle.jsx'
import Intro from './components/Intro.jsx'
import PlacePrompt from './components/PlacePrompt.jsx'
import Outro from './components/Outro.jsx'
import ConfirmRipple from './components/ConfirmRipple.jsx'
import StatusDot from './components/StatusDot.jsx'
// 情境展演(房屋即時資訊 + 5 情境解方)改為 bento 動態資料牆;房子那格為 three.js。
import HouseInfoBento from './bento/HouseInfoBento.jsx'
import SceneBento from './bento/SceneBento.jsx'
import './bento/bento.css'

// ── 畫面節奏(ms)──────────────────────────────────────────────────────────────
// 前言 / 房屋資訊 / 結語為「導覽人員操控 + 自動續播」雙保險:展務員可手動 advance,
// 不操作則於下列時間自動推進,避免現場卡住。
const INTRO_MS = 11000   // 開場 + 倒數 3-2-1
const HOUSE_MS = 11000   // 房屋即時資訊閱讀時間 → 自動轉「請選角色」
const OUTRO_MS = 9000    // 結語
const CONFIRM_MS = 1800
const IDLE_RESET_MS = 90000  // 體驗中無任何 NFC 活動逾時 → 自動播結語、回待機(換下一位)

const initial = {
  phase:       'idle',   // idle | intro | card | house | character | scene | loop | outro
  wsStatus:    'connecting',
  connected:   false,    // reader 在線
  cardScanned: false,
  character:   null,     // persona id 驅動場景
  onReader:    null,     // 'card' | 'character' | null
  confirm:     null,     // { kind, id, seq } 感應成功漣漪
  seq:         0,
  sceneRun:    0,        // 每次進入 scene 遞增 → 強制 SceneSequence 重播
  activity:    0,        // 每次 NFC 事件遞增 → 重置「無人活動」倒數
}

function reducer(state, a) {
  switch (a.type) {
    case 'ws-status':          return { ...state, wsStatus: a.status }
    case 'reader-connected':   return { ...state, connected: true }
    case 'reader-disconnected':return { ...state, connected: false, onReader: null }

    case 'tag-present': {
      const kind = a.data?.kind
      const seq  = state.seq + 1
      const activity = state.activity + 1
      if (kind === 'card') {
        // 邀請卡 = 開場觸發:待機 → 自動播前言(→ 房屋資訊)。
        // 已在體驗中再刷卡不打斷;單一感應點下卡只會在開頭刷一次。
        const start = ['idle', 'card'].includes(state.phase)
        return {
          ...state, cardScanned: true, onReader: 'card',
          phase: start ? 'intro' : state.phase,
          character: start ? null : state.character,
          confirm: { kind: 'card', id: 'invite', seq }, seq, activity,
        }
      }
      if (kind === 'character' && PERSONAS[a.data.id]) {
        // 角色鑰匙圈:任何時候刷上 → 進入該情境解方動畫(可從 loop 直接換角色)
        return {
          ...state, cardScanned: true, character: a.data.id, onReader: 'character',
          phase: 'scene', sceneRun: state.sceneRun + 1,
          confirm: { kind: 'character', id: a.data.id, seq }, seq, activity,
        }
      }
      return state // 未註冊 / 未知 tag → 忽略
    }

    case 'tag-remove':
      // 拿起卡 / 鑰匙圈:只清 onReader(單一感應點要拿起卡才能放鑰匙圈),
      // 場景 / loop 保留當前 persona;bump activity 重置無人倒數。
      return { ...state, onReader: null, activity: state.activity + 1 }

    case 'confirm-clear':
      return state.confirm?.seq === a.seq ? { ...state, confirm: null } : state

    // ── 自動續播 / 流程控制 ─────────────────────────────────────────────────────
    case 'op-intro':   // 開始體驗:待機 → 前言(server override / 鍵盤測試)
      return { ...initial, wsStatus: state.wsStatus, connected: state.connected, phase: 'intro' }
    case 'intro-done': // 前言播完 → 房屋即時資訊
      return state.phase === 'intro' ? { ...state, phase: 'house' } : state
    case 'house-done': // 房屋資訊看完 → 提示選角色
      return state.phase === 'house' ? { ...state, phase: 'character' } : state
    case 'op-advance':
      if (state.phase === 'intro') return { ...state, phase: 'house' }
      if (state.phase === 'house') return { ...state, phase: 'character' }
      return state
    case 'scene-done':
      return state.phase === 'scene' ? { ...state, phase: 'loop' } : state
    case 'op-outro':
      return { ...state, phase: 'outro', onReader: null }
    case 'outro-done':
      return state.phase === 'outro'
        ? { ...initial, wsStatus: state.wsStatus, connected: state.connected }
        : state
    case 'auto-end':
      // 無人活動逾時:已體驗過(house 之後)→ 播結語收尾;否則直接回待機。
      if (['idle', 'intro', 'outro'].includes(state.phase)) return state
      return { ...state, phase: 'outro', onReader: null }
    case 'op-reset':
      return { ...initial, wsStatus: state.wsStatus, connected: state.connected }

    default: return state
  }
}

export default function App() {
  const [s, dispatch] = useReducer(reducer, initial)

  // ── NFC WebSocket(path A:直接連 8788,自行推導狀態)─────────────────────────
  const onMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'reader-connected':    dispatch({ type: 'reader-connected' }); break
      case 'reader-disconnected': dispatch({ type: 'reader-disconnected' }); break
      case 'tag-present':         dispatch({ type: 'tag-present', data: msg.data }); break
      case 'tag-remove':          dispatch({ type: 'tag-remove' }); break
      case 'reset':               dispatch({ type: 'op-reset' }); break       // server override
      case 'intro':               dispatch({ type: 'op-intro' }); break        // server override
      case 'outro':               dispatch({ type: 'op-outro' }); break        // server override
      default: break
    }
  }, [])
  const onStatus = useCallback((status) => dispatch({ type: 'ws-status', status }), [])
  const { send } = useNfcSocket(onMessage, onStatus)

  // ── 自動續播計時器(前言 / 房屋資訊 / 結語)────────────────────────────────────
  useEffect(() => {
    if (s.phase === 'intro') { const t = setTimeout(() => dispatch({ type: 'intro-done' }), INTRO_MS); return () => clearTimeout(t) }
    if (s.phase === 'house') { const t = setTimeout(() => dispatch({ type: 'house-done' }), HOUSE_MS); return () => clearTimeout(t) }
    if (s.phase === 'outro') { const t = setTimeout(() => dispatch({ type: 'outro-done' }), OUTRO_MS); return () => clearTimeout(t) }
  }, [s.phase])

  // ── 無人活動逾時 → 自動收尾(全 NFC 驅動,現場不需在電視端操作)──────────────
  //   體驗中(house/character/scene/loop)若 IDLE_RESET_MS 內沒有任何刷卡 / 拿起,
  //   視為訪客離開 → 播結語 → 回待機等下一位。每次 NFC 事件(activity)重置倒數。
  useEffect(() => {
    if (['idle', 'intro', 'outro'].includes(s.phase)) return
    const t = setTimeout(() => dispatch({ type: 'auto-end' }), IDLE_RESET_MS)
    return () => clearTimeout(t)
  }, [s.phase, s.activity])

  // ── 感應成功漣漪自動消失 ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!s.confirm) return
    const seq = s.confirm.seq
    const t = setTimeout(() => dispatch({ type: 'confirm-clear', seq }), CONFIRM_MS)
    return () => clearTimeout(t)
  }, [s.confirm])

  // ── 鍵盤:展務員流程控制 + 無硬體開發模擬 ────────────────────────────────────
  //   操作:i/Enter 開始(前言) · n/→ 下一步 · o 結語 · r/Esc 重置
  //   模擬:c 刷邀請卡 · 1-5 刷角色鑰匙圈 · x/Space 拿起 · (對齊 B-Table)
  //   NFC 模擬與 reset/intro/outro 走 server 廣播(`send`),讓桌面 + 電視同步;
  //   未連線時 fallback 成本機處理(純電視測試)。n/advance 為電視本機流程,不廣播。
  useEffect(() => {
    const relay = (obj) => { if (!send(obj)) onMessage(obj) }
    const onKey = (e) => {
      const k = e.key
      if (k === 'i' || k === 'I' || k === 'Enter')      relay({ type: 'intro' })
      else if (k === 'n' || k === 'N' || k === 'ArrowRight') dispatch({ type: 'op-advance' })
      else if (k === 'o' || k === 'O')                  relay({ type: 'outro' })
      else if (k === 'r' || k === 'R' || k === 'Escape') relay({ type: 'reset' })
      else if (k === 'c' || k === 'C')                  relay({ type: 'tag-present', data: { id: 'invite', kind: 'card' } })
      else if (k >= '1' && k <= '5')                    relay({ type: 'tag-present', data: { id: PERSONA_ORDER[Number(k) - 1], kind: 'character' } })
      else if (k === 'x' || k === 'X' || k === ' ')     relay({ type: 'tag-remove' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onMessage, send])

  const persona = s.character ? PERSONAS[s.character] : null
  // 場景 / loop 用 persona 主色;其餘畫面回到品牌 teal。
  const accent = (s.phase === 'scene' || s.phase === 'loop') && persona ? persona.accent : null

  const screen = renderScreen(s, persona, dispatch)

  return (
    <div className="stage" style={accent ? { '--scene-accent': accent } : undefined}>
      <div className="stage__vignette" />

      {/* 不用 AnimatePresence:待機 / 前言 / 聲音 EQ 等畫面含 repeat:Infinity 動畫,
          會讓 AnimatePresence 的 exit 永遠不 settle → 卡在舊畫面(SensorRing 註解的雷)。
          改成單一 keyed 畫面 + 進場淡入;key 變即由 React 直接換掉(kiosk 切換俐落、不卡)。
          scene/loop 共用 key 讓 three.js 房子不重載。 */}
      <motion.div
        key={(s.phase === 'scene' || s.phase === 'loop') ? `scene-${s.sceneRun}` : s.phase}
        className="screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {screen}
      </motion.div>

      {s.confirm && (
        <ConfirmRipple
          key={s.confirm.seq}
          accent={s.confirm.kind === 'character' ? PERSONAS[s.confirm.id]?.accent : null}
        />
      )}

      <StatusDot wsStatus={s.wsStatus} connected={s.connected} phase={s.phase} />
    </div>
  )
}

function renderScreen(s, persona, dispatch) {
  switch (s.phase) {
    case 'idle':      return <Idle />
    case 'intro':     return <Intro />
    case 'card':      return <PlacePrompt kind="card" />
    case 'house':     return <HouseInfoBento />
    case 'character': return <PlacePrompt kind="character" />
    case 'scene':     return <SceneBento persona={persona} mode="play" onComplete={() => dispatch({ type: 'scene-done' })} />
    case 'loop':      return <SceneBento persona={persona} mode="settled" />
    case 'outro':     return <Outro />
    default:          return <Idle />
  }
}
