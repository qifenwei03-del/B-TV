# 怎麼在新電腦上跑起來看畫面

## 只想看畫面(最常用)

1. **裝一次 Node.js**:到 <https://nodejs.org/> 下載 **LTS** 版,一路下一步安裝。
2. 把這個 `b-tv` 資料夾放到電腦上(git clone 或直接複製整個資料夾)。
3. **雙擊 `start.bat`**。
   - 第一次會自動裝套件(需要網路,1–2 分鐘),之後就很快。
   - 會自動建置 → 開伺服器 → 用 Chrome 全螢幕(kiosk)打開畫面。
4. 結束:按 `Alt+F4` 關掉全螢幕,或雙擊 **`stop.bat`** 停掉伺服器。

> 網址是 <http://localhost:5274>。沒裝 Chrome 會改用預設瀏覽器(非全螢幕)。
> 看畫面不需要讀卡機;待機畫面 + 用鍵盤模擬都能跑(鍵盤鍵見下)。

## 鍵盤(沒接讀卡機時測試用)

`c` 刷邀請卡 · `1`~`5` 刷 5 個情境鑰匙圈 · `x` 拿起 · `i` 前言 · `o` 結語 · `r` 重置

## 要「真實刷卡 / 桌面和電視同步」才需要的(進階)

1. **NFC 伺服器**(Python,埠口 8788):雙擊 **`start-nfc.bat`**(會去找隔壁 `b-livingroom` 專案的 `server/server.py`)。
   - 需先裝 Python 與套件:`pip install pyscard websockets`,並接上 ACR122U 讀卡機。
2. **桌面投影**(B-Table):在 `b-livingroom` 專案跑 `npm run dev`(埠口 5273)。

> 三者各自獨立:電視 `b-tv`(5274)、桌面 `b-livingroom`(5273)、NFC 伺服器(8788)。
> 電視與桌面都連 8788;接上讀卡機後刷卡會同時驅動兩個畫面。

## 換電腦 / 複製到別台

- 連同資料夾複製,或 `git clone https://github.com/VistwinProject/B-TV.git`。
- 不用複製 `node_modules`(`start.bat` 會自己裝)。
- 新機器一樣只要先裝好 Node.js,再雙擊 `start.bat`。

## 客戶素材放這裡(可選)

- 房子 3D 模型 → `public/house.glb`(放了就自動換掉預設方塊房子)
- 前言 / 結語配音 → `public/voice/intro.mp3`、`public/voice/outro.mp3`(放了再把 `src/speech.js` 的 `ENABLED` 設回 `true`)

## 想要「完全免安裝、雙擊就開的 .exe」?

目前 `.bat` 仍需先裝一次 Node.js。若要做成**單一 .exe**(把瀏覽器引擎與執行環境全包進去,新電腦什麼都不用裝),可改用 Electron 打包 —— 這是另一個工程,需要時再做。
