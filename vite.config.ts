import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,

        // ★★★ 세션 쿠키를 제대로 전달하기 위한 옵션 ★★★
        cookieDomainRewrite: "localhost",   // 쿠키 도메인 재작성
        cookiePathRewrite: "/",             // 쿠키 경로 재작성
      },

      // 🔥 업로드된 옷 이미지 프록시 추가
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },

    // ★★★ 네트워크/CPU 과부하 방지 — 무조건 유지! ★★★
    watch: {
      ignored: [
        "**/runs/**",
        "**/polyvore_dataset/**",
        "**/.vscode/**",
      ],
    },
  },
});
