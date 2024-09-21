import { UserConfig } from 'vite';
import { resolve } from 'path';
import { createHtmlPlugin } from 'vite-plugin-html';

export default {
  plugins: [
    createHtmlPlugin({
      template: './src/survey/index.html',
    }),
  ],
  build: {
    rollupOptions: {
      input: './src/survey/index.html',
      output: {
        entryFileNames: 'webpack.bundle.js',
        dir: resolve(__dirname, 'dist'),
      },
    },
  },
  server: {
    port: 9000,
    open: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
    extensions: ['.ts', '.js'],
  },
} satisfies UserConfig;