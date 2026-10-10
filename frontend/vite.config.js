import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, '..', 'VITE_'), ...loadEnv(mode, '.', 'VITE_'), ...process.env };
  const isProductionBuild = process.env.BUILD_ENV === 'production';
  const turnstileSiteKey = env.VITE_TURNSTILE_SITE_KEY
    || (!isProductionBuild ? '1x00000000000000000000AA' : '');

  if (isProductionBuild && (!turnstileSiteKey || /^[123]x0+/.test(turnstileSiteKey) || turnstileSiteKey.startsWith('replace-'))) {
    throw new Error('A real VITE_TURNSTILE_SITE_KEY must be configured for production deployment.');
  }

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_TURNSTILE_SITE_KEY': JSON.stringify(turnstileSiteKey),
    },
  };
});
