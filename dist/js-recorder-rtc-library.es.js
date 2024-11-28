var C = Object.defineProperty;
var u = (l, t, e) => t in l ? C(l, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : l[t] = e;
var c = (l, t, e) => u(l, typeof t != "symbol" ? t + "" : t, e);
var r = /* @__PURE__ */ ((l) => (l.INACTIVE = "inactive", l.RECORDING = "recording", l.PAUSED = "paused", l))(r || {});
class d {
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
  constructor(t = {}) {
    /**
     * 录音配置参数：采样率、采样位数、声道数、缓冲区大小
     * @private
     */
    c(this, "config");
    /**
     * Web Audio API 音频上下文
     * @private
     */
    c(this, "audioContext");
    /**
     * 媒体流对象，表示从麦克风获取的音频流
     * @private
     */
    c(this, "stream");
    /**
     * AudioWorkletNode 或 ScriptProcessorNode 节点
     * @private
     */
    c(this, "recorderNode");
    /**
     * 存储录音的音频数据数组,存储左声道和右声道
     * @private
     */
    c(this, "audioData");
    /**
     * 实际使用的采样率，可能与请求的采样率不同。
     * 浏览器可能会调整实际采样率以适应设备。（这个是设备决定的）
     * @private
     */
    c(this, "actualSampleRate");
    /**
     * 当前录音状态 未激活/录音中/已暂停
     * @private
     */
    c(this, "status");
    /**
     * 实时 PCM 数据回调函数
     * @private
     */
    c(this, "onPCMDataCallback", null);
    this.config = {
      sampleRate: t.sampleRate || 48e3,
      sampleBits: t.sampleBits || 8,
      channels: t.channels || 1,
      bufferSize: t.bufferSize || 4096
    }, this.validateConfig(), this.audioContext = null, this.stream = null, this.recorderNode = null, this.audioData = {
      l: [],
      r: []
    }, this.actualSampleRate = this.config.sampleRate, this.status = r.INACTIVE;
  }
  /**
   * 验证录音配置参数是否有效。
   * 检查采样位数、声道数和采样率是否在允许范围内。
   * @throws {Error} 当参数无效时抛出错误
   * @private
   */
  validateConfig() {
    if (![8, 16].includes(this.config.sampleBits))
      throw new Error("采样位数必须是 8 或 16");
    if (![1, 2].includes(this.config.channels))
      throw new Error("声道数必须是 1 或 2");
    if (this.config.sampleRate < 8e3 || this.config.sampleRate > 96e3)
      throw new Error("采样率必须在 8000 至 96000 之间");
  }
  /**
   * 获取当前录音状态
   * @returns {RecorderStatus} 当前状态
   */
  getStatus() {
    return this.status;
  }
  /**
   * 初始化录音功能
   * 请求麦克风权限，并设置音频处理节点（AudioWorkletNode 或 ScriptProcessorNode）。
   * @throws {Error} 初始化失败时抛出错误
   */
  async init() {
    try {
      const t = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          // 请求的采样率 约束条件
          channelCount: this.config.channels,
          // 请求的声道数 约束条件
          echoCancellation: !0
          // 启用回声消除
        }
      }), e = t.getAudioTracks()[0];
      console.log("音频轨道设置:", e.getSettings()), console.log("音频轨道约束:", e.getConstraints());
      const o = window.AudioContext || window.webkitAudioContext;
      if (!o)
        throw new Error("当前浏览器不支持 Web Audio API");
      this.audioContext = new o({
        // sampleRate: this.config.sampleRate, // 请求的采样率 设置了但是设备不一定支持和使用这个
      }), this.stream = t;
      const i = this.audioContext.createMediaStreamSource(t);
      if (this.actualSampleRate = this.audioContext.sampleRate, "audioWorklet" in this.audioContext)
        try {
          const s = new URL("data:video/mp2t;base64,LyoNCiAqIEBBdXRob3I6IHdlYmJlclFpYW4NCiAqIEBEYXRlOiAyMDI0LTExLTE0IDE0OjI3OjM0DQogKiBATGFzdEVkaXRUaW1lOiAyMDI0LTExLTI1IDE0OjA1OjU0DQogKiBATGFzdEVkaXRvcnM6IHdlYmJlclFpYW4NCiAqIEBEZXNjcmlwdGlvbjpSZWNvcmRlclByb2Nlc3Nvcg0KICog5rKh5pyJ55CG5oOz77yM5L2V5b+F6L+c5pa544CCDQogKi8NCi8qKg0KICogUmVjb3JkZXJQcm9jZXNzb3Ig5piv5LiA5LiqIEF1ZGlvV29ya2xldFByb2Nlc3Nvcu+8jOeUqOS6juWkhOeQhumfs+mikeaVsOaNruOAgg0KICog5a6D5o6l5pS25p2l6Ieq5Li757q/56iL55qE5ZG95Luk5p2l5o6n5Yi25b2V6Z+z54q25oCB77yM5bm25bCG5b2V5Yi255qE6Z+z6aKR5pWw5o2u5Y+R6YCB5Zue5Li757q/56iL44CCDQogKi8NCmNsYXNzIFJlY29yZGVyUHJvY2Vzc29yIGV4dGVuZHMgQXVkaW9Xb3JrbGV0UHJvY2Vzc29yIHsNCiAgLy8g5b2V6Z+z54q25oCB5qCH5b+X77yM5Yid5aeL5Li65LiN5b2V6Z+zDQogIHByaXZhdGUgcmVjb3JkaW5nOiBib29sZWFuOw0KICBidWZmZXJTaXplOiBudW1iZXI7DQogIGNoYW5uZWxzOiBudW1iZXI7DQoNCiAgY29uc3RydWN0b3Iob3B0aW9uczogQXVkaW9Xb3JrbGV0Tm9kZU9wdGlvbnMpIHsNCiAgICBzdXBlcihvcHRpb25zKTsNCiAgICAvLyDnm5HlkKzmnaXoh6rkuLvnur/nqIvnmoTmtojmga8NCiAgICB0aGlzLnBvcnQub25tZXNzYWdlID0gdGhpcy5oYW5kbGVNZXNzYWdlLmJpbmQodGhpcyk7DQogICAgLy8g5Yid5aeL5YyW5b2V6Z+z54q25oCB5Li65LiN5b2V6Z+zDQogICAgdGhpcy5yZWNvcmRpbmcgPSBmYWxzZTsNCiAgICAvLyDor7vlj5YgcHJvY2Vzc29yT3B0aW9ucyDkuK3nmoQgYnVmZmVyU2l6ZSDvvIjnvJPlhrLlpKflsI/vvIkNCiAgICB0aGlzLmJ1ZmZlclNpemUgPSBvcHRpb25zLnByb2Nlc3Nvck9wdGlvbnMuYnVmZmVyU2l6ZTsNCiAgICAvLyDlo7DpgZPmlbDph48gMXwyDQogICAgdGhpcy5jaGFubmVscyA9IG9wdGlvbnMucHJvY2Vzc29yT3B0aW9ucy5jaGFubmVsczsNCiAgfQ0KDQogIC8qKg0KICAgKiDlpITnkIbmnaXoh6rkuLvnur/nqIvnmoTmtojmga8NCiAgICog5qC55o2u5o6l5pS25Yiw55qE5ZG95Luk5o6n5Yi25b2V6Z+z54q25oCBDQogICAqIEBwYXJhbSBldmVudCAtIOa2iOaBr+S6i+S7tuWvueixoQ0KICAgKi8NCiAgcHJpdmF0ZSBoYW5kbGVNZXNzYWdlKGV2ZW50OiBNZXNzYWdlRXZlbnQpOiB2b2lkIHsNCiAgICBjb25zdCB7IGNvbW1hbmQgfSA9IGV2ZW50LmRhdGE7DQogICAgc3dpdGNoIChjb21tYW5kKSB7DQogICAgICBjYXNlICJzdGFydCI6DQogICAgICAgIC8vIOW8gOWni+W9lemfsw0KICAgICAgICB0aGlzLnJlY29yZGluZyA9IHRydWU7DQogICAgICAgIGJyZWFrOw0KICAgICAgY2FzZSAicGF1c2UiOg0KICAgICAgICAvLyDmmoLlgZzlvZXpn7MNCiAgICAgICAgdGhpcy5yZWNvcmRpbmcgPSBmYWxzZTsNCiAgICAgICAgYnJlYWs7DQogICAgICBjYXNlICJyZXN1bWUiOg0KICAgICAgICAvLyDmgaLlpI3lvZXpn7MNCiAgICAgICAgdGhpcy5yZWNvcmRpbmcgPSB0cnVlOw0KICAgICAgICBicmVhazsNCiAgICAgIGNhc2UgInN0b3AiOg0KICAgICAgICAvLyDlgZzmraLlvZXpn7PlubbmuIXnqbrpn7PpopHmlbDmja4NCiAgICAgICAgdGhpcy5yZWNvcmRpbmcgPSBmYWxzZTsNCiAgICAgICAgYnJlYWs7DQogICAgICBkZWZhdWx0Og0KICAgICAgICAvLyDlpITnkIbmnKror4bliKvnmoTlkb3ku6QNCiAgICAgICAgY29uc29sZS53YXJuKGDmnKrnn6XnmoTlkb3ku6Q6ICR7Y29tbWFuZH1gKTsNCiAgICB9DQogIH0NCg0KICAvKioNCiAgICogQXVkaW9Xb3JrbGV0UHJvY2Vzc29yIOeahOaguOW/g+WkhOeQhuaWueazlQ0KICAgKiDlnKjmr4/kuKrpn7PpopHlpITnkIblkajmnJ/osIPnlKjkuIDmrKENCiAgICogQXVkaW9Xb3JrbGV0UHJvY2Vzc29yIOWkhOeQhumfs+mikeaVsOaNrueahOWdl+Wkp+Wwj+WbuuWumuS4uiAxMjjluKfvvIzov5nkuKrlpKflsI/mmK/nlLEgV2ViIEF1ZGlvIEFQSSDop4TojIPlrprkuYnnmoTvvIzml6Dms5Xmm7TmlLnjgIINCiAgICog5q+P5bin55qE5pe26Ze06ZW/5bqm5Y+W5Yaz5LqO6Z+z6aKR5LiK5LiL5paH55qE6YeH5qC3546H44CC5L6L5aaC77yaDQogICAqICDlpoLmnpzph4fmoLfnjofmmK8gNDhrSHrvvIzliJnmr4/luKfnmoTml7bpl7TkuLogMS80ODAwMCDnp5LjgIINCiAgICogIDEyOOW4p+eahOaVsOaNruaMgee7reaXtumXtOaYryAxMjgvNDgwMDAg56eSIOKJiCAyLjY3bXPjgIINCiAgICogQHBhcmFtIGlucHV0cyAtIOi+k+WFpeeahOmfs+mikemAmumBk+aVsOaNrg0KICAgKiBAcGFyYW0gb3V0cHV0cyAtIOi+k+WHuueahOmfs+mikemAmumBk+aVsOaNrg0KICAgKiBAcGFyYW0gcGFyYW1ldGVycyAtIOWPr+iwg+WPguaVsA0KICAgKiBAcmV0dXJucyDov5Tlm54gdHJ1ZSDku6Xkv53mjIHlpITnkIblmajlpITkuo7mtLvliqjnirbmgIENCiAgICovDQogIHByb2Nlc3MoDQogICAgaW5wdXRzOiBGbG9hdDMyQXJyYXlbXVtdLA0KICAgIG91dHB1dHM6IEZsb2F0MzJBcnJheVtdW10sDQogICAgLy8gcGFyYW1ldGVyczogUmVjb3JkPHN0cmluZywgRmxvYXQzMkFycmF5Pg0KICApOiBib29sZWFuIHsNCiAgICBpZiAodGhpcy5yZWNvcmRpbmcpIHsNCiAgICAgIGNvbnN0IGlucHV0ID0gaW5wdXRzWzBdOyAvLyDovpPlhaXpn7PpopHmtYENCiAgICAgIGNvbnN0IG91dHB1dCA9IG91dHB1dHNbMF07IC8vIOi+k+WHuumfs+mikea1gQ0KICAgICAgLy8g5qOA5p+l5piv5ZCm5pyJ6L6T5YWl6Z+z6aKR5pWw5o2uDQogICAgICBpZiAoaW5wdXQubGVuZ3RoID4gMCkgew0KICAgICAgICAvLyDpgY3ljobmr4/kuKrlo7DpgZPnmoTmlbDmja7vvIzlubblpI3liLbkuIDku70NCiAgICAgICAgY29uc3QgY2hhbm5lbERhdGEgPSBpbnB1dC5tYXAoKGNoYW5uZWwpID0+IGNoYW5uZWwuc2xpY2UoKSk7DQogICAgICAgIC8vIOWwhuWkjeWItueahOmfs+mikeaVsOaNrumAmui/h+err+WPo+WPkemAgeWbnuS4u+e6v+eoiw0KICAgICAgICB0aGlzLnBvcnQucG9zdE1lc3NhZ2UoY2hhbm5lbERhdGEpOw0KICAgICAgfQ0KICAgIH0NCiAgICAvLyDov5Tlm54gdHJ1ZSDku6Xnu6fnu63lpITnkIbpn7PpopENCiAgICByZXR1cm4gdHJ1ZTsNCiAgfQ0KfQ0KDQovLyDms6jlhozlpITnkIblmajvvIzkvb/lhbblnKggQXVkaW9Xb3JrbGV0IOS4reWPr+eUqA0KcmVnaXN0ZXJQcm9jZXNzb3IoInJlY29yZGVyLXByb2Nlc3NvciIsIFJlY29yZGVyUHJvY2Vzc29yKTsNCg0KLy8g5Li6IFR5cGVTY3JpcHQg5aKe5Yqg5YWo5bGA57G75Z6L5aOw5piODQpkZWNsYXJlIGdsb2JhbCB7DQogIGludGVyZmFjZSBBdWRpb1dvcmtsZXRHbG9iYWxTY29wZSB7DQogICAgcmVnaXN0ZXJQcm9jZXNzb3IoDQogICAgICBuYW1lOiBzdHJpbmcsDQogICAgICBwcm9jZXNzb3JDdG9yOiB0eXBlb2YgUmVjb3JkZXJQcm9jZXNzb3INCiAgICApOiB2b2lkOw0KICB9DQp9DQoNCmRlY2xhcmUgY2xhc3MgQXVkaW9Xb3JrbGV0UHJvY2Vzc29yIHsNCiAgY29uc3RydWN0b3Iob3B0aW9ucz86IEF1ZGlvV29ya2xldE5vZGVPcHRpb25zKTsNCiAgcmVhZG9ubHkgcG9ydDogTWVzc2FnZVBvcnQ7DQogIHByb2Nlc3MoDQogICAgaW5wdXRzOiBGbG9hdDMyQXJyYXlbXVtdLA0KICAgIG91dHB1dHM6IEZsb2F0MzJBcnJheVtdW10sDQogICAgcGFyYW1ldGVyczogUmVjb3JkPHN0cmluZywgRmxvYXQzMkFycmF5Pg0KICApOiBib29sZWFuOw0KfQ0KDQpkZWNsYXJlIGZ1bmN0aW9uIHJlZ2lzdGVyUHJvY2Vzc29yKA0KICBuYW1lOiBzdHJpbmcsDQogIHByb2Nlc3NvckN0b3I6IHR5cGVvZiBBdWRpb1dvcmtsZXRQcm9jZXNzb3INCik6IHZvaWQ7DQo=", import.meta.url).href;
          await this.audioContext.audioWorklet.addModule(s), this.recorderNode = new AudioWorkletNode(
            this.audioContext,
            "recorder-processor",
            {
              processorOptions: {
                channels: this.config.channels,
                bufferSize: this.config.bufferSize
              }
            }
          ), this.recorderNode.port.onmessage = this.handleWorkletMessage.bind(this), i.connect(this.recorderNode), this.recorderNode.connect(this.audioContext.destination);
        } catch (s) {
          console.warn(
            "AudioWorklet 初始化失败，尝试使用 ScriptProcessorNode:",
            s
          ), this.setupScriptProcessorNode(i);
        }
      else
        this.setupScriptProcessorNode(i);
    } catch (t) {
      throw console.error("录音初始化失败:", t), t;
    }
  }
  /**
   * 设置 ScriptProcessorNode
   * ScriptProcessorNode 是 Web Audio API 提供的用于处理音频数据的节点，但已被弃用，推荐使用 AudioWorklet。
   * @param source - 音频源节点
   * @private
   */
  setupScriptProcessorNode(t) {
    const e = this.audioContext.createScriptProcessor(
      this.config.bufferSize,
      // 缓冲区大小
      this.config.channels,
      // 输入声道数
      this.config.channels
      // 输出声道数
    );
    e.onaudioprocess = this.handleScriptProcessorProcess.bind(this), t.connect(e), e.connect(this.audioContext.destination), this.recorderNode = e;
  }
  /**
   * 处理来自 AudioWorklet 的消息
   * 将音频数据保存到 audioData 数组中
   * @param event - 消息事件对象
   * @private
   */
  handleWorkletMessage(t) {
    if (this.status !== r.RECORDING) return;
    const e = t.data, o = this.config.channels;
    o === 1 ? this.audioData.l.push(new Float32Array(e[0])) : o === 2 && (this.audioData.l.push(new Float32Array(e[0])), this.audioData.r.push(new Float32Array(e[1] || [])));
    const i = [
      this.resampleSync(
        new Float32Array(e[0]),
        this.actualSampleRate,
        this.config.sampleRate
      )
    ];
    if (o === 2 && i.push(
      this.resampleSync(
        new Float32Array(e[1]),
        this.actualSampleRate,
        this.config.sampleRate
      )
    ), this.onPCMDataCallback) {
      const s = this.interleaveChannels(i);
      this.onPCMDataCallback(s);
    }
  }
  /**
   * 处理来自 ScriptProcessorNode 的音频数据
   * 将接收到的音频数据保存到 audioData 数组中，并进行重采样处理。
   * @param event - 音频处理事件对象
   * @private
   */
  handleScriptProcessorProcess(t) {
    if (this.status !== r.RECORDING) return;
    const e = t.inputBuffer, o = e.numberOfChannels;
    for (let s = 0; s < o; s++) {
      const a = e.getChannelData(s);
      o === 1 ? this.audioData.l.push(new Float32Array(a)) : o === 2 && (s === 0 ? this.audioData.l.push(new Float32Array(a)) : s === 1 && this.audioData.r.push(new Float32Array(a)));
    }
    const i = [
      this.resampleSync(
        new Float32Array(e.getChannelData(0)),
        this.actualSampleRate,
        this.config.sampleRate
      )
    ];
    if (o === 2 && i.push(
      this.resampleSync(
        new Float32Array(e.getChannelData(1)),
        this.actualSampleRate,
        this.config.sampleRate
      )
    ), this.onPCMDataCallback) {
      const s = this.interleaveChannels(i);
      this.onPCMDataCallback(s);
    }
  }
  /**
   * 开始录音
   * 如果当前状态不是录音中，则清空已有的音频数据，设置状态为录音中，并开始录音。
   */
  start() {
    this.status !== r.RECORDING && (this.audioData.l = [], this.audioData.r = [], this.status = r.RECORDING, this.recorderNode instanceof AudioWorkletNode && this.recorderNode.port.postMessage({ command: "start" }));
  }
  /**
   * 暂停录音
   * 如果当前状态是录音中，则设置状态为暂停，并暂停录音。
   */
  pause() {
    this.status === r.RECORDING && this.recorderNode && (this.status = r.PAUSED, this.recorderNode instanceof AudioWorkletNode && this.recorderNode.port.postMessage({ command: "pause" }));
  }
  /**
   * 恢复录音
   * 如果当前状态是暂停，则设置状态为录音中，并恢复录音。
   */
  resume() {
    this.status === r.PAUSED && this.recorderNode && (this.status = r.RECORDING, this.recorderNode instanceof AudioWorkletNode && this.recorderNode.port.postMessage({ command: "resume" }));
  }
  /**
   * 停止录音
   * 设置状态为非活动状态，停止所有音频轨道，断开音频节点连接，关闭音频上下文。
   */
  stop() {
    this.status = r.INACTIVE, this.stream && this.stream.getTracks().forEach((t) => t.stop()), this.recorderNode && (this.recorderNode instanceof AudioWorkletNode && this.recorderNode.port.postMessage({ command: "stop" }), this.recorderNode.disconnect()), this.audioContext && this.audioContext.close();
  }
  /**
   * 设置实时 PCM 数据的回调函数。
   * 当有新的 PCM 数据时，会调用该回调函数。
   * @param callback - 接收 PCM 数据的回调函数
   */
  setPCMDataCallback(t) {
    this.onPCMDataCallback = t;
  }
  /**
   * 导出 PCM 数据
   * @returns { Uint8Array | int16Array} PCM 格式的音频数据
   */
  exportPCM() {
    if (this.status === r.RECORDING)
      throw new Error("录音进行中，无法导出PCM数据。请先停止录音。");
    const t = this.mergeAudioData();
    let e;
    if (this.actualSampleRate !== this.config.sampleRate ? e = this.resampleSync(
      t,
      this.actualSampleRate,
      this.config.sampleRate
    ) : e = t, this.config.sampleBits === 8) {
      const o = new Uint8Array(e.length);
      for (let i = 0; i < e.length; i++)
        o[i] = Math.max(
          0,
          Math.min(255, Math.floor((e[i] + 1) * 127.5))
        );
      return o;
    } else {
      const o = new Int16Array(e.length);
      for (let i = 0; i < e.length; i++)
        o[i] = Math.max(
          -32768,
          Math.min(32767, Math.floor(e[i] * 32767))
        );
      return o;
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
  resampleSync(t, e, o) {
    if (e === o)
      return t;
    const i = e / o, s = Math.floor(t.length / i), a = new Float32Array(s);
    for (let n = 0; n < s; n++) {
      const I = n * i, g = Math.floor(I), h = I - g;
      g + 1 < t.length ? a[n] = t[g] * (1 - h) + t[g + 1] * h : a[n] = t[g];
    }
    return a;
  }
  /**
   * 合并音频数据。
   * 将所有录音片段合并为一个连续的 Float32Array。
   * @returns {Float32Array} 合并后的音频数据
   * @private
   */
  mergeAudioData() {
    const t = this.mergeFloat32Arrays(this.audioData.l);
    let e = null;
    if (this.config.channels === 2 && (e = this.mergeFloat32Arrays(this.audioData.r)), this.config.channels === 1)
      return t;
    if (this.config.channels === 2 && e)
      return this.interleaveChannels([t, e]);
    throw new Error("不支持的声道数");
  }
  /**
   * 合并多个 Float32Array 为一个
   * @param arrays - 需要合并的 Float32Array 数组
   * @returns {Float32Array} 合并后的 Float32Array
   * @private
   */
  mergeFloat32Arrays(t) {
    const e = t.reduce((s, a) => s + a.length, 0), o = new Float32Array(e);
    let i = 0;
    return t.forEach((s) => {
      o.set(s, i), i += s.length;
    }), o;
  }
  /**
   * 交错多个声道的数据  交换逻辑 L1 R1 L2 R2
   * @param channelsData - 每个声道的 Float32Array
   * @returns {Float32Array} 交错后的音频数据
   * @private
   */
  interleaveChannels(t) {
    const e = t.length, o = t.reduce(
      (s, a) => Math.max(s, a.length),
      0
    ), i = new Float32Array(o * e);
    for (let s = 0; s < o; s++)
      for (let a = 0; a < e; a++)
        i[s * e + a] = t[a][s] || 0;
    return i;
  }
  /**
   * 导出 WAV 格式音频文件。
   * 先导出 PCM 数据，然后将其封装为 WAV 格式的 Blob 对象。
   * @returns {Blob} WAV 格式的 Blob 对象
   * @throws {Error} 如果录音正在进行中，抛出错误
   */
  exportWAV() {
    if (this.status === r.RECORDING)
      throw new Error("录音进行中，无法导出WAV文件。请先停止录音。");
    const t = this.exportPCM(), e = this.createWavFile(t);
    return new Blob([e], { type: "audio/wav" });
  }
  /**
   * 创建 WAV 文件。
   * 根据 PCM 数据和录音配置，生成包含 WAV 头部信息的 ArrayBuffer。
   * WAV 文件包含 RIFF 头、fmt 子块和 data 子块。
   * @param pcmData - PCM 音频数据，可以是 Uint8Array 或 Int16Array
   * @returns {ArrayBuffer} 包含 WAV 头部信息的音频数据
   * @private
   */
  createWavFile(t) {
    const e = t.length * (this.config.sampleBits / 8), o = new ArrayBuffer(44 + e), i = new DataView(o);
    this.writeString(i, 0, "RIFF"), i.setUint32(4, 36 + e, !0), this.writeString(i, 8, "WAVE"), this.writeString(i, 12, "fmt "), i.setUint32(16, 16, !0), i.setUint16(20, 1, !0), i.setUint16(22, this.config.channels, !0), i.setUint32(24, this.config.sampleRate, !0), i.setUint32(
      28,
      this.config.sampleRate * this.config.channels * (this.config.sampleBits / 8),
      !0
    ), i.setUint16(
      32,
      this.config.channels * (this.config.sampleBits / 8),
      !0
    ), i.setUint16(34, this.config.sampleBits, !0), this.writeString(i, 36, "data"), i.setUint32(40, e, !0);
    const s = 44;
    if (this.config.sampleBits === 8) {
      const a = t;
      for (let n = 0; n < a.length; n++)
        i.setUint8(s + n, a[n]);
    } else {
      const a = t;
      for (let n = 0; n < a.length; n++)
        i.setInt16(s + n * 2, a[n], !0);
    }
    return o;
  }
  /**
   * 将字符串写入 DataView
   * 用于在 WAV 文件头部写入标识符，如 "RIFF"、"WAVE" 等。
   * @param view - DataView 对象
   * @param offset - 写入位置的偏移量
   * @param string - 要写入的字符串
   * @private
   */
  writeString(t, e, o) {
    for (let i = 0; i < o.length; i++)
      t.setUint8(e + i, o.charCodeAt(i));
  }
}
export {
  d as Recorder
};
