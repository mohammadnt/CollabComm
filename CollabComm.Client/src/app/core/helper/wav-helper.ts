export abstract class WavHelper {
  public static audioBufferToWav(buffer: any, opt: any) {
    opt = opt || {}

    var numChannels = buffer.numberOfChannels
    var sampleRate = buffer.sampleRate
    var format = opt.float32 ? 3 : 1
    var bitDepth = format === 3 ? 32 : 16

    var result
    if (numChannels === 2) {
      result = this.interleave(buffer.getChannelData(0), buffer.getChannelData(1))
    } else {
      result = buffer.getChannelData(0)
    }

    return this.encodeWAV(result, format, sampleRate, numChannels, bitDepth)
  }

  static encodeWAV(samples: any, format: any, sampleRate: any, numChannels: any, bitDepth: any) {
    var bytesPerSample = bitDepth / 8
    var blockAlign = numChannels * bytesPerSample

    var buffer = new ArrayBuffer(44 + samples.length * bytesPerSample)
    var view = new DataView(buffer)

    /* RIFF identifier */
    this.writeString(view, 0, 'RIFF')
    /* RIFF chunk length */
    view.setUint32(4, 36 + samples.length * bytesPerSample, true)
    /* RIFF type */
    this.writeString(view, 8, 'WAVE')
    /* format chunk identifier */
    this.writeString(view, 12, 'fmt ')
    /* format chunk length */
    view.setUint32(16, 16, true)
    /* sample format (raw) */
    view.setUint16(20, format, true)
    /* channel count */
    view.setUint16(22, numChannels, true)
    /* sample rate */
    view.setUint32(24, sampleRate, true)
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * blockAlign, true)
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, blockAlign, true)
    /* bits per sample */
    view.setUint16(34, bitDepth, true)
    /* data chunk identifier */
    this.writeString(view, 36, 'data')
    /* data chunk length */
    view.setUint32(40, samples.length * bytesPerSample, true)
    if (format === 1) { // Raw PCM
      this.floatTo16BitPCM(view, 44, samples)
    } else {
      this.writeFloat32(view, 44, samples)
    }

    return buffer
  }

  static interleave(inputL: any, inputR: any) {
    var length = inputL.length + inputR.length
    var result = new Float32Array(length)

    var index = 0
    var inputIndex = 0

    while (index < length) {
      result[index++] = inputL[inputIndex]
      result[index++] = inputR[inputIndex]
      inputIndex++
    }
    return result
  }

  static writeFloat32(output: any, offset: any, input: any) {
    for (var i = 0; i < input.length; i++, offset += 4) {
      output.setFloat32(offset, input[i], true)
    }
  }

  static floatTo16BitPCM(output: any, offset: any, input: any) {
    for (var i = 0; i < input.length; i++, offset += 2) {
      var s = Math.max(-1, Math.min(1, input[i]))
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
    }
  }

  static writeString(view: any, offset: any, string: any) {
    for (var i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }
}
