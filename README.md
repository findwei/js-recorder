# js-recorder

> web音频录制器 

- 支持 暂停、恢复、停止、播放
- 录制音频格式：pcm、wav
- 实时输出pcm数据

# 使用

## 在线demo

## 在线文档

## 快速上手

- 模块化使用

  1. 安装依赖包
     ```js
     npm install js-recorder --save
     ```
  2. 使用js-recorder
     ```js
     import {Recorder} from 'js-recorder';
     let recorder = new Recorder({
      sampleRate: 16000, // 采样率
      sampleBits: 8, // 采样位数
      channels: 1,  // 声道
      bufferSize: 4096, // 缓存大小
      });
   ```
- 浏览器端使用
   ...