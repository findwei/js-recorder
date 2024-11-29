/*
 * @Author: webberQian
 * @Date: 2024-11-14 14:27:34
 * @LastEditTime: 2024-11-29 13:55:35
 * @LastEditors: webberQian
 * @Description:RecorderProcessor
 * 没有理想，何必远方。
 */
/**
 * RecorderProcessor 是一个 AudioWorkletProcessor，用于处理音频数据。
 * 它接收来自主线程的命令来控制录音状态，并将录制的音频数据发送回主线程。
 */
class RecorderProcessor extends AudioWorkletProcessor {
  // 录音状态标志，初始为不录音
  private recording: boolean;
  bufferSize: number;
  channels: number;

  constructor(options: AudioWorkletNodeOptions) {
    super(options);
    // 监听来自主线程的消息
    this.port.onmessage = this.handleMessage.bind(this);
    // 初始化录音状态为不录音
    this.recording = false;
    // 读取 processorOptions 中的 bufferSize （缓冲大小）
    this.bufferSize = options.processorOptions.bufferSize;
    // 声道数量 1|2
    this.channels = options.processorOptions.channels;
  }

  /**
   * 处理来自主线程的消息
   * 根据接收到的命令控制录音状态
   * @param event - 消息事件对象
   */
  private handleMessage(event: MessageEvent): void {
    const { command } = event.data;
    switch (command) {
      case "start":
        // 开始录音
        this.recording = true;
        break;
      case "pause":
        // 暂停录音
        this.recording = false;
        break;
      case "resume":
        // 恢复录音
        this.recording = true;
        break;
      case "stop":
        // 停止录音并清空音频数据
        this.recording = false;
        break;
      default:
        // 处理未识别的命令
        console.warn(`未知的命令: ${command}`);
    }
  }

  /**
   * AudioWorkletProcessor 的核心处理方法
   * 在每个音频处理周期调用一次
   * AudioWorkletProcessor 处理音频数据的块大小固定为 128帧，这个大小是由 Web Audio API 规范定义的，无法更改。
   * 每帧的时间长度取决于音频上下文的采样率。例如：
   *  如果采样率是 48kHz，则每帧的时间为 1/48000 秒。
   *  128帧的数据持续时间是 128/48000 秒 ≈ 2.67ms。
   * @param inputs - 输入的音频通道数据
   * @param outputs - 输出的音频通道数据
   * @param parameters - 可调参数
   * @returns 返回 true 以保持处理器处于活动状态
   */
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    // parameters: Record<string, Float32Array>
  ): boolean {
    if (this.recording) {
      const input = inputs[0]; // 输入音频流
      const output = outputs[0]; // 输出音频流
      // 检查是否有输入音频数据
      if (input.length > 0) {
        // 遍历每个声道的数据，并复制一份
        const channelData = input.map((channel) => channel.slice());
        // 将复制的音频数据通过端口发送回主线程
        this.port.postMessage(channelData);
      }
    }
    // 返回 true 以继续处理音频
    return true;
  }
}

// 注册处理器，使其在 AudioWorklet 中可用
registerProcessor("recorder-processor", RecorderProcessor);

// 为 TypeScript 增加全局类型声明
declare global {
  interface AudioWorkletGlobalScope {
    registerProcessor(
      name: string,
      processorCtor: typeof RecorderProcessor
    ): void;
  }
}

declare class AudioWorkletProcessor {
  constructor(options?: AudioWorkletNodeOptions);
  readonly port: MessagePort;
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean;
}

declare function registerProcessor(
  name: string,
  processorCtor: typeof AudioWorkletProcessor
): void;
