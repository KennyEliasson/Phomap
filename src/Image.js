import date from 'date-and-time'
import * as ExifReader from 'exifreader'

export default class Image {
  constructor (tags, index, base64) {
    this.index = index
    this.orientation = tags.Orientation.value
    this.base64 = base64
    this.parsed = false

    if (this.orientation > 4) {
      this.height = tags.PixelXDimension.value
      this.width = tags.PixelYDimension.value
    } else {
      this.width = tags.PixelXDimension.value
      this.height = tags.PixelYDimension.value
    }

    if (tags.DateTime && tags.GPSLatitude) {
      this.date = date.parse(tags.DateTime.description, 'YYYY:MM:DD HH:mm:ss')
      this.dateString = this.date.toISOString().substring(0, 16).replace('T', ' ')
      this.position = { lat: tags.GPSLatitude.description, lng: tags.GPSLongitude.description }
      this.parsed = true
    }
  };

  static load (result, index) {
    // Hardcoded for jpegs right now
    // We can use a FileReader.getAsDataUrl, but this skips that
    const base64 = 'data:image/jpeg;base64,' + this.arrayBufferToBase64(result)
    const tags = ExifReader.load(result)
    return new Image(tags, index, base64)
  }

  static arrayBufferToBase64 (buffer) {
    let binary = ''
    const bytes = new Uint8Array(buffer)
    const len = bytes.byteLength
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  };
}
