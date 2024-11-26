/*
 * @Author: webberQian
 * @Date: 2024-11-11 17:54:59
 * @LastEditTime: 2024-11-25 14:05:46
 * @LastEditors: webberQian
 * @Description: 录音器
 * 没有理想，何必远方。
 */
// 前端实现录音功能实现方式有两种：
// 1. WebRTC + MediaRecorder 这种方式不能直接拿到pcm数据，
// 2.1 WebRTC + Web Audio API(ScriptProcessorNode ) 这种方式可以直接拿到pcm数据  WebRTC 提供了强大的实时媒体处理功能，配合 AudioContext 可以进行更复杂的音频操作。
// 2.2 WebRTC + Web Audio API(AudioWorklet) 这种方式可以直接拿到pcm数据  AudioWorklet 是 Web Audio API 的一部分，允许在音频处理中使用 JavaScript 编写复杂的算法。

// 多声道音频数据通常是交错存储（Interleaved）的，这意味着每个声道的数据是连续存储的。
// 双通道 L1, R1, L2, R2, L3, R3, ...
// 5.1环绕声系统，会有六个声道 C 代表中置声道（Center channel），LS 和 RS 分别代表左环绕和右环绕声道（Left Surround 和 Right Surround），SL 代表次低音声道（Subwoofer channel）。
// 5.1环绕声 L1, C1, R1, LS1, RS1, SL1, L2, C2, R2, LS2, RS2, SL2, ...

// 例如，如果一个音频流有 2 个声道（左和右），采样率为 48kHz，采样位数为 16 位，
// 那么每秒的数据量是 48000 * 2 * 2 = 192000 字节（16 位表示每个样本需要 2 字节）。
// 交错存储的音频数据在处理时需要解交错（Deinterleave），即将连续存储的声道数据分开，分别处理每个声道。

import { RecorderConfig, RecorderStatus } from "./types/Recorder";

/**
 * 录音机类
 * 支持录制音频并导出为 PCM 或 WAV 格式
 * 支持配置采样率、采样位数、声道数等参数
 */
export class Recorder {
  /**
   * 录音配置参数：采样率、采样位数、声道数、缓冲区大小
   * @private
   */
  private readonly config: Required<RecorderConfig>;

  /**
   * Web Audio API 音频上下文
   * @private
   */
  private audioContext: AudioContext | null;

  /**
   * 媒体流对象，表示从麦克风获取的音频流
   * @private
   */
  private stream: MediaStream | null;

  /**
   * AudioWorkletNode 或 ScriptProcessorNode 节点
   * @private
   */
  private recorderNode: AudioWorkletNode | ScriptProcessorNode | null;

  /**
   * 存储录音的音频数据数组,存储左声道和右声道
   * @private
   */
  private audioData: {
    l: Float32Array[];
    r: Float32Array[];
  };

  /**
   * 实际使用的采样率，可能与请求的采样率不同。
   * 浏览器可能会调整实际采样率以适应设备。（这个是设备决定的）
   * @private
   */
  private actualSampleRate: number;

  /**
   * 当前录音状态 未激活/录音中/已暂停
   * @private
   */
  private status: RecorderStatus;
  /**
   * 实时 PCM 数据回调函数
   * @private
   */
  private onPCMDataCallback: ((pcmData: Float32Array) => void) | null = null;
  // /**
  //  * 录音时长（以秒为单位）
  //  * @private
  //  */
  // private duration: number = 0;
  // /**
  //  * 定时器 ID
  //  * @private
  //  */
  // private timer: number | null = null;
  /**
   * 初始化录音器的配置和状态。
   * @param options - 录音配置选项
   */
  constructor(options: RecorderConfig = {}) {
    // 初始化配置，使用默认值填充未指定的选项
    this.config = {
      sampleRate: options.sampleRate || 48000,
      sampleBits: options.sampleBits || 8,
      channels: options.channels || 1,
      bufferSize: options.bufferSize || 4096,
    };

    // 验证配置参数的有效性
    this.validateConfig();

    // 初始化成员变量
    this.audioContext = null;
    this.stream = null;
    this.recorderNode = null;
    // 初始化每个声道的音频数据数组
    this.audioData = {
      l: [],
      r: [],
    };
    this.actualSampleRate = this.config.sampleRate;
    this.status = RecorderStatus.INACTIVE;
    // 初始化录音时长
    // this.duration = 0;
    // this.timer = null;
  }

