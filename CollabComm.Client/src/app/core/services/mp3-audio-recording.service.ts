import {Injectable} from '@angular/core';
import {RecordRTCPromisesHandler} from "recordrtc";
import * as RecordRTC from "recordrtc";

declare var lamejs: any;

@Injectable({
  providedIn: 'root'
})
export class Mp3AudioRecordingServiceOgg {
  // tslint:disable-next-line:variable-name
  // _mediaRecorder: any;
  private fileReader: FileReader | undefined;
  private stream: any;
  private recorder?: RecordRTCPromisesHandler;
  private startTime: number | undefined;

  constructor() {

    // this._mediaRecorder = null;
  }


  startRecording(onStart: () => void, failed: () => void) {
    this.startTime = undefined;

    navigator.mediaDevices.getUserMedia({audio: true}).then(stream => {
      this.stream = stream;
      const options: RecordRTC.Options = {
        numberOfAudioChannels: 1,
      };

      options.sampleRate = 44100;
      this.recorder = new RecordRTCPromisesHandler(this.stream, options);
      this.recorder.startRecording()
        .then(() => {
          this.startTime = Date.now();
          onStart();
        }).catch((err) => {
        alert(err)
        failed();
      });

    }).catch((err) => {
      alert(err)
      failed()
    });

  }

  stopRecording(callback: (blob: any) => void, onFailed: (reason: number) => void) {
    // this.isRequestToEndRecord = true;

    try {
      if (this.recorder) {
        this.recorder.stopRecording().then(() => {
          const blob = this.recorder!.blob;

          const audioContext = new AudioContext();
          if (this.fileReader) {
            this.fileReader.abort();
          }
          this.fileReader = new FileReader();
          // Set up file reader on loaded end event
          this.fileReader.onloadend = (event) => {
            const arrayBuffer = event.target!.result as ArrayBuffer;

            // Convert array buffer into audio buffer
            audioContext.decodeAudioData(arrayBuffer).then(async audioBuffer => {
              // Do something with audioBuffer
              var MP3Blob = this.audioBufferToMp3(audioBuffer);


              await audioContext.close();
              this.fileReader?.abort();

              this.fileReader = undefined;
              setTimeout(() => {

                callback(MP3Blob);
              });
            });
          };

          //Load blob
          this.fileReader.readAsArrayBuffer(blob!);
          this.stopMedia();
        }).catch((err) => {
          console.log(err)
          onFailed(0);
        });
      } else {
        this.stopMedia();
        onFailed(0);
      }
    } catch (e) {
      console.log(e)
      this.stopMedia();
      alert(e);
      onFailed(0);
    }
  }

