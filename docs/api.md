# Api

## 实例方法

### init()

* 初始化录音功能
* 请求麦克风权限，并设置音频处理节点（AudioWorkletNode 或 ScriptProcessorNode）。

### getStatus() : keyof typeof RecorderStatus

获取当前录音状态

返回值：

```ts
export enum RecorderStatus {
  INACTIVE = "inactive", // 未激活/已停止
  RECORDING = "recording", // 录音中
  PAUSED = "paused", // 已暂停
}
```

### start()

开始录音 如果当前状态不是录音中，则清空已有的音频数据，设置状态为录音中，并开始录音。

### pause()

暂停录音 如果当前状态是录音中，则设置状态为暂停，并暂停录音。

### resume()

恢复录音 如果当前状态是暂停，则设置状态为录音中，并恢复录音。

### stop()

停止录音 设置状态为非活动状态，停止所有音频轨道，断开音频节点连接，关闭音频上下文。

### setPCMDataCallback()

设置实时 PCM 数据的回调函数。 当有新的 PCM 数据时，会调用该函数传入的回调函数。

```ts
recorder.setPCMDataCallback((pcmData: Float32Array)=>{
    console.log("pcmData:", pcmData);
}); 
```

### exportPCM() : Uint8Array | Int16Array

导出 PCM 数据,如果是双声道数据采用 L1 R1 L2 R2 的格式

根据采样位数转换返回的数据格式不同，如果传入的8位返回 `Uint8Array` 如果传入的16位返回 int16Array`

### exportWAV() : Blob

导出 WAV 格式音频文件。

## 静态方法
