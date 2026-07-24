# public/voice/ — 前言 / 結語配音檔(最佳音質)

把配音檔放這裡,電視就會改播你的配音,而不是瀏覽器內建的機械音:

- **`intro.mp3`** — 前言(開場 AI 口吻)
- **`outro.mp3`** — 結語

放好重新整理即可;**載不到時自動 fallback** 成瀏覽器語音(不會出錯)。
格式用 `.mp3`(或改 `src/speech.js` 的 `VOICE_FILES` 指到 `.wav`/`.m4a`)。

## 配音文字(目前畫面字幕,可照這個錄)

**前言**:
> 歡迎來到「感應光寓」。我們將以你在上個空間留下的資訊,為你打造專屬的居家體驗。準備好了嗎?體驗即將開始。

**結語**:
> 房子的健康,就是你的健康。房子的健康,我有解方。請往下個展區體驗。

## 哪裡生成配音?

挑一個自然的中文 TTS 匯出 mp3 即可,例如:
- ElevenLabs(多語、最自然,有中文)
- 微軟 Azure Neural TTS(`zh-TW` 的 HsiaoChen / YunJhe 等)
- Google Cloud TTS(`cmn-TW` Neural2 / WaveNet)
- 或直接找真人錄。

---

## 不想用配音檔?也能只調瀏覽器語音

改 `src/speech.js` 最上面的 `SPEECH`:
- `ENABLED: false` → 完全關掉語音(只留字幕 + 聲紋動畫)
- `VOICE_NAME` → 指定某顆語音;先在瀏覽器 console 打 `speechVoices()` 看清單,把名字貼進去
- `RATE` / `PITCH` → 語速 / 音調

> 內建語音品質依作業系統 / 瀏覽器而定。Chrome 通常有較自然的 `Google 國語(臺灣)` 或 `Microsoft ... Online (Natural)`;預設那顆最陽春。要最好還是放配音檔。
