(function(c,r){typeof exports=="object"&&typeof module<"u"?r(exports):typeof define=="function"&&define.amd?define(["exports"],r):(c=typeof globalThis<"u"?globalThis:c||self,r(c.jsRecorderRtc={}))})(this,function(c){"use strict";var m=Object.defineProperty;var A=(c,r,n)=>r in c?m(c,r,{enumerable:!0,configurable:!0,writable:!0,value:n}):c[r]=n;var g=(c,r,n)=>A(c,typeof r!="symbol"?r+"":r,n);var r=typeof document<"u"?document.currentScript:null,n=(h=>(h.INACTIVE="inactive",h.RECORDING="recording",h.PAUSED="paused",h))(n||{});class d{constructor(e={}){g(this,"config");g(this,"audioContext");g(this,"stream");g(this,"recorderNode");g(this,"audioData");g(this,"actualSampleRate");g(this,"status");g(this,"onPCMDataCallback",null);this.config={sampleRate:e.sampleRate||48e3,sampleBits:e.sampleBits||8,channels:e.channels||1,bufferSize:e.bufferSize||4096},this.validateConfig(),this.audioContext=null,this.stream=null,this.recorderNode=null,this.audioData={l:[],r:[]},this.actualSampleRate=this.config.sampleRate,this.status=n.INACTIVE}validateConfig(){if(![8,16].includes(this.config.sampleBits))throw new Error("采样位数必须是 8 或 16");if(![1,2].includes(this.config.channels))throw new Error("声道数必须是 1 或 2");if(this.config.sampleRate<8e3||this.config.sampleRate>96e3)throw new Error("采样率必须在 8000 至 96000 之间")}getStatus(){return this.status}async init(){try{const e=await navigator.mediaDevices.getUserMedia({audio:{sampleRate:this.config.sampleRate,channelCount:this.config.channels,echoCancellation:!0}}),i=e.getAudioTracks()[0];console.log("音频轨道设置:",i.getSettings()),console.log("音频轨道约束:",i.getConstraints());const o=window.AudioContext||window.webkitAudioContext;if(!o)throw new Error("当前浏览器不支持 Web Audio API");this.audioContext=new o({}),this.stream=e;const t=this.audioContext.createMediaStreamSource(e);if(this.actualSampleRate=this.audioContext.sampleRate,"audioWorklet"in this.audioContext)try{const s=new URL("data:video/mp2t;base64,LyoNCiAqIEBBdXRob3I6IHdlYmJlclFpYW4NCiAqIEBEYXRlOiAyMDI0LTExLTE0IDE0OjI3OjM0DQogKiBATGFzdEVkaXRUaW1lOiAyMDI0LTExLTI5IDEzOjU1OjM1DQogKiBATGFzdEVkaXRvcnM6IHdlYmJlclFpYW4NCiAqIEBEZXNjcmlwdGlvbjpSZWNvcmRlclByb2Nlc3Nvcg0KICog5rKh5pyJ55CG5oOz77yM5L2V5b+F6L+c5pa544CCDQogKi8NCi8qKg0KICogUmVjb3JkZXJQcm9jZXNzb3Ig5piv5LiA5LiqIEF1ZGlvV29ya2xldFByb2Nlc3Nvcu+8jOeUqOS6juWkhOeQhumfs+mikeaVsOaNruOAgg0KICog5a6D5o6l5pS25p2l6Ieq5Li757q/56iL55qE5ZG95Luk5p2l5o6n5Yi25b2V6Z+z54q25oCB77yM5bm25bCG5b2V5Yi255qE6Z+z6aKR5pWw5o2u5Y+R6YCB5Zue5Li757q/56iL44CCDQogKi8NCmNsYXNzIFJlY29yZGVyUHJvY2Vzc29yIGV4dGVuZHMgQXVkaW9Xb3JrbGV0UHJvY2Vzc29yIHsNCiAgLy8g5b2V6Z+z54q25oCB5qCH5b+X77yM5Yid5aeL5Li65LiN5b2V6Z+zDQogIHByaXZhdGUgcmVjb3JkaW5nOiBib29sZWFuOw0KICBidWZmZXJTaXplOiBudW1iZXI7DQogIGNoYW5uZWxzOiBudW1iZXI7DQoNCiAgY29uc3RydWN0b3Iob3B0aW9uczogQXVkaW9Xb3JrbGV0Tm9kZU9wdGlvbnMpIHsNCiAgICBzdXBlcihvcHRpb25zKTsNCiAgICAvLyDnm5HlkKzmnaXoh6rkuLvnur/nqIvnmoTmtojmga8NCiAgICB0aGlzLnBvcnQub25tZXNzYWdlID0gdGhpcy5oYW5kbGVNZXNzYWdlLmJpbmQodGhpcyk7DQogICAgLy8g5Yid5aeL5YyW5b2V6Z+z54q25oCB5Li65LiN5b2V6Z+zDQogICAgdGhpcy5yZWNvcmRpbmcgPSBmYWxzZTsNCiAgICAvLyDor7vlj5YgcHJvY2Vzc29yT3B0aW9ucyDkuK3nmoQgYnVmZmVyU2l6ZSDvvIjnvJPlhrLlpKflsI/vvIkNCiAgICB0aGlzLmJ1ZmZlclNpemUgPSBvcHRpb25zLnByb2Nlc3Nvck9wdGlvbnMuYnVmZmVyU2l6ZTsNCiAgICAvLyDlo7DpgZPmlbDph48gMXwyDQogICAgdGhpcy5jaGFubmVscyA9IG9wdGlvbnMucHJvY2Vzc29yT3B0aW9ucy5jaGFubmVsczsNCiAgfQ0KDQogIC8qKg0KICAgKiDlpITnkIbmnaXoh6rkuLvnur/nqIvnmoTmtojmga8NCiAgICog5qC55o2u5o6l5pS25Yiw55qE5ZG95Luk5o6n5Yi25b2V6Z+z54q25oCBDQogICAqIEBwYXJhbSBldmVudCAtIOa2iOaBr+S6i+S7tuWvueixoQ0KICAgKi8NCiAgcHJpdmF0ZSBoYW5kbGVNZXNzYWdlKGV2ZW50OiBNZXNzYWdlRXZlbnQpOiB2b2lkIHsNCiAgICBjb25zdCB7IGNvbW1hbmQgfSA9IGV2ZW50LmRhdGE7DQogICAgc3dpdGNoIChjb21tYW5kKSB7DQogICAgICBjYXNlICJzdGFydCI6DQogICAgICAgIC8vIOW8gOWni+W9lemfsw0KICAgICAgICB0aGlzLnJlY29yZGluZyA9IHRydWU7DQogICAgICAgIGJyZWFrOw0KICAgICAgY2FzZSAicGF1c2UiOg0KICAgICAgICAvLyDmmoLlgZzlvZXpn7MNCiAgICAgICAgdGhpcy5yZWNvcmRpbmcgPSBmYWxzZTsNCiAgICAgICAgYnJlYWs7DQogICAgICBjYXNlICJyZXN1bWUiOg0KICAgICAgICAvLyDmgaLlpI3lvZXpn7MNCiAgICAgICAgdGhpcy5yZWNvcmRpbmcgPSB0cnVlOw0KICAgICAgICBicmVhazsNCiAgICAgIGNhc2UgInN0b3AiOg0KICAgICAgICAvLyDlgZzmraLlvZXpn7PlubbmuIXnqbrpn7PpopHmlbDmja4NCiAgICAgICAgdGhpcy5yZWNvcmRpbmcgPSBmYWxzZTsNCiAgICAgICAgYnJlYWs7DQogICAgICBkZWZhdWx0Og0KICAgICAgICAvLyDlpITnkIbmnKror4bliKvnmoTlkb3ku6QNCiAgICAgICAgY29uc29sZS53YXJuKGDmnKrnn6XnmoTlkb3ku6Q6ICR7Y29tbWFuZH1gKTsNCiAgICB9DQogIH0NCg0KICAvKioNCiAgICogQXVkaW9Xb3JrbGV0UHJvY2Vzc29yIOeahOaguOW/g+WkhOeQhuaWueazlQ0KICAgKiDlnKjmr4/kuKrpn7PpopHlpITnkIblkajmnJ/osIPnlKjkuIDmrKENCiAgICogQXVkaW9Xb3JrbGV0UHJvY2Vzc29yIOWkhOeQhumfs+mikeaVsOaNrueahOWdl+Wkp+Wwj+WbuuWumuS4uiAxMjjluKfvvIzov5nkuKrlpKflsI/mmK/nlLEgV2ViIEF1ZGlvIEFQSSDop4TojIPlrprkuYnnmoTvvIzml6Dms5Xmm7TmlLnjgIINCiAgICog5q+P5bin55qE5pe26Ze06ZW/5bqm5Y+W5Yaz5LqO6Z+z6aKR5LiK5LiL5paH55qE6YeH5qC3546H44CC5L6L5aaC77yaDQogICAqICDlpoLmnpzph4fmoLfnjofmmK8gNDhrSHrvvIzliJnmr4/luKfnmoTml7bpl7TkuLogMS80ODAwMCDnp5LjgIINCiAgICogIDEyOOW4p+eahOaVsOaNruaMgee7reaXtumXtOaYryAxMjgvNDgwMDAg56eSIOKJiCAyLjY3bXPjgIINCiAgICogQHBhcmFtIGlucHV0cyAtIOi+k+WFpeeahOmfs+mikemAmumBk+aVsOaNrg0KICAgKiBAcGFyYW0gb3V0cHV0cyAtIOi+k+WHuueahOmfs+mikemAmumBk+aVsOaNrg0KICAgKiBAcGFyYW0gcGFyYW1ldGVycyAtIOWPr+iwg+WPguaVsA0KICAgKiBAcmV0dXJucyDov5Tlm54gdHJ1ZSDku6Xkv53mjIHlpITnkIblmajlpITkuo7mtLvliqjnirbmgIENCiAgICovDQogIHByb2Nlc3MoDQogICAgaW5wdXRzOiBGbG9hdDMyQXJyYXlbXVtdLA0KICAgIG91dHB1dHM6IEZsb2F0MzJBcnJheVtdW10sDQogICAgLy8gcGFyYW1ldGVyczogUmVjb3JkPHN0cmluZywgRmxvYXQzMkFycmF5Pg0KICApOiBib29sZWFuIHsNCiAgICBpZiAodGhpcy5yZWNvcmRpbmcpIHsNCiAgICAgIGNvbnN0IGlucHV0ID0gaW5wdXRzWzBdOyAvLyDovpPlhaXpn7PpopHmtYENCiAgICAgIGNvbnN0IG91dHB1dCA9IG91dHB1dHNbMF07IC8vIOi+k+WHuumfs+mikea1gQ0KICAgICAgLy8g5qOA5p+l5piv5ZCm5pyJ6L6T5YWl6Z+z6aKR5pWw5o2uDQogICAgICBpZiAoaW5wdXQubGVuZ3RoID4gMCkgew0KICAgICAgICAvLyDpgY3ljobmr4/kuKrlo7DpgZPnmoTmlbDmja7vvIzlubblpI3liLbkuIDku70NCiAgICAgICAgY29uc3QgY2hhbm5lbERhdGEgPSBpbnB1dC5tYXAoKGNoYW5uZWwpID0+IGNoYW5uZWwuc2xpY2UoKSk7DQogICAgICAgIC8vIOWwhuWkjeWItueahOmfs+mikeaVsOaNrumAmui/h+err+WPo+WPkemAgeWbnuS4u+e6v+eoiw0KICAgICAgICB0aGlzLnBvcnQucG9zdE1lc3NhZ2UoY2hhbm5lbERhdGEpOw0KICAgICAgfQ0KICAgIH0NCiAgICAvLyDov5Tlm54gdHJ1ZSDku6Xnu6fnu63lpITnkIbpn7PpopENCiAgICByZXR1cm4gdHJ1ZTsNCiAgfQ0KfQ0KDQovLyDms6jlhozlpITnkIblmajvvIzkvb/lhbblnKggQXVkaW9Xb3JrbGV0IOS4reWPr+eUqA0KcmVnaXN0ZXJQcm9jZXNzb3IoInJlY29yZGVyLXByb2Nlc3NvciIsIFJlY29yZGVyUHJvY2Vzc29yKTsNCg0KLy8g5Li6IFR5cGVTY3JpcHQg5aKe5Yqg5YWo5bGA57G75Z6L5aOw5piODQpkZWNsYXJlIGdsb2JhbCB7DQogIGludGVyZmFjZSBBdWRpb1dvcmtsZXRHbG9iYWxTY29wZSB7DQogICAgcmVnaXN0ZXJQcm9jZXNzb3IoDQogICAgICBuYW1lOiBzdHJpbmcsDQogICAgICBwcm9jZXNzb3JDdG9yOiB0eXBlb2YgUmVjb3JkZXJQcm9jZXNzb3INCiAgICApOiB2b2lkOw0KICB9DQp9DQoNCmRlY2xhcmUgY2xhc3MgQXVkaW9Xb3JrbGV0UHJvY2Vzc29yIHsNCiAgY29uc3RydWN0b3Iob3B0aW9ucz86IEF1ZGlvV29ya2xldE5vZGVPcHRpb25zKTsNCiAgcmVhZG9ubHkgcG9ydDogTWVzc2FnZVBvcnQ7DQogIHByb2Nlc3MoDQogICAgaW5wdXRzOiBGbG9hdDMyQXJyYXlbXVtdLA0KICAgIG91dHB1dHM6IEZsb2F0MzJBcnJheVtdW10sDQogICAgcGFyYW1ldGVyczogUmVjb3JkPHN0cmluZywgRmxvYXQzMkFycmF5Pg0KICApOiBib29sZWFuOw0KfQ0KDQpkZWNsYXJlIGZ1bmN0aW9uIHJlZ2lzdGVyUHJvY2Vzc29yKA0KICBuYW1lOiBzdHJpbmcsDQogIHByb2Nlc3NvckN0b3I6IHR5cGVvZiBBdWRpb1dvcmtsZXRQcm9jZXNzb3INCik6IHZvaWQ7DQo=",typeof document>"u"&&typeof location>"u"?require("url").pathToFileURL(__filename).href:typeof document>"u"?location.href:r&&r.tagName.toUpperCase()==="SCRIPT"&&r.src||new URL("js-recorder-rtc-library.umd.js",document.baseURI).href).href;await this.audioContext.audioWorklet.addModule(s),this.recorderNode=new AudioWorkletNode(this.audioContext,"recorder-processor",{processorOptions:{channels:this.config.channels,bufferSize:this.config.bufferSize}}),this.recorderNode.port.onmessage=this.handleWorkletMessage.bind(this),t.connect(this.recorderNode),this.recorderNode.connect(this.audioContext.destination)}catch(s){console.warn("AudioWorklet 初始化失败，尝试使用 ScriptProcessorNode:",s),this.setupScriptProcessorNode(t)}else this.setupScriptProcessorNode(t)}catch(e){throw console.error("录音初始化失败:",e),e}}setupScriptProcessorNode(e){const i=this.audioContext.createScriptProcessor(this.config.bufferSize,this.config.channels,this.config.channels);i.onaudioprocess=this.handleScriptProcessorProcess.bind(this),e.connect(i),i.connect(this.audioContext.destination),this.recorderNode=i}handleWorkletMessage(e){if(this.status!==n.RECORDING)return;const i=e.data,o=this.config.channels;o===1?this.audioData.l.push(new Float32Array(i[0])):o===2&&(this.audioData.l.push(new Float32Array(i[0])),this.audioData.r.push(new Float32Array(i[1]||[])));const t=[this.resampleSync(new Float32Array(i[0]),this.actualSampleRate,this.config.sampleRate)];if(o===2&&t.push(this.resampleSync(new Float32Array(i[1]),this.actualSampleRate,this.config.sampleRate)),this.onPCMDataCallback){const s=this.interleaveChannels(t);this.onPCMDataCallback(s)}}handleScriptProcessorProcess(e){if(this.status!==n.RECORDING)return;const i=e.inputBuffer,o=i.numberOfChannels;for(let s=0;s<o;s++){const a=i.getChannelData(s);o===1?this.audioData.l.push(new Float32Array(a)):o===2&&(s===0?this.audioData.l.push(new Float32Array(a)):s===1&&this.audioData.r.push(new Float32Array(a)))}const t=[this.resampleSync(new Float32Array(i.getChannelData(0)),this.actualSampleRate,this.config.sampleRate)];if(o===2&&t.push(this.resampleSync(new Float32Array(i.getChannelData(1)),this.actualSampleRate,this.config.sampleRate)),this.onPCMDataCallback){const s=this.interleaveChannels(t);this.onPCMDataCallback(s)}}start(){this.status!==n.RECORDING&&(this.audioData.l=[],this.audioData.r=[],this.status=n.RECORDING,this.recorderNode instanceof AudioWorkletNode&&this.recorderNode.port.postMessage({command:"start"}))}pause(){this.status===n.RECORDING&&this.recorderNode&&(this.status=n.PAUSED,this.recorderNode instanceof AudioWorkletNode&&this.recorderNode.port.postMessage({command:"pause"}))}resume(){this.status===n.PAUSED&&this.recorderNode&&(this.status=n.RECORDING,this.recorderNode instanceof AudioWorkletNode&&this.recorderNode.port.postMessage({command:"resume"}))}stop(){this.status=n.INACTIVE,this.stream&&this.stream.getTracks().forEach(e=>e.stop()),this.recorderNode&&(this.recorderNode instanceof AudioWorkletNode&&this.recorderNode.port.postMessage({command:"stop"}),this.recorderNode.disconnect()),this.audioContext&&this.audioContext.close()}setPCMDataCallback(e){this.onPCMDataCallback=e}exportPCM(){if(this.status===n.RECORDING)throw new Error("录音进行中，无法导出PCM数据。请先停止录音。");const e=this.mergeAudioData();let i;if(this.actualSampleRate!==this.config.sampleRate?i=this.resampleSync(e,this.actualSampleRate,this.config.sampleRate):i=e,this.config.sampleBits===8){const o=new Uint8Array(i.length);for(let t=0;t<i.length;t++)o[t]=Math.max(0,Math.min(255,Math.floor((i[t]+1)*127.5)));return o}else{const o=new Int16Array(i.length);for(let t=0;t<i.length;t++)o[t]=Math.max(-32768,Math.min(32767,Math.floor(i[t]*32767)));return o}}resampleSync(e,i,o){if(i===o)return e;const t=i/o,s=Math.floor(e.length/t),a=new Float32Array(s);for(let l=0;l<s;l++){const u=l*t,I=Math.floor(u),C=u-I;I+1<e.length?a[l]=e[I]*(1-C)+e[I+1]*C:a[l]=e[I]}return a}mergeAudioData(){const e=this.mergeFloat32Arrays(this.audioData.l);let i=null;if(this.config.channels===2&&(i=this.mergeFloat32Arrays(this.audioData.r)),this.config.channels===1)return e;if(this.config.channels===2&&i)return this.interleaveChannels([e,i]);throw new Error("不支持的声道数")}mergeFloat32Arrays(e){const i=e.reduce((s,a)=>s+a.length,0),o=new Float32Array(i);let t=0;return e.forEach(s=>{o.set(s,t),t+=s.length}),o}interleaveChannels(e){const i=e.length,o=e.reduce((s,a)=>Math.max(s,a.length),0),t=new Float32Array(o*i);for(let s=0;s<o;s++)for(let a=0;a<i;a++)t[s*i+a]=e[a][s]||0;return t}exportWAV(){if(this.status===n.RECORDING)throw new Error("录音进行中，无法导出WAV文件。请先停止录音。");const e=this.exportPCM(),i=this.createWavFile(e);return new Blob([i],{type:"audio/wav"})}createWavFile(e){const i=e.length*(this.config.sampleBits/8),o=new ArrayBuffer(44+i),t=new DataView(o);this.writeString(t,0,"RIFF"),t.setUint32(4,36+i,!0),this.writeString(t,8,"WAVE"),this.writeString(t,12,"fmt "),t.setUint32(16,16,!0),t.setUint16(20,1,!0),t.setUint16(22,this.config.channels,!0),t.setUint32(24,this.config.sampleRate,!0),t.setUint32(28,this.config.sampleRate*this.config.channels*(this.config.sampleBits/8),!0),t.setUint16(32,this.config.channels*(this.config.sampleBits/8),!0),t.setUint16(34,this.config.sampleBits,!0),this.writeString(t,36,"data"),t.setUint32(40,i,!0);const s=44;if(this.config.sampleBits===8){const a=e;for(let l=0;l<a.length;l++)t.setUint8(s+l,a[l])}else{const a=e;for(let l=0;l<a.length;l++)t.setInt16(s+l*2,a[l],!0)}return o}writeString(e,i,o){for(let t=0;t<o.length;t++)e.setUint8(i+t,o.charCodeAt(t))}}c.Recorder=d,Object.defineProperty(c,Symbol.toStringTag,{value:"Module"})});
