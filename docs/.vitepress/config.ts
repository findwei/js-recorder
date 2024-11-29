import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: "/js-recorder/docs/",
  title: "js-recorder-rtc",
  description: "js-recorder-rtc 是一个前端录音库支持下载pcm、wav和实时输出pcm",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "首页", link: "/" },
      { text: "demo", link: "https://findwei.github.io/js-recorder/" },
    ],

    sidebar: [
      {
        text: "js-recorder-rtc使用",
        items: [
          { text: "安装", link: "/install" },
          { text: "属性", link: "/attribute" },
          { text: "API", link: "/api" },
          // { text: "Markdown Examples", link: "/markdown-examples" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/findwei/js-recorder" },
    ],
  },
});
