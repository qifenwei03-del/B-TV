// ── B 區 5 個情境角色(與 B-Table / NFC daemon 凍結對齊)──────────────────────
// keyed by `id` — 與 VistwinProject/B-Table 的 src/personas.js、server/uid-map.json
// 及 NFC daemon 的 tag-present `data.id` 必須完全一致。
// name / title / accent 沿用 OTA120 v6 情境卡。豐富的環境資料集(光/空氣/溫濕度/
// 聲音 setpoint)放在 scenes.js,由 TV 端負責展演。
//
// 痛點三層次(與 zone md「五情境 痛點 × 解方對照表」同源):
//   painShort  L1 極短(TV 右上 eyebrow)
//   painMedium L2 一句話(TV 右上主標)
//   painLong   L3 詳細長句(桌面端顯示;TV 不用,放這供對齊)
export const PERSONAS = {
  'anti-aging': {
    id: 'anti-aging',
    name: '生理逆齡',
    title: '成年人 — 抗衰老',
    accent: '#3a6ea5',
    line: '校正晝夜節律，啟動深層修復',
    prompt: '成年人逆齡衰老？',
    painShort: '成年人逆齡衰老',
    painMedium: '熬夜、壓力與老化，怎麼讓身體回到修復狀態？',
    painLong: '長期晚睡與壓力讓晝夜節律紊亂、氧化壓力升高，睡眠品質變差、修復不足，身體與外貌都加速老化。',
  },
  child: {
    id: 'child',
    name: '原生健康',
    title: '兒童 — 提高免疫力',
    accent: '#3f8f6b',
    line: '保護發育中的肺部與視力',
    prompt: '提高兒童免疫力？',
    painShort: '提高兒童免疫力',
    painMedium: '怎麼保護發育中的孩子，少生病、長得好？',
    painLong: '兒童發育中的肺部與視力脆弱，容易受空汙與藍光傷害；抵抗力弱、易過敏生病，睡眠也常被干擾而影響發育。',
  },
  elder: {
    id: 'elder',
    name: '安全守護',
    title: '老人 — 在宅終老',
    accent: '#8a5a2b',
    line: '補償視覺退化，預防意外與跌倒',
    prompt: '老年的安全守護？',
    painShort: '老年安全守護',
    painMedium: '怎麼讓長輩在家安全、安心地終老？',
    painLong: '長者視覺退化、夜間容易跌倒；慢性病讓血壓波動與失溫風險升高，緊急狀況也常無人即時察覺。',
  },
  pregnancy: {
    id: 'pregnancy',
    name: '極致純淨',
    title: '孕婦 — 在家休養',
    accent: '#8d3a5a',
    line: '零毒害微環境，緩解身心壓力',
    prompt: '孕婦的安心休養？',
    painShort: '孕婦安心休養',
    painMedium: '怎麼給孕媽咪一個零毒害、能好好休養的家？',
    painLong: '孕期對甲醛等毒害極度敏感、擔心影響胎兒；身心壓力大、睡眠不安，體感也容易不適。',
  },
  nomad: {
    id: 'nomad',
    name: '數位遊牧',
    title: '高效 — 在家辦公',
    accent: '#2c5f78',
    line: '啟動認知潛能，維持深層專注',
    prompt: '高效的在宅工作？',
    painShort: '高效在家工作',
    painMedium: '在家怎麼維持專注，不被環境拖累效率？',
    painLong: '在家工作容易分心、午後倦怠；CO₂ 累積讓頭腦昏沉、決策力下降，環境噪音也干擾深度工作。',
  },
}

export const PERSONA_ORDER = ['anti-aging', 'child', 'elder', 'pregnancy', 'nomad']
