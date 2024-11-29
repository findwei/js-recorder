/*
 * @Author: webberQian
 * @Date: 2024-11-12 10:55:53
 * @LastEditTime: 2024-11-29 16:49:06
 * @LastEditors: webberQian
 * @Description: recorder 类型定义
 * @FilePath: \v2-testd:\wei.qian\projectCode\recorder\src\types\Recorder.ts
 * 没有理想，何必远方。
 */

/**
 * 录音配置接口
 * 定义录音器所需的所有可配置参数
 */
export interface RecorderConfig {
  sampleRate?: number; // 采样率 (Hz)，常用值：8000, 16000, 22050, 24000, 44100, 48000
  sampleBits?: 8 | 16; // 采样位数，8位或16位
  channels?: 1 | 2; // 声道数，单声道(1)或双声道(2)
  bufferSize?: number; // 缓冲区大小，必须是2的幂次方，如：2048, 4096, 8192
}

/**
 * 录音状态枚举
 * 用于跟踪录音器当前的工作状态
 */
export enum RecorderStatus {
  INACTIVE = "inactive", // 未激活/已停止
  RECORDING = "recording", // 录音中
  PAUSED = "paused", // 已暂停
}
