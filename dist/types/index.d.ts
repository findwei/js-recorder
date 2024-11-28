/**
 * 录音机类
 * 支持录制音频并导出为 PCM 或 WAV 格式
 * 支持配置采样率、采样位数、声道数等参数
 */
export declare class Recorder {
    /**
     * 录音配置参数：采样率、采样位数、声道数、缓冲区大小
     * @private
     */
    private readonly config;
    /**
     * Web Audio API 音频上下文
     * @private
     */
    private audioContext;
    /**
     * 媒体流对象，表示从麦克风获取的音频流
     * @private
     */
    private stream;
    /**
     * AudioWorkletNode 或 ScriptProcessorNode 节点
     * @private
     */
    private recorderNode;
    /**
     * 存储录音的音频数据数组,存储左声道和右声道
     * @private
     */
    private audioData;
    /**
     * 实际使用的采样率，可能与请求的采样率不同。
     * 浏览器可能会调整实际采样率以适应设备。（这个是设备决定的）
     * @private
     */
    private actualSampleRate;
    /**
     * 当前录音状态 未激活/录音中/已暂停
     * @private
     */
    private status;
    /**
     * 实时 PCM 数据回调函数
     * @private
     */
    private onPCMDataCallback;
    /**
     * 初始化录音器的配置和状态。
     * @param options - 录音配置选项
     */
    constructor(options?: RecorderConfig);
    /**
     * 验证录音配置参数是否有效。
     * 检查采样位数、声道数和采样率是否在允许范围内。
     * @throws {Error} 当参数无效时抛出错误
     * @private
     */
    private validateConfig;
    /**
     * 获取当前录音状态
     * @returns {RecorderStatus} 当前状态
     */
    getStatus(): RecorderStatus;
    /**
     * 初始化录音功能
     * 请求麦克风权限，并设置音频处理节点（AudioWorkletNode 或 ScriptProcessorNode）。
     * @throws {Error} 初始化失败时抛出错误
     */
    init(): Promise<void>;
    /**
     * 设置 ScriptProcessorNode
     * ScriptProcessorNode 是 Web Audio API 提供的用于处理音频数据的节点，但已被弃用，推荐使用 AudioWorklet。
     * @param source - 音频源节点
     * @private
     */
    private setupScriptProcessorNode;
    /**
     * 处理来自 AudioWorklet 的消息
     * 将音频数据保存到 audioData 数组中
     * @param event - 消息事件对象
     * @private
     */
    private handleWorkletMessage;
    /**
     * 处理来自 ScriptProcessorNode 的音频数据
     * 将接收到的音频数据保存到 audioData 数组中，并进行重采样处理。
     * @param event - 音频处理事件对象
     * @private
     */
    private handleScriptProcessorProcess;
    /**
     * 开始录音
     * 如果当前状态不是录音中，则清空已有的音频数据，设置状态为录音中，并开始录音。
     */
    start(): void;
    /**
     * 暂停录音
     * 如果当前状态是录音中，则设置状态为暂停，并暂停录音。
     */
    pause(): void;
    /**
     * 恢复录音
     * 如果当前状态是暂停，则设置状态为录音中，并恢复录音。
     */
    resume(): void;
    /**
     * 停止录音
     * 设置状态为非活动状态，停止所有音频轨道，断开音频节点连接，关闭音频上下文。
     */
    stop(): void;
    /**
     * 设置实时 PCM 数据的回调函数。
     * 当有新的 PCM 数据时，会调用该回调函数。
     * @param callback - 接收 PCM 数据的回调函数
     */
    setPCMDataCallback(callback: (pcmData: Float32Array) => void): void;
    /**
     * 导出 PCM 数据
     * @returns { Uint8Array | int16Array} PCM 格式的音频数据
     */
    exportPCM(): Uint8Array | Int16Array;
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
    private resampleSync;
    /**
     * 合并音频数据。
     * 将所有录音片段合并为一个连续的 Float32Array。
     * @returns {Float32Array} 合并后的音频数据
     * @private
     */
    private mergeAudioData;
    /**
     * 合并多个 Float32Array 为一个
     * @param arrays - 需要合并的 Float32Array 数组
     * @returns {Float32Array} 合并后的 Float32Array
     * @private
     */
    private mergeFloat32Arrays;
    /**
     * 交错多个声道的数据  交换逻辑 L1 R1 L2 R2
     * @param channelsData - 每个声道的 Float32Array
     * @returns {Float32Array} 交错后的音频数据
     * @private
     */
    private interleaveChannels;
    /**
     * 导出 WAV 格式音频文件。
     * 先导出 PCM 数据，然后将其封装为 WAV 格式的 Blob 对象。
     * @returns {Blob} WAV 格式的 Blob 对象
     * @throws {Error} 如果录音正在进行中，抛出错误
     */
    exportWAV(): Blob;
    /**
     * 创建 WAV 文件。
     * 根据 PCM 数据和录音配置，生成包含 WAV 头部信息的 ArrayBuffer。
     * WAV 文件包含 RIFF 头、fmt 子块和 data 子块。
     * @param pcmData - PCM 音频数据，可以是 Uint8Array 或 Int16Array
     * @returns {ArrayBuffer} 包含 WAV 头部信息的音频数据
     * @private
     */
    private createWavFile;
    /**
     * 将字符串写入 DataView
     * 用于在 WAV 文件头部写入标识符，如 "RIFF"、"WAVE" 等。
     * @param view - DataView 对象
     * @param offset - 写入位置的偏移量
     * @param string - 要写入的字符串
     * @private
     */
    private writeString;
}

/**
 * 录音配置接口
 * 定义录音器所需的所有可配置参数
 */
export declare interface RecorderConfig {
    sampleRate?: number;
    sampleBits?: 8 | 16;
    channels?: 1 | 2;
    bufferSize?: number;
}

/**
 * 录音状态枚举
 * 用于跟踪录音器当前的工作状态
 */
export declare enum RecorderStatus {
    INACTIVE = "inactive",// 未激活/已停止
    RECORDING = "recording",// 录音中
    PAUSED = "paused"
}

export { }


declare global {
    interface AudioWorkletGlobalScope {
        registerProcessor(name: string, processorCtor: typeof RecorderProcessor): void;
    }
}
