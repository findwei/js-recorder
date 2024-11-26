/*
 * @Author: webberQian
 * @Date: 2024-11-11 17:56:05
 * @LastEditTime: 2024-11-13 17:00:55
 * @LastEditors: webberQian
 * @Description:
 * @FilePath: \v2-testd:\wei.qian\projectCode\recorder\src\lib\record.js
 * 没有理想，何必远方。
 */

/* eslint-disable */

minSecStr = function (n) {
    return (n < 10 ? "0" : "") + n;
};

updateDateTime = function () {
    var sec;
    sec = recordingTime() | 0;
    $("#time-display").html("" + (minSecStr(sec / 60 | 0)) + ":" + (minSecStr(sec % 60)));
};

window.setInterval(updateDateTime, 200);

isRecording = function () {
    return recorder != null && recorder.audioSize() > 0
}
var startTime;
recordingTime = function () {
    return isRecording() ? (Date.now() - this.startTime) * .001 : null
}

var port = location.port;
var websocket = new WebSocket("ws://" + location.hostname + ":" + location.port + "/runtime/v3/recognize?productId=914005898");
ws_init(websocket);
var ws_connected = false;

function ws_init(ws) {
    ws.onopen = function (evt) {
        onOpen(evt)
    };
    ws.onclose = function (evt) {
        onClose(evt)
    };
    ws.onmessage = function (evt) {
        onMessage(evt)
    };
    ws.onerror = function (evt) {
        onError(evt)
    };
}

function onOpen(evt) {
    ws_connected = true;
    console.log("CONNECTED");
    //doSend("WebSocket rocks");
};

function onClose(evt) {
    console.log("DISCONNECTED");
    if (!ws_connected) {
        websocket = new WebSocket("ws://" + location.hostname + ":" + location.port + "/runtime/v3/recognize?productId=914005898");
        ws_init(websocket);
    }

};

function onMessage(evt) {
    document.getElementById('asr_out').innerText += evt.data;
    console.log('RESPONSE: ' + evt.data + '');
    //websocket.close();
};

function onError(evt) {
    console.log('ERROR:' + evt.data);
    close_ping_pong = false;
    websocket = new WebSocket("ws://" + location.hostname + ":" + location.port + "/runtime/v3/recognize?productId=914005898");
    ws_init(websocket);
};

function pre(el) {
    el.attr("color", "black");
    el.style.color = "black";
}
var recorder;
var audio = document.querySelector('audio');

function tts() {
    var callback = function (state, e) {
        switch (state) {
            case 'uploading':
                //var percentComplete = Math.round(e.loaded * 100 / e.total) + '%';
                break;
            case 'ok':
                alert("合成成功");
                break;
            case 'error':
                alert("合成失败");
                break;
            case 'cancel':
                alert("上传被取消");
                break;
        }
    }
    var ttstext = document.getElementById("ttsText").value;
    var voiceId = document.getElementById("voiceId").value;
    if (voiceId == undefined || voiceId == '') {
        alert("音色不能为空");
        return;
    }
    if (ttstext == undefined || ttstext == '') {
        alert("文本不能为空");
        return;
    }
    var json = {};
    json.ttsText = ttstext;
    json.voiceId = voiceId;
    var xhr = new XMLHttpRequest();
    if (callback) {
        xhr.upload.addEventListener("progress",
            function (e) {
                callback('uploading', e);
            },
            false);
        xhr.addEventListener("load",
            function (e) {
                callback('ok', e);
            },
            false);
        xhr.addEventListener("error",
            function (e) {
                callback('error', e);
            },
            false);
        xhr.addEventListener("abort",
            function (e) {
                callback('cancel', e);
            },
            false);
    }
    xhr.open("POST", "/ba-outer/admin/tts");
    xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    xhr.responseType = 'blob';
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var name = xhr.getResponseHeader("ajax-filename");
            var mimeType = xhr.getResponseHeader("ajax-mimeType");
            var blob = new Blob([xhr.response], {
                type: mimeType
            });

            var url = URL.createObjectURL(blob);
            var div = document.createElement('div');
            var au = document.createElement('audio');
            var hf = document.createElement('a');
            au.controls = true;
            au.src = url;
            hf.href = url;
            hf.download = new Date().toISOString() + '.wav';
            hf.innerHTML = hf.download;
            div.appendChild(au);
            div.appendChild(hf);
            document.getElementById("ttsAudio").src = url;
        }
    }
    xhr.send(JSON.stringify(json));
}

