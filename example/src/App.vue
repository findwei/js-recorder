<script setup lang="ts">
import { reactive, watch, watchEffect } from "vue";

// import { Recorder } from "./lib/Recorder";
// import { RecorderConfig, RecorderStatus } from "./lib/types/Recorder";

import { Recorder } from "js-recorder-rtc";
import type { RecorderConfig } from "js-recorder-rtc";


const form = reactive<RecorderConfig>({
  sampleRate: 16000,
  sampleBits: 8,
  channels: 1,
});

const reset = () => {
  form.channels = 1;
  form.sampleBits = 8;
  form.sampleRate = 16000;
};
// 初始化录音配置
// const config: RecorderConfig = {
//   sampleRate: 16000, // 采样率
//   sampleBits: 8, // 采样位数
//   channels: 1, // 声道数
//   bufferSize: 4096, // 缓冲区大小
// };
// 创建 Recorder 实例
// const recorder = new Recorder(config);
let recorder = new Recorder({
  ...form,
  bufferSize: 4096,
});
// window.recorder = recorder;
watchEffect(() => {
  recorder = new Recorder({
    ...form,
    bufferSize: 4096,
  });
});

// 初始化录音器并设置实时 PCM 数据回调
const startButton = async () => {
  try {
    await recorder.init();
    recorder.setPCMDataCallback(handlePCMData); // 设置回调
    recorder.start();
    console.log("录音开始");
  } catch (error) {
    console.error("初始化录音器失败:", error);
  }
};
// 其他按钮事件处理保持不变
const pauseButton = () => {
  recorder.pause();
  console.log("录音已暂停");
};

const resumeButton = () => {
  recorder.resume();
  console.log("录音已恢复");
};

const stopButton = () => {
  recorder.stop();
  console.log("录音已停止");
};

// 实时处理 PCM 数据的回调函数
function handlePCMData(pcmData: Float32Array) {
  // 在此处处理实时 PCM 数据，例如：
  console.log("实时 PCM 数据:", pcmData);
  // 示例：将 PCM 数据转换为 Base64 字符串并显示
  // const base64Data = arrayBufferToBase64(pcmData.buffer);
  // displayPCMData(base64Data);
}

const downloadPCMButton = () => {
  try {
    const pcmData = recorder.exportPCM();
    const blob = new Blob([pcmData], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recording${form.sampleRate}-${form.sampleBits}-${
      form.channels
    }-${Date.now()}.pcm`;
    a.click();
    URL.revokeObjectURL(url);
    console.log("PCM 数据已下载");
  } catch (error) {
    console.error("导出 PCM 数据失败:", error);
  }
};

const downloadWAVButton = () => {
  try {
    const wavBlob = recorder.exportWAV();
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recording${form.sampleRate}-${form.sampleBits}-${
      form.channels
    }-${Date.now()}.wav`;
    a.click();
    URL.revokeObjectURL(url);
    console.log("WAV 文件已下载");
  } catch (error) {
    console.error("导出 WAV 文件失败:", error);
  }
};
</script>

<template>
  <div class="app">
    <h1>录音</h1>
    <el-form :model="form" :inline="true" label-width="auto">
      <el-form-item label="采样率">
        <el-select v-model="form.sampleRate" style="min-width: 200px">
          <el-option label="8000" :value="8000" />
          <el-option label="16000" :value="16000" />
          <el-option label="22050" :value="22050" />
          <el-option label="24000" :value="24000" />
          <el-option label="44100" :value="44100" />
          <el-option label="48000" :value="48000" />
        </el-select>
      </el-form-item>
      <el-form-item label="彩样位数">
        <el-radio-group v-model="form.sampleBits">
          <el-radio :value="8">8</el-radio>
          <el-radio :value="16">16</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="声道数">
        <el-radio-group v-model="form.channels">
          <el-radio :value="1">1</el-radio>
          <el-radio :value="2">2</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <div class="mb-4">
      <el-button type="primary" @click="reset">重置配置</el-button>
      <el-button type="success" @click="startButton">开启录音</el-button>
      <el-button type="danger" @click="stopButton">停止录音</el-button>
      <el-button type="primary" @click="pauseButton">暂停录音</el-button>
      <el-button type="primary" @click="resumeButton">恢复录音</el-button>
    </div>
    <el-divider />
    <!-- 
    <div class="">
      <div>录音时长：</div>
      <div>录音大小：</div>
      <div>当前音量百分比：</div>
    </div>
    <el-divider />
  -->

    <h1>下载</h1>
    <div>
      <el-button type="success" @click="downloadPCMButton">下载PCM</el-button>
      <el-button type="success" @click="downloadWAVButton">下载WAV</el-button>
    </div>
  </div>
</template>

<style scoped></style>
