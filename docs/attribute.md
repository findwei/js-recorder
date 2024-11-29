# 属性

## 构造函数参数

传入一个对象配置参数，包含以下参数

- sampleRate 默认值：`48000`
  
  采样率 (Hz)，支持范围：`8000 | 16000 | 22050 | 24000 | 44100 | 48000`

- sampleBits 默认值：`8` 
  
  采样位数  `8 | 16`

- channels 默认值：`1`
  
  声道数，单声道(1)或双声道(2) `1 | 2`

- bufferSize 默认值：`4096`
  
  缓冲区大小，必须是2的幂次方，如：`2048 | 4096 | 8192`

使用示例
```ts
let options: RecorderConfig = {
    sampleRate: 16000, // 采样率
    sampleBits: 8, // 采样位数
    channels: 1,  // 声道
    bufferSize: 4096, // 缓存大小
}
```
## 实例属性

