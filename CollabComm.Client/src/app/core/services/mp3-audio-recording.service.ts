import {Injectable} from '@angular/core';
import {RecordRTCPromisesHandler} from "recordrtc";
import * as RecordRTC from "recordrtc";
import {WavHelper} from '../helper/wav-helper';

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

  audioBufferToMp3(buffer: AudioBuffer) {
    var wav = WavHelper.audioBufferToWav(buffer, undefined);
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
