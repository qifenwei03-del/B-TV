import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ── B 區 TV display 固定埠口(展覽同網域,務必避開 F 區與 B 桌面投影)──────────────
// F 區占用:web 5173 / 5174 / 5175、ws 8787。
// B 桌面投影 (B-Table) 占用:web 5273。
// B 區 TV display(本 repo)→ web 5274、WS 連 8788(B 區 NFC server)。
// strictPort: true → 埠口被占就直接報錯,絕不自動漂移撞別區。
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5274,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 5274,
    strictPort: true,
  },
})