  // audioBufferToWav(aBuffer: AudioBuffer) {
  //
  //   const numOfChan = aBuffer.numberOfChannels,
  //     btwLength = aBuffer.length * numOfChan * 2 + 44,
  //     btwArrBuff = new ArrayBuffer(btwLength),
  //     btwView = new DataView(btwArrBuff),
  //     btwChnls = [];
  //
  //   let btwPos = 0;
  //   let btwOffset = 0;
  //
  //   function setUint16(data: number) {
  //     btwView.setUint16(btwPos, data, true);
  //     btwPos += 2;
  //   }
  //
  //   function setUint32(data: number) {
  //     btwView.setUint32(btwPos, data, true);
  //     btwPos += 4;
  //   }
  //
  //   setUint32(0x46464952); // "RIFF"
  //   setUint32(btwLength - 8); // file length - 8
  //   setUint32(0x45564157); // "WAVE"
  //   setUint32(0x20746d66); // "fmt " chunk
  //   setUint32(16); // length = 16
  //   setUint16(1); // PCM (uncompressed)
  //   setUint16(numOfChan);
  //   setUint32(aBuffer.sampleRate);
  //   setUint32(aBuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  //   setUint16(numOfChan * 2); // block-align
  //   setUint16(16); // 16-bit
  //   setUint32(0x61746164); // "data" - chunk
  //   setUint32(btwLength - btwPos - 4); // chunk length
  //
  //   for (let btwIndex = 0; btwIndex < aBuffer.numberOfChannels; btwIndex++)
  //     btwChnls.push(aBuffer.getChannelData(btwIndex));
  //
  //   while (btwPos < btwLength) {
  //     for (let btwIndex = 0; btwIndex < numOfChan; btwIndex++) {
  //       // interleave btwChnls
  //       let btwSample = Math.max(-1, Math.min(1, btwChnls[btwIndex][btwOffset])); // clamp
  //       btwSample =
  //         (0.5 + btwSample < 0 ? btwSample * 32768 : btwSample * 32767) | 0; // scale to 16-bit signed int
  //       btwView.setInt16(btwPos, btwSample, true); // write 16-bit sample
  //       btwPos += 2;
  //     }
  //     btwOffset++; // next source sample
  //   }
  //
  //   let wavHdr = lamejs.WavHeader.readHeader(new DataView(btwArrBuff));
  //
  //   //Stereo
  //   const data = new Int16Array(btwArrBuff, wavHdr.dataOffset, wavHdr.dataLen / 2);
  //   const leftData = [];
  //   const rightData = [];
  //   for (let i = 0; i < data.length; i += 1) {
  //     leftData.push(data[i]);
  //     // rightData.push(data[i + 1]);
  //   }
  //   const left = new Int16Array(leftData);
  //   // const right = new Int16Array(rightData);
  //   return this.wavToMp3(wavHdr.channels, wavHdr.sampleRate, left, null);
  //   return undefined;
  //
  // }

  audioBufferToMp3(buffer: AudioBuffer) {
    const toWav = require('audiobuffer-to-wav');
    var wav = toWav(buffer)
    let wavHdr = lamejs.WavHeader.readHeader(new DataView(wav));

    //Stereo
    const data = new Int16Array(wav, wavHdr.dataOffset, wavHdr.dataLen / 2);
    const leftData = [];
    const rightData = [];
    for (let i = 0; i < data.length; i += 1) {
      leftData.push(data[i]);
      // rightData.push(data[i + 1]);
    }
    const left = new Int16Array(leftData);
    // const right = new Int16Array(rightData);
    return this.wavToMp3(wavHdr.channels, wavHdr.sampleRate, left, null);
    return undefined;
  }

  wavToMp3(channels: number, sampleRate: number, left: Int16Array, right: Int16Array | null = null) {
    var buffer = [];
    var mp3enc = new lamejs.Mp3Encoder(channels, sampleRate, 32);
    var remaining = left.length;
    var samplesPerFrame = 1152;

    for (var i = 0; remaining >= samplesPerFrame; i += samplesPerFrame) {
      if (!right) {
        var mono = left.subarray(i, i + samplesPerFrame);
        var mp3buf = mp3enc.encodeBuffer(mono);
      } else {
        var leftChunk = left.subarray(i, i + samplesPerFrame);
        var rightChunk = right.subarray(i, i + samplesPerFrame);
        var mp3buf = mp3enc.encodeBuffer(leftChunk, rightChunk);
      }
      if (mp3buf.length > 0) {
        buffer.push(mp3buf); //new Int8Array(mp3buf));
      }
      remaining -= samplesPerFrame;
    }
    var d = mp3enc.flush();
    if (d.length > 0) {
      buffer.push(new Int8Array(d));
    }

    var mp3Blob = new Blob(buffer, {type: "audio/mp3"});
    //var bUrl = window.URL.createObjectURL(mp3Blob);

    // send the download link to the console
    //console.log('mp3 download:', bUrl);
    return mp3Blob;
  }


  private stopMedia() {
    if (this.recorder) {
      this.recorder.destroy()
      this.recorder = undefined;
      if (this.stream) {
        this.stream.getAudioTracks().forEach((track: any) => track.stop());
        this.stream = null;
      }
    }
  }


}