  /**
   * 验证录音配置参数是否有效。
   * 检查采样位数、声道数和采样率是否在允许范围内。
   * @throws {Error} 当参数无效时抛出错误
   * @private
   */
  private validateConfig(): void {
    if (![8, 16].includes(this.config.sampleBits)) {
      throw new Error("采样位数必须是 8 或 16");
    }
    if (![1, 2].includes(this.config.channels)) {
      throw new Error("声道数必须是 1 或 2");
    }
    if (this.config.sampleRate < 8000 || this.config.sampleRate > 96000) {
      throw new Error("采样率必须在 8000 至 96000 之间");
    }
  }

  /**
   * 获取当前录音状态
   * @returns {RecorderStatus} 当前状态
   */
  public getStatus(): RecorderStatus {
    return this.status;
  }

  /**
   * 初始化录音功能
   * 请求麦克风权限，并设置音频处理节点（AudioWorkletNode 或 ScriptProcessorNode）。
   * @throws {Error} 初始化失败时抛出错误
   */
  public async init(): Promise<void> {
    try {
      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate, // 请求的采样率 约束条件
          channelCount: this.config.channels, // 请求的声道数 约束条件
          echoCancellation: true, // 启用回声消除
        },
      });
      const audioTrack = stream.getAudioTracks()[0];
      // 音频轨道配置 可以查看实际配置 约束条件是否生效
      console.log("音频轨道设置:", audioTrack.getSettings());
      //约束条件  但浏览器可能不会严格遵循。浏览器通常优先满足硬件的实际能力，可能会忽略部分约束条件。
      console.log("音频轨道约束:", audioTrack.getConstraints());

      // 兼容性处理：尝试使用 AudioContext 或 webkitAudioContext
      const AudioContextConstructor =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextConstructor) {
        throw new Error("当前浏览器不支持 Web Audio API");
      }

      // 创建音频上下文 设定输出采样率
      this.audioContext = new AudioContextConstructor({
        // sampleRate: this.config.sampleRate, // 请求的采样率 设置了但是设备不一定支持和使用这个
      });

      this.stream = stream;

      // 创建媒体流源节点
      const source = this.audioContext.createMediaStreamSource(stream);
      // console.log(this.config.sampleRate, "this.config.sampleRate");
      // console.log(this.audioContext.sampleRate, "this.audioContext.sampleRate");
      // console.log(source.context.sampleRate, "source.context.sampleRate");
      // 实际使用的采样率，可能与请求的采样率不同
      this.actualSampleRate = this.audioContext.sampleRate;

      if ("audioWorklet" in this.audioContext) {
        // if (false) {
        // 如果支持 AudioWorklet，使用 AudioWorkletNode
        try {
          // 使用 new URL 语法获取 RecorderProcessor.ts 的模块路径
          const processorUrl = new URL(
            "./workers/RecorderProcessor.ts",
            import.meta.url
          ).href;
          await this.audioContext.audioWorklet.addModule(processorUrl);
          // 创建 AudioWorkletNode 实例
          this.recorderNode = new AudioWorkletNode(
            this.audioContext,
            "recorder-processor",
            {
              processorOptions: {
                channels: this.config.channels,
                bufferSize: this.config.bufferSize,
              },
            }
          );

          // 监听来自 AudioWorklet 传递的音频数据
          this.recorderNode.port.onmessage =
            this.handleWorkletMessage.bind(this);

          // 连接音频节点
          source.connect(this.recorderNode);
          this.recorderNode.connect(this.audioContext.destination);
        } catch (error) {
          // 如果 AudioWorklet 初始化失败，降级使用 ScriptProcessorNode
          console.warn(
            "AudioWorklet 初始化失败，尝试使用 ScriptProcessorNode:",
            error
          );
          this.setupScriptProcessorNode(source);
        }
      } else {
        // 不支持 AudioWorklet，使用 ScriptProcessorNode
        this.setupScriptProcessorNode(source);
      }
    } catch (error) {
      console.error("录音初始化失败:", error);
      throw error;
    }
  }

  /**
   * 设置 ScriptProcessorNode
   * ScriptProcessorNode 是 Web Audio API 提供的用于处理音频数据的节点，但已被弃用，推荐使用 AudioWorklet。
   * @param source - 音频源节点
   * @private
   */
  private setupScriptProcessorNode(source: MediaStreamAudioSourceNode): void {
    // 创建 ScriptProcessorNode
    const scriptNode = this.audioContext!.createScriptProcessor(
      this.config.bufferSize, // 缓冲区大小
      this.config.channels, // 输入声道数
      this.config.channels // 输出声道数
    );

    // 处理音频数据
    scriptNode.onaudioprocess = this.handleScriptProcessorProcess.bind(this);

    // 连接音频节点
    source.connect(scriptNode);
    scriptNode.connect(this.audioContext!.destination);

    this.recorderNode = scriptNode;
  }

  /**
   * 处理来自 AudioWorklet 的消息
   * 将音频数据保存到 audioData 数组中
   * @param event - 消息事件对象
   * @private
   */
  private handleWorkletMessage(event: MessageEvent): void {
    if (this.status !== RecorderStatus.RECORDING) return;
    // 假设 audioBuffer 的长度等于声道数
    const audioBuffer: Float32Array[] = event.data;
    // 获取声道数
    const numberOfChannels = this.config.channels;

    // 存储每个声道的数据 单声道和双声道 (原始数据 没有重新采样转换)
    if (numberOfChannels === 1) {
      this.audioData.l.push(new Float32Array(audioBuffer[0]));
    } else if (numberOfChannels === 2) {
      this.audioData.l.push(new Float32Array(audioBuffer[0]));
      this.audioData.r.push(new Float32Array(audioBuffer[1] || []));
    }

    // 同步重采样,将音频数据调整到目标采样率 用于实时输出
    const resampledChannels = [
      this.resampleSync(
        new Float32Array(audioBuffer[0]),
        this.actualSampleRate,
        this.config.sampleRate
      ),
    ];
    // 双声道处理
    if (numberOfChannels === 2) {
      resampledChannels.push(
        this.resampleSync(
          new Float32Array(audioBuffer[1]),
          this.actualSampleRate,
          this.config.sampleRate
        )
      );
    }
    // 触发实时 PCM 数据回调
    if (this.onPCMDataCallback) {
      const interleaved = this.interleaveChannels(resampledChannels);
      this.onPCMDataCallback(interleaved);
    }
  }

  /**
   * 处理来自 ScriptProcessorNode 的音频数据
   * 将接收到的音频数据保存到 audioData 数组中，并进行重采样处理。
   * @param event - 音频处理事件对象
   * @private
   */
  private handleScriptProcessorProcess(event: AudioProcessingEvent): void {
    if (this.status !== RecorderStatus.RECORDING) return;

    const inputBuffer = event.inputBuffer;
    // 获取声道数
    const numberOfChannels = inputBuffer.numberOfChannels;
    // 遍历所有声道，将每个声道的数据合并到 mergedBuffer
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const inputChannelData = inputBuffer.getChannelData(channel);
      if (numberOfChannels === 1) {
        this.audioData.l.push(new Float32Array(inputChannelData));
      } else if (numberOfChannels === 2) {
        if (channel === 0) {
          this.audioData.l.push(new Float32Array(inputChannelData));
        } else if (channel === 1) {
          this.audioData.r.push(new Float32Array(inputChannelData));
        }
      }
      // 将输入数据直接复制到输出数据（实现实时播放）
      // const outputChannelData = event.outputBuffer.getChannelData(channel);
      // for (let sample = 0; sample < inputBuffer.length; sample++) {
      //   outputChannelData[sample] = inputChannelData[sample];
      // }
    }

    // 同步重采样，每个声道分别处理
    const resampledChannels = [
      this.resampleSync(
        new Float32Array(inputBuffer.getChannelData(0)),
        this.actualSampleRate,
        this.config.sampleRate
      ),
    ];
    // 双声道处理
    if (numberOfChannels === 2) {
      resampledChannels.push(
        this.resampleSync(
          new Float32Array(inputBuffer.getChannelData(1)),
          this.actualSampleRate,
          this.config.sampleRate
        )
      );
    }
    // 触发实时 PCM 数据回调
    if (this.onPCMDataCallback) {
      const interleaved = this.interleaveChannels(resampledChannels);
      this.onPCMDataCallback(interleaved);
    }
  }

  /**
   * 开始录音
   * 如果当前状态不是录音中，则清空已有的音频数据，设置状态为录音中，并开始录音。
   */
  public start(): void {
    if (this.status === RecorderStatus.RECORDING) return;
    // 清空已有的音频数据
    this.audioData.l = [];
    this.audioData.r = [];
    this.status = RecorderStatus.RECORDING;

    // this.duration = 0; // 重置时长
    // // 启动计时器，每秒增加时长
    // this.timer = window.setInterval(() => {
    //   this.duration += 1;
    //   this.onDurationUpdate(this.duration)
    // }, 1000);

    if (this.recorderNode instanceof AudioWorkletNode) {
      this.recorderNode.port.postMessage({ command: "start" });
    }
  }

  /**
   * 暂停录音
   * 如果当前状态是录音中，则设置状态为暂停，并暂停录音。
   */
  public pause(): void {
    if (this.status === RecorderStatus.RECORDING && this.recorderNode) {
      this.status = RecorderStatus.PAUSED;
      if (this.recorderNode instanceof AudioWorkletNode) {
        this.recorderNode.port.postMessage({ command: "pause" });
      }
    }
  }

  /**
   * 恢复录音
   * 如果当前状态是暂停，则设置状态为录音中，并恢复录音。
   */
  public resume(): void {
    if (this.status === RecorderStatus.PAUSED && this.recorderNode) {
      this.status = RecorderStatus.RECORDING;
      if (this.recorderNode instanceof AudioWorkletNode) {
        this.recorderNode.port.postMessage({ command: "resume" });
      }
    }
  }

  /**
   * 停止录音
   * 设置状态为非活动状态，停止所有音频轨道，断开音频节点连接，关闭音频上下文。
   */
  public stop(): void {
    // 将录音状态设置为非活动状态
    this.status = RecorderStatus.INACTIVE;

    // 如果存在媒体流，停止媒体流中的所有轨道
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }

    // 如果存在录音节点，执行以下操作
    if (this.recorderNode) {
      // 检查录音节点是否为 AudioWorkletNode 类型
      if (this.recorderNode instanceof AudioWorkletNode) {
        // 通过端口发送停止命令到 AudioWorklet 处理器
        this.recorderNode.port.postMessage({ command: "stop" });
      }
      // 断开录音节点与音频上下文的连接
      this.recorderNode.disconnect();
    }

    // 如果存在音频上下文，关闭音频上下文
    if (this.audioContext) {
      this.audioContext.close();
    }

    // 清空录音的数据数组
    // this.audioData.l = [];
    // this.audioData.r = [];
  }
  /**
   * 设置实时 PCM 数据的回调函数。
   * 当有新的 PCM 数据时，会调用该回调函数。
   * @param callback - 接收 PCM 数据的回调函数
   */
  public setPCMDataCallback(callback: (pcmData: Float32Array) => void): void {
    this.onPCMDataCallback = callback;
  }
  /**
   * 导出 PCM 数据
   * @returns { Uint8Array | int16Array} PCM 格式的音频数据
   */
  public exportPCM(): Uint8Array | Int16Array {
    if (this.status === RecorderStatus.RECORDING) {
      throw new Error("录音进行中，无法导出PCM数据。请先停止录音。");
    }
    // 合并所有音频数据片段
    const pcmData = this.mergeAudioData();

    // 如果实际采样率与目标采样率不同，进行重采样
    let resampledData: Float32Array;
    if (this.actualSampleRate !== this.config.sampleRate) {
      resampledData = this.resampleSync(
        pcmData,
        this.actualSampleRate,
        this.config.sampleRate
      );
    } else {
      resampledData = pcmData;
    }
    // 根据采样位数转换为相应的格式
    if (this.config.sampleBits === 8) {
      const pcmUInt8 = new Uint8Array(resampledData.length);
      for (let i = 0; i < resampledData.length; i++) {
        // 将 Float32 (-1,1) 转换为 UInt8 (0,255), 保留单声道
        pcmUInt8[i] = Math.max(
          0,
          Math.min(255, Math.floor((resampledData[i] + 1) * 127.5))
        );
      }
      return pcmUInt8;
    } else {
      const pcmInt16 = new Int16Array(resampledData.length);
      for (let i = 0; i < resampledData.length; i++) {
        // 将 Float32 (-1,1) 转换为 Int16 (-32768,32767)
        pcmInt16[i] = Math.max(
          -32768,
          Math.min(32767, Math.floor(resampledData[i] * 32767))
        );
      }
      return pcmInt16;
    }
  }
  /**
   * 重采样可以异步可以同步并且有多种算法
   * 线性插值：简单且计算量小，但在某些情况下可能导致音质下降或失真。
   * 高阶插值（如立方插值）：提供更平滑的结果，音质更高，但计算量较大。
   * 窗函数法（如 FIR 滤波器）：能够有效减少混叠和频谱泄漏，适合高质量音频处理。
   * 多相滤波器：适用于高效的多倍频率转换，常用于专业音频处理。
   * 这里使用线性插值进行同步重采样
   * @param inputData - 输入的 Float32Array 音频数据
   * @param inputSampleRate - 输入采样率
   * @param outputSampleRate - 输出采样率
   * @returns {Float32Array} 重采样后的音频数据
   * @private
   */
  private resampleSync(
    inputData: Float32Array,
    inputSampleRate: number,
    outputSampleRate: number
  ): Float32Array {
    if (inputSampleRate === outputSampleRate) {
      return inputData;
    }
    // todo 这里应该有问题没有考虑多声道的情况
    // console.log(inputSampleRate, outputSampleRate, "==============");
    // 计算采样率比率
    const sampleRateRatio = inputSampleRate / outputSampleRate;
    // 计算输出数据长度 向下取整
    const outputLength = Math.floor(inputData.length / sampleRateRatio);
    // 创建输出数据数组
    const outputData = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const interp = i * sampleRateRatio;
      const index = Math.floor(interp);
      const frac = interp - index;

      if (index + 1 < inputData.length) {
        outputData[i] =
          inputData[index] * (1 - frac) + inputData[index + 1] * frac;
      } else {
        outputData[i] = inputData[index];
      }
    }

    return outputData;
  }
  /**
   * 合并音频数据。
   * 将所有录音片段合并为一个连续的 Float32Array。
   * @returns {Float32Array} 合并后的音频数据
   * @private
   */
  private mergeAudioData(): Float32Array {
    const mergedL = this.mergeFloat32Arrays(this.audioData.l);
    let mergedR: Float32Array | null = null;

    if (this.config.channels === 2) {
      mergedR = this.mergeFloat32Arrays(this.audioData.r);
    }

    if (this.config.channels === 1) {
      return mergedL;
    } else if (this.config.channels === 2 && mergedR) {
      return this.interleaveChannels([mergedL, mergedR]);
    }

    throw new Error("不支持的声道数");
  }

  /**
   * 合并多个 Float32Array 为一个
   * @param arrays - 需要合并的 Float32Array 数组
   * @returns {Float32Array} 合并后的 Float32Array
   * @private
   */
  private mergeFloat32Arrays(arrays: Float32Array[]): Float32Array {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Float32Array(totalLength);
    let offset = 0;
    arrays.forEach((arr) => {
      result.set(arr, offset);
      offset += arr.length;
    });
    return result;
  }

  /**
   * 交错多个声道的数据  交换逻辑 L1 R1 L2 R2
   * @param channelsData - 每个声道的 Float32Array
   * @returns {Float32Array} 交错后的音频数据
   * @private
   */
  private interleaveChannels(channelsData: Float32Array[]): Float32Array {
    // 获取声道数
    const numberOfChannels = channelsData.length;
    // 获取所有声道数据的最大长度
    const maxLength = channelsData.reduce(
      (max, channelData) => Math.max(max, channelData.length),
      0
    );
    const interleaved = new Float32Array(maxLength * numberOfChannels);
    for (let i = 0; i < maxLength; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        interleaved[i * numberOfChannels + channel] =
          channelsData[channel][i] || 0;
      }
    }
    return interleaved;
  }
  /**
   * 导出 WAV 格式音频文件。
   * 先导出 PCM 数据，然后将其封装为 WAV 格式的 Blob 对象。
   * @returns {Blob} WAV 格式的 Blob 对象
   * @throws {Error} 如果录音正在进行中，抛出错误
   */
  public exportWAV(): Blob {
    if (this.status === RecorderStatus.RECORDING) {
      throw new Error("录音进行中，无法导出WAV文件。请先停止录音。");
    }
    // 获取 PCM 数据
    const pcmData = this.exportPCM();
    const wavBuffer = this.createWavFile(pcmData);
    return new Blob([wavBuffer], { type: "audio/wav" });
  }

  /**
   * 创建 WAV 文件。
   * 根据 PCM 数据和录音配置，生成包含 WAV 头部信息的 ArrayBuffer。
   * WAV 文件包含 RIFF 头、fmt 子块和 data 子块。
   * @param pcmData - PCM 音频数据，可以是 Uint8Array 或 Int16Array
   * @returns {ArrayBuffer} 包含 WAV 头部信息的音频数据
   * @private
   */
  private createWavFile(pcmData: Uint8Array | Int16Array): ArrayBuffer {
    const dataLength = pcmData.length * (this.config.sampleBits / 8);
    const buffer = new ArrayBuffer(44 + dataLength); // WAV 文件头部通常为 44 字节
    const view = new DataView(buffer);

    // 写入 WAV 文件头
    // RIFF 标识符
    this.writeString(view, 0, "RIFF");
    // 文件长度，RIFF 后面的字节数 = 文件总字节数 - 8
    view.setUint32(4, 36 + dataLength, true);
    // WAVE 标识符
    this.writeString(view, 8, "WAVE");
    // fmt 子块标识符
    this.writeString(view, 12, "fmt ");
    // fmt 子块长度，16 表示 PCM 格式
    view.setUint32(16, 16, true);
    // 音频格式（1表示PCM）
    view.setUint16(20, 1, true);
    // 声道数
    view.setUint16(22, this.config.channels, true);
    // 采样率
    view.setUint32(24, this.config.sampleRate, true);
    // 字节率 = 采样率 * 声道数 * (采样位数 / 8)
    view.setUint32(
      28,
      this.config.sampleRate *
        this.config.channels *
        (this.config.sampleBits / 8),
      true
    );
    // 块对齐 = 声道数 * (采样位数 / 8)
    view.setUint16(
      32,
      this.config.channels * (this.config.sampleBits / 8),
      true
    );
    // 采样位数
    view.setUint16(34, this.config.sampleBits, true);
    // data 子块标识符
    this.writeString(view, 36, "data");
    // 数据长度
    view.setUint32(40, dataLength, true);

    // 写入 PCM 数据
    const offset = 44;
    if (this.config.sampleBits === 8) {
      const uint8Data = pcmData;
      for (let i = 0; i < uint8Data.length; i++) {
        view.setUint8(offset + i, uint8Data[i]);
      }
    } else {
      const int16Data = pcmData;
      for (let i = 0; i < int16Data.length; i++) {
        view.setInt16(offset + i * 2, int16Data[i], true);
      }
    }

    return buffer;
  }

  /**
   * 将字符串写入 DataView
   * 用于在 WAV 文件头部写入标识符，如 "RIFF"、"WAVE" 等。
   * @param view - DataView 对象
   * @param offset - 写入位置的偏移量
   * @param string - 要写入的字符串
   * @private
   */
  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
