import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        allowedHosts: ["fe-2.modern-ui.org", "fe-vite.modern-ui.org"]
    },
})
