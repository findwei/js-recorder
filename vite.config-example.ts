/*
 * @Author: webberQian
 * @Date: 2024-11-20 10:58:57
 * @LastEditTime: 2024-11-27 16:09:48
 * @LastEditors: webberQian
 * @Description:
 * 没有理想，何必远方。
 */
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  root: "./example",
  base: "/js-recorder",
  server: {
    port: 5180,
  },
  build: {
    outDir: "../example-dist",
  },
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "src") },
      { find: "@@", replacement: path.resolve(__dirname) },
    ],
  },
});
