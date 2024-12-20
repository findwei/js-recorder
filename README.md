# js-recorder-rtc

> web音频录制器 

- 支持 暂停、恢复、停止、播放
- 录制音频格式：pcm、wav
- 实时输出pcm数据

# 使用

## 在线demo

[DEMO](https://findwei.github.io/js-recorder/)

## 快速上手

### 模块化使用

1. 安装依赖包
   ```ts
   npm install js-recorder-rtc --save
   ```
2. 使用js-recorder-rtc
   ```ts
   import {Recorder,type RecorderConfig} from 'js-recorder-rtc';
   let options: RecorderConfig = {
      sampleRate: 16000, // 采样率
      sampleBits: 8, // 采样位数
      channels: 1,  // 声道
      bufferSize: 4096, // 缓存大小
   }
   // 初始化参数
   let recorder = new Recorder(options);
    // 初始化录音器并设置
   const startButton = async () => {
   try {
      await recorder.init();
      //实时 PCM 数据回调
      recorder.setPCMDataCallback((pcmData: Float32Array)=>{
         console.log("pcmData:", pcmData);
      }); 
      // 开始录音
      recorder.start();
      console.log("录音开始");
   } catch (error) {
      console.error("初始化录音器失败:", error);
   }
   };

   // 暂停录音
   // recorder.pause();
   // 恢复录音
   // recorder.resume();
   // 停止录音
   // recorder.stop();

   // 下载PCM数据
   const downloadPCMButton = () => {
      try {
         const pcmData = recorder.exportPCM();
         const blob = new Blob([pcmData], { type: "application/octet-stream" });
         const url = URL.createObjectURL(blob);
         const a = document.createElement("a");
         a.href = url;
         a.download = `recording${options.sampleRate}-${options.sampleBits}-${options.channels}-${Date.now()}.pcm`;
         a.click();
         URL.revokeObjectURL(url);
         console.log("PCM 数据已下载");
      } catch (error) {
         console.error("导出 PCM 数据失败:", error);
      }
   };
   // 下载WAV数据
   const downloadWAVButton = () => {
      try {
         const wavBlob = recorder.exportWAV();
         const url = URL.createObjectURL(wavBlob);
         const a = document.createElement("a");
         a.href = url;
         a.download = `recording${options.sampleRate}-${options.sampleBits}-${options.channels}-${Date.now()}.wav`;
         a.click();
         URL.revokeObjectURL(url);
         console.log("WAV 文件已下载");
      } catch (error) {
         console.error("导出 WAV 文件失败:", error);
      }
   };

   ```

### 浏览器直接使用
  
在线cdn https://cdn.jsdelivr.net/npm/js-recorder-rtc@0.0.1/dist/js-recorder-rtc-library.umd.js
   
```js
<script src="https://cdn.jsdelivr.net/npm/js-recorder-rtc@0.0.1/dist/js-recorder-rtc-library.umd.js"></script>
// jsRecorderRtc对象会挂载在window对象下面 
```
```js
let recorder = new window.jsRecorderRtc.Recorder({
   sampleRate: 16000, // 采样率
   sampleBits: 8, // 采样位数
   channels: 1, // 声道
   bufferSize: 4096, // 缓存大小
})
```

## API文档

[API文档](https://findwei.github.io/js-recorder/docs)


## 注意

**本地调试请使用`127.0.0.1`或者`localhost`**

**由于浏览器限制，线上环境需配置https**
