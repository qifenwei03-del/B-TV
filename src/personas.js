// ── B 區 5 個情境角色(與 B-Table / NFC daemon 凍結對齊)──────────────────────
// keyed by `id` — 與 VistwinProject/B-Table 的 src/personas.js、server/uid-map.json
// 及 NFC daemon 的 tag-present `data.id` 必須完全一致。
// name / title / accent 沿用 OTA120 v6 情境卡。豐富的環境資料集(光/空氣/溫濕度/
// 聲音 setpoint)放在 scenes.js,由 TV 端負責展演。
export const PERSONAS = {
  'anti-aging': {
    id: 'anti-aging',
    name: '生理逆齡',
    title: '成年人 — 抗衰老',
    accent: '#3a6ea5',
    line: '校正晝夜節律，啟動深層修復',
    prompt: '成年人逆齡衰老？',
  },
  child: {
    id: 'child',
    name: '原生健康',
    title: '兒童 — 提高免疫力',
    accent: '#3f8f6b',
    line: '保護發育中的肺部與視力',
    prompt: '提高兒童免疫力？',
  },
  elder: {
    id: 'elder',
    name: '安全守護',
    title: '老人 — 在宅終老',
    accent: '#8a5a2b',
    line: '補償視覺退化，預防意外與跌倒',
    prompt: '老年的安全守護？',
  },
  pregnancy: {
    id: 'pregnancy',
    name: '極致純淨',
    title: '孕婦 — 在家休養',
    accent: '#8d3a5a',
    line: '零毒害微環境，緩解身心壓力',
    prompt: '孕婦的安心休養？',
  },
  nomad: {
    id: 'nomad',
    name: '數位遊牧',
    title: '高效 — 在家辦公',
    accent: '#2c5f78',
    line: '啟動認知潛能，維持深層專注',
    prompt: '高效的在宅工作？',
  },
}

export const PERSONA_ORDER = ['anti-aging', 'child', 'elder', 'pregnancy', 'nomad']
