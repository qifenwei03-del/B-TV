# B 區 感應光寓 · TV 主顯示 (b-tv)

寶舖大安段策展 B 區「感應光寓」客廳的 **TV 主顯示**(Web kiosk)。跑前言 / 房屋即時資訊 / 角色解方動畫 / 結語,依官方分鏡(`b區分鏡.pdf`)展演。

- 規格來源:`zones/B-感應光寓.md`(vision_base_vault)
- 同棧:桌面投影 [`VistwinProject/B-Table`](https://github.com/VistwinProject/B-Table)、NFC server(vibenfc `server.py`,埠口改 8788)
- 技術:Vite + React 18 + framer-motion 11 + **three.js**

## 視覺風格:兩段式

- **待機 / 前言 / 等卡 / 選角色 / 結語** — 深色 teal 極簡風(`src/components/*`、`src/style.css`)。
- **情境展演(房屋即時資訊 + 5 情境解方)** — **bento 動態資料牆**(參考客戶提供的 kinetic dashboard GIF):飽和平塗色塊 + 巨大 Helvetica 數字 + count-up + SVG 圖表描繪。程式在 `src/bento/`。
  - 牆裡右上那格是 **three.js 的 3D 房子**(`src/bento/HouseCanvas.jsx`)— **自動旋轉**,燈光**隨每個情境(persona)+ 當前解方維度即時變化**(`src/bento/houseLighting.js`)。
  - 房子模型:放 `public/house.glb` 自動接上;沒有檔案時用程序化 placeholder(見 `public/README.md`)。
  - 全專案**只有這一格用 three.js**,其餘 bento tiles / 數字 / 圖表都是 DOM + SVG(文字最銳利)。

## 跑起來

```bash
npm install
npm run dev      # http://localhost:5274
```

> **埠口固定**(展覽同網域,務必避開 F 區):web **5274**、WS 連 **8788**。
> `strictPort: true` — 被占即報錯,不漂移撞別區。F 區占 5173-5175 / 8787;B 桌面投影占 5273。

## 連線(path A)

直接連 B 區 NFC server `ws://localhost:8788`,沿用 B-Table / F 區 vibenfc 協議,前端自行從原始 NFC 事件推導畫面狀態。server 廣播:`reader-connected` / `reader-disconnected` / `tag-present`(`data.id` / `data.kind`=`card`\|`character` / `data.label`)/ `tag-remove`,另接受 `reset` / `intro` / `outro` 作為展務員 override。

角色 `id` 與 B-Table 凍結對齊:`anti-aging` / `child` / `elder` / `pregnancy` / `nomad`。

日後 cue-server 做出權威 `/ws/state` 後可切到 path B(改 `useNfcSocket.js`)。
覆寫連線:`VITE_WS_URL=ws://host:8788 npm run dev`。

## 流程(phase 狀態機,見 `src/App.jsx`)

```
idle ─(開始)→ intro ─(自動/手動)→ card ─(刷邀請卡)→ house ─(自動/手動)→ character
  └ character ─(刷鑰匙圈)→ scene(依序 ①光照→②空氣→③溫濕度→④聲音)→ loop
       loop ─(刷下個鑰匙圈)→ scene ‖ (闔書/結語)→ outro → idle
```

前言 / 房屋資訊 / 結語為「導覽人員操控 + 逾時自動續播」雙保險。

## 鍵盤(展務 + 無硬體開發)

| 鍵 | 作用 |
|---|---|
| `i` / `Enter` | 開始體驗(待機 → 前言) |
| `n` / `→` | 下一步(前言→等卡 / 房屋資訊→選角色) |
| `o` | 播結語 |
| `r` / `Esc` | 重置回待機 |
| `c` | 模擬刷邀請卡 |
| `1`–`5` | 模擬刷角色鑰匙圈(逆齡/兒童/老人/孕婦/遊牧) |
| `x` / `Space` | 模擬拿起 tag |

## 資料

- `src/personas.js` — 5 情境(與 B-Table 凍結對齊的 id/name/accent)
- `src/scenes.js` — 5 情境 × 4 維度解方資料集(setpoint 參考 OTA120 v6 / WELL,真值待寶舖數據表)
- `src/houseInfo.js` — 房屋即時資訊 mock(接 WELLTEK REST/WS 後替換)

## 待辦 / 未決(見 zone md §未決點)

- 房屋即時資訊資料介面(寶舖 Sensor / 數位孿生平台)— 目前 mock
- 5 情境 setpoint 數值以寶舖數據表為準
- 前言 / 結語語音:目前用瀏覽器 Web Speech API(zh-TW),正式現場可換預錄配音(改 `src/speech.js`)
- `POST /override`(展務員手動觸發前言/結語)後端待 cue-server 或 8788 server 擴充;目前以鍵盤 / server `intro`\|`outro`\|`reset` 訊息觸發