function startRecording() {
    ws_jsonGather();
    startTime = Date.now();
    HZRecorder.get(function (rec) {
        recorder = rec;
        recorder.start();
    }, {
        sampleBits: 16,
        sampleRate: 16000
    });
}

function stopRecording() {
    startTime = undefined;
    recorder.stop();
    var blob = recorder.getBlob();
    var url = URL.createObjectURL(blob);
    /*  var div = document.createElement('div');
            var au = document.createElement('audio');
            var hf = document.createElement('a');
            au.controls = true;
            au.src = url;
            hf.href = url;
            hf.download = new Date().toISOString() + '.wav';
            hf.innerHTML = hf.download;
            div.appendChild(au);
            div.appendChild(hf);
            recordingslist.appendChild(div);*/
    document.getElementById("asrAudio").src = url;

}

function ws_jsonGather() {
    var res = document.getElementById("res").value;
    if (res == undefined || res == '') {
        alert("识别资源不能为空");
        return;
    }
    var dialog = {};
    var audio = {
        "audioType": "wav",
        "sampleRate": 16000
    };
    var asrParam = {};
    asrParam.res = res;
    asrParam.enableRealTimeFeedback = true;
    dialog.productId = document.getElementById("pid").value;
    var lmId = document.getElementById("lmId").value;
    if (lmId != undefined && lmId != '') {
        asrParam.lmId = document.getElementById("lmId").value;
    }
    var obj = document.getElementsByName("punctuation");
    for (var i = 0; i < obj.length; i++) {
        if (obj[i].checked) {
            asrParam.enablePunctuation = JSON.parse(obj[i].value);
        }
    }
    var requestParam = {
        "asr": asrParam,
        "audio": audio,
        "dialog": dialog
    }
    websocket.send(JSON.stringify(requestParam));

}

function playRecording() {
    recorder.play(audio);
}

