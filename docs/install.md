
# 安装

推荐使用模块化的方式引入

## 模块化使用

依赖安装 

```ts
npm install js-recorder-rtc --save
```
使用示例
```ts
import {Recorder,type RecorderConfig} from 'js-recorder-rtc';
let options: RecorderConfig = {
    sampleRate: 16000, // 采样率
    sampleBits: 8, // 采样位数
    channels: 1,  // 声道
    bufferSize: 4096, // 缓存大小
}
// 初始化录音器并设置
const startButton = async () => {
    // 构造录音器
let recorder = new Recorder(options);
try {
    await recorder.init();
    //设置实时 PCM 数据回调 如果你不需要 可以不设置
    recorder.setPCMDataCallback((pcmData: Float32Array)=>{
        console.log("pcmData:", pcmData);
    }); 
    // 开始录音
    recorder.start();
} catch (error) {
    console.error("初始化录音器失败:", error);
}
};
```

## 浏览器引入方式
直接修改 `js-recorder-rtc@0.0.1` 版本号 例如 `js-recorder-rtc@0.0.3` 使用最新的版本

查看最新版本号：https://www.npmjs.com/package/js-recorder-rtc?activeTab=versions

```ts
<script src="https://cdn.jsdelivr.net/npm/js-recorder-rtc@0.0.1/dist/js-recorder-rtc-library.umd.js"></script>
// 会挂载在window对象下面挂载一个jsRecorderRtc对象
let recorder = new window.jsRecorderRtc.Recorder({
   sampleRate: 16000, // 采样率
   sampleBits: 8, // 采样位数
   channels: 1, // 声道
   bufferSize: 4096, // 缓存大小
})
```
