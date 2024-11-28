import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import typescript from "@rollup/plugin-typescript";
import { resolve } from "path";
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(), // ...
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    dts({
      rollupTypes: true,
      tsconfigPath: "./tsconfig.lib.json",
      outDir: "./dist/types",
      insertTypesEntry: true, // 自动插入 types 字段到 package.json
    }),
  ],
  server: {
    port: 3000,
  },
  build: {
    lib: {
      formats: ["es", "umd"],
      entry: resolve(__dirname, "src/index.ts"),
      // entry: "src/index.ts",
      name: "jsRecorderRtc",
      fileName: (format) => `js-recorder-rtc-library.${format}.js`,
    },
    rollupOptions: {
      plugins: [
        // typescript({
        //   tsconfig: "./tsconfig.lib.json", // 确保指向正确的 tsconfig 文件
        //   declaration: true, // 启用声明文件生成
        // }),
      ],
    },
  },
});