function uploadAudio() {
    recorder.upload("/ba-outer/admin/asr",
        function (state, e) {
            switch (state) {
                case 'uploading':
                    //var percentComplete = Math.round(e.loaded * 100 / e.total) + '%';
                    break;
                case 'ok':
                    //alert(e.target.responseText);
                    var result = JSON.stringify(JSON.parse(e.target.responseText), null, 2); //将字符串转换成json对象
                    document.getElementById('asr_out').innerText = result;
                    //  alert("识别成功");
                    break;
                case 'error':
                    alert("识别失败");
                    break;
                case 'cancel':
                    alert("上传被取消");
                    break;
            }
        });
}
(function (window) {
    //兼容
    window.URL = window.URL || window.webkitURL;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    var HZRecorder = function (stream, config) {
        config = config || {};
        config.sampleBits = config.sampleBits || 8 //采样数位 8, 16
        config.sampleRate = config.sampleRate || (44100 / 6); //采样率(1/6 44100)
        var context = new (window.webkitAudioContext || window.AudioContext)();
        var audioInput = context.createMediaStreamSource(stream);
        var createScript = context.createScriptProcessor || context.createJavaScriptNode;
        var recorder = createScript.apply(context, [4096, 1, 1]);
        var mp3ReceiveSuccess, currentErrorCallback;

        var audioData = {
            size: 0 //录音文件长度
            ,
            ws_size: 0 //录音文件长度websocket
            ,
            buffer: [] //录音缓存
            ,
            buffer_ws: [] //录音缓存websocket
            ,
            inputSampleRate: context.sampleRate //输入采样率
            ,
            inputSampleBits: 16 //输入采样数位 8, 16
            ,
            outputSampleRate: config.sampleRate //输出采样率
            ,
            oututSampleBits: config.sampleBits //输出采样数位 8, 16
            ,
            input: function (data) {
                console.log(this.buffer.length);
                this.buffer.push(new Float32Array(data));
                this.buffer_ws = [];
                this.buffer_ws.push(new Float32Array(data));
                this.size += data.length;
                this.ws_size = data.length;
            },
            audio_size: function () {
                return this.size;
            },
            compress: function () { //合并压缩
                //合并
                var data = new Float32Array(this.size);
                var offset = 0;
                for (var i = 0; i < this.buffer.length; i++) {
                    data.set(this.buffer[i], offset);
                    offset += this.buffer[i].length;
                }
                //压缩
                var compression = parseInt(this.inputSampleRate / this.outputSampleRate);
                var length = data.length / compression;
                var result = new Float32Array(length);
                var index = 0,
                    j = 0;
                while (index < length) {
                    result[index] = data[j];
                    j += compression;
                    index++;
                }
                return result;
            },
            compress_ws: function () { //合并压缩
                //合并
                var data = new Float32Array(this.ws_size);
                var offset = 0;
                for (var i = 0; i < this.buffer_ws.length; i++) {
                    data.set(this.buffer_ws[i], offset);
                    offset += this.buffer_ws[i].length;
                }
                //压缩
                var compression = parseInt(this.inputSampleRate / this.outputSampleRate);
                var length = data.length / compression;
                var result = new Float32Array(length);
                var index = 0,
                    j = 0;
                while (index < length) {
                    result[index] = data[j];
                    j += compression;
                    index++;
                }
                return result;
            },
            encodeWAV: function () {
                var sampleRate = Math.min(this.inputSampleRate, this.outputSampleRate);
                var sampleBits = Math.min(this.inputSampleBits, this.oututSampleBits);
                var bytes = this.compress();
                var dataLength = bytes.length * (sampleBits / 8);
                var buffer = new ArrayBuffer(44 + dataLength);
                var data = new DataView(buffer);
                var channelCount = 1; //单声道
                var offset = 0;
                var writeString = function (str) {
                    for (var i = 0; i < str.length; i++) {
                        data.setUint8(offset + i, str.charCodeAt(i));
                    }
                }
                // 资源交换文件标识符
                writeString('RIFF');
                offset += 4;
                // 下个地址开始到文件尾总字节数,即文件大小-8
                data.setUint32(offset, 36 + dataLength, true);
                offset += 4;
                // WAV文件标志
                writeString('WAVE');
                offset += 4;
                // 波形格式标志
                writeString('fmt ');
                offset += 4;
                // 过滤字节,一般为 0x10 = 16
                data.setUint32(offset, 16, true);
                offset += 4;
                // 格式类别 (PCM形式采样数据)
                data.setUint16(offset, 1, true);
                offset += 2;
                // 通道数
                data.setUint16(offset, channelCount, true);
                offset += 2;
                // 采样率,每秒样本数,表示每个通道的播放速度
                data.setUint32(offset, sampleRate, true);
                offset += 4;
                // 波形数据传输率 (每秒平均字节数) 单声道×每秒数据位数×每样本数据位/8
                data.setUint32(offset, channelCount * sampleRate * (sampleBits / 8), true);
                offset += 4;
                // 快数据调整数 采样一次占用字节数 单声道×每样本的数据位数/8
                data.setUint16(offset, channelCount * (sampleBits / 8), true);
                offset += 2;
                // 每样本数据位数
                data.setUint16(offset, sampleBits, true);
                offset += 2;
                // 数据标识符
                writeString('data');
                offset += 4;
                // 采样数据总数,即数据总大小-44
                data.setUint32(offset, dataLength, true);
                offset += 4;
                // 写入采样数据
                if (sampleBits === 8) {
                    for (var i = 0; i < bytes.length; i++, offset++) {
                        var s = Math.max(-1, Math.min(1, bytes[i]));
                        var val = s < 0 ? s * 0x8000 : s * 0x7FFF;
                        val = parseInt(255 / (65535 / (val + 32768)));
                        data.setInt8(offset, val, true);
                    }
                } else {
                    for (var i = 0; i < bytes.length; i++, offset += 2) {
                        var s = Math.max(-1, Math.min(1, bytes[i]));
                        data.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                    }
                }
                return new Blob([data], {
                    type: 'audio/wav'
                });
            },
            encodePCM: function () {
                //void 0 === i && (i = !0);
                var bytes = this.compress_ws();
                var n = 0,
                    r = bytes.length * (this.oututSampleBits / 8),
                    o = new ArrayBuffer(r),
                    s = new DataView(o);
                if (8 === this.oututSampleBits)
                    for (var a = 0; a < bytes.length; a++, n++) {
                        var u = (h = Math.max(-1, Math.min(1, bytes[a]))) < 0 ? 128 * h : 127 * h;
                        u = +u + 128, s.setInt8(n, u)
                    }

                else
                    for (a = 0; a < bytes.length; a++, n += 2) {
                        var h = Math.max(-1, Math.min(1, bytes[a]));
                        s.setInt16(n, h < 0 ? 32768 * h : 32767 * h, true)
                    }
                return s
            },
            encodeWAV_ws: function () {
                var sampleRate = Math.min(this.inputSampleRate, this.outputSampleRate);
                var sampleBits = Math.min(this.inputSampleBits, this.oututSampleBits);
                var bytes = this.compress_ws();
                var dataLength = bytes.length * (sampleBits / 8);
                var buffer = new ArrayBuffer(44 + dataLength);
                var data = new DataView(buffer);
                var channelCount = 1; //单声道
                var offset = 0;
                var writeString = function (str) {
                    for (var i = 0; i < str.length; i++) {
                        data.setUint8(offset + i, str.charCodeAt(i));
                    }
                }
                // 资源交换文件标识符
                writeString('RIFF');
                offset += 4;
                // 下个地址开始到文件尾总字节数,即文件大小-8
                data.setUint32(offset, 36 + dataLength, true);
                offset += 4;
                // WAV文件标志
                writeString('WAVE');
                offset += 4;
                // 波形格式标志
                writeString('fmt ');
                offset += 4;
                // 过滤字节,一般为 0x10 = 16
                data.setUint32(offset, 16, true);
                offset += 4;
                // 格式类别 (PCM形式采样数据)
                data.setUint16(offset, 1, true);
                offset += 2;
                // 通道数
                data.setUint16(offset, channelCount, true);
                offset += 2;
                // 采样率,每秒样本数,表示每个通道的播放速度
                data.setUint32(offset, sampleRate, true);
                offset += 4;
                // 波形数据传输率 (每秒平均字节数) 单声道×每秒数据位数×每样本数据位/8
                data.setUint32(offset, channelCount * sampleRate * (sampleBits / 8), true);
                offset += 4;
                // 快数据调整数 采样一次占用字节数 单声道×每样本的数据位数/8
                data.setUint16(offset, channelCount * (sampleBits / 8), true);
                offset += 2;
                // 每样本数据位数
                data.setUint16(offset, sampleBits, true);
                offset += 2;
                // 数据标识符
                writeString('data');
                offset += 4;
                // 采样数据总数,即数据总大小-44
                data.setUint32(offset, dataLength, true);
                offset += 4;
                // 写入采样数据
                if (sampleBits === 8) {
                    for (var i = 0; i < bytes.length; i++, offset++) {
                        var s = Math.max(-1, Math.min(1, bytes[i]));
                        var val = s < 0 ? s * 0x8000 : s * 0x7FFF;
                        val = parseInt(255 / (65535 / (val + 32768)));
                        data.setInt8(offset, val, true);
                    }
                } else {
                    for (var i = 0; i < bytes.length; i++, offset += 2) {
                        var s = Math.max(-1, Math.min(1, bytes[i]));
                        data.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                    }
                }
                return new Blob([data], {
                    type: 'audio/wav'
                });
            }
        };
        //开始录音
        this.start = function () {
            audioInput.connect(recorder);
            recorder.connect(context.destination);
        }
        //停止
        this.stop = function () {
            websocket.send(new Float32Array(0));
            recorder.disconnect();
        }
        //获取音频文件
        this.getBlob = function () {
            this.stop();
            return audioData.encodeWAV();
        }

        //获取音频input
        this.audioSize = function () {
            return audioData.audio_size();
        }
        //回放
        this.play = function (audio) {
            audio.src = window.URL.createObjectURL(this.getBlob());
        }
        //上传
        this.upload = function (url, callback) {
            var fd = new FormData();
            fd.append("file", this.getBlob());
            var res = document.getElementById("res").value;
            if (res == undefined || res == '') {
                alert("识别资源不能为空");
                return;
            }
            var asrParam = {};
            asrParam.res = res;
            asrParam.productId = document.getElementById("pid").value;
            var lmId = document.getElementById("lmId").value;
            if (lmId != undefined && lmId != '') {
                asrParam.lmId = document.getElementById("lmId").value;
            }
            var obj = document.getElementsByName("punctuation");
            for (var i = 0; i < obj.length; i++) {
                if (obj[i].checked) {
                    asrParam.punctuation = obj[i].value;
                }
            }
            fd.append("param", JSON.stringify(asrParam));
            var xhr = new XMLHttpRequest();
            if (callback) {
                xhr.upload.addEventListener("progress",
                    function (e) {
                        callback('uploading', e);
                    },
                    false);
                xhr.addEventListener("load",
                    function (e) {
                        callback('ok', e);
                    },
                    false);
                xhr.addEventListener("error",
                    function (e) {
                        callback('error', e);
                    },
                    false);
                xhr.addEventListener("abort",
                    function (e) {
                        callback('cancel', e);
                    },
                    false);
            }
            xhr.open("POST", url);
            xhr.send(fd);
        }
        //音频采集
        recorder.onaudioprocess = function (e) {
            //console.log(e.inputBuffer.getChannelData(0).length);
            audioData.input(e.inputBuffer.getChannelData(0));
            websocket.send(audioData.encodePCM());
            //console.log(e.inputBuffer.getChannelData(0).length);
            //record(e.inputBuffer.getChannelData(0));
        }
    };
    //抛出异常
    HZRecorder.throwError = function (message) {
        alert(message);
        throw new

            function () {
                this.toString = function () {
                    return message;
                }
            }
    }
    //是否支持录音
    HZRecorder.canRecording = (navigator.getUserMedia != null);
    //获取录音机
    HZRecorder.get = function (callback, config) {
        if (callback) {
            if (navigator.getUserMedia) {
                navigator.getUserMedia({
                    audio: true
                } //只启用音频
                    ,
                    function (stream) {
                        var rec = new HZRecorder(stream, config);
                        callback(rec);
                    },
                    function (error) {
                        switch (error.code || error.name) {
                            case 'PERMISSION_DENIED':
                            case 'PermissionDeniedError':
                                HZRecorder.throwError('用户拒绝提供信息。');
                                break;
                            case 'NOT_SUPPORTED_ERROR':
                            case 'NotSupportedError':
                                HZRecorder.throwError('浏览器不支持硬件设备。');
                                break;
                            case 'MANDATORY_UNSATISFIED_ERROR':
                            case 'MandatoryUnsatisfiedError':
                                HZRecorder.throwError('无法发现指定的硬件设备。');
                                break;
                            default:
                                HZRecorder.throwError('无法打开麦克风。异常信息:' + (error.code || error.name));
                                break;
                        }
                    });
            } else {
                HZRecorder.throwErr('当前浏览器不支持录音功能。');
                return;
            }
        }
    }
    window.HZRecorder = HZRecorder;
})(window);