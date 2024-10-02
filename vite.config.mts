import { defineConfig, UserConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import { createHtmlPlugin } from 'vite-plugin-html';

// Using Vite to compile our front-end JSPsych files and allow hot-reloading when testing out changes to our experiment
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    // base: `/${env.VITE_BASE_PATH}`,
    base: `/vediSurveyDatapipe`,
    plugins: [
      createHtmlPlugin({
        template: 'index.html',
      })
    ],
    build: {
      chunkSizeWarningLimit: 1600,
      // Splitting node_modules into separate chunks for smaller file sizes as recommended by Rollup
      rollupOptions: {
        output: {
          entryFileNames: 'assets/bundle.js',
          assetFileNames: 'assets/[name].[extname]',
          dir: resolve(__dirname, 'dist'),
          manualChunks(id) {
            if (id.includes('node_modules')) {
                return id.toString().split('node_modules/')[1].split('/')[0].toString();
            }
        }
        },
      },
    },
    publicDir: resolve(__dirname, 'src/survey/assets'), 
    // Server used in development mode
    server: {
      port: 9000,
      open: true,
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
      extensions: ['.ts', '.js', '.d.ts'],
    },
  } satisfies UserConfig;
  })
