<template>
  <div class="hello">

<gmap-map
    :center="center"
    :zoom="zoom"
    ref="mmm"
    style="width: 80%; height: 500px"
  >

  <gmap-polyline :path="path">
  </gmap-polyline>

  <gmap-info-window :options="infoWindow.options" :position="infoWindow.position" :opened="infoWindow.open" @closeclick="infoWindow.open=false">
    <div v-html="infoWindow.content"></div>
  </gmap-info-window>
  
  <gmap-marker
      :key="index"
      v-for="(m, index) in visibleMarkers"
      :position="m.position"
      :clickable="true"
      :draggable="true"
      @click="toggleInfoWindow(m, index)"
    ></gmap-marker>
  
  </gmap-map>
    
    <h1>Images on a map</h1>
    
    <input type="file" multiple @change="onFileChange">
    <p>
      {{ fileCount }}
    </p>

    <button class="btn btn-large" @click="play" value="woop">Try to play</button> 
  </div>
</template>

<script>
import * as ExifReader from 'exifreader'
import date from 'date-and-time'
import onedriveauth from 'onedrive-auth'


export default {
  name: 'HelloWorld',
  data () {
    return {
      markers: [],
      center: { lat: -19.8934596, lng: -44.0586543 },
      zoom: 5,
      fileCount: 0,
      path: [],
      infoWindow: {
        content: '',
        open: false,
        currentMidx: null,
        options: {
          pixelOffset: {
            width: 0,
            height: -35
          }
        },
        position: {
          lat: 0,
          lng: 0
        }
      }
    }
  },
  created () {
    this.$getLocation()
      .then(coordinates => {
        this.center = coordinates;
      });
  },
  computed: {
    visibleMarkers() {
      return this.markers.filter((m) => m.visible);
    }
  },
  methods: {
    play() {

      this.markers.forEach(m => m.visible = false);
      this.path.splice(0, this.path.length);

      let draw = function(index) {
        if(index > this.markers.length)
          return;

        let currentMarker = this.markers[index];
         this.$refs.mmm.panTo(currentMarker.position);
        // this.center = currentMarker.position;
        
        currentMarker.visible = true;
        this.path.push(currentMarker.position);
        
        setTimeout(() => {
          draw(index+1);
        }, 5000)
      }.bind(this);

      draw(0);

      // reset everything
      // step by step show marker and image
      // draw line to next marker?

    },
    arrayBufferToBase64(buffer) {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return window.btoa(binary);
    },
    onFileChange(e) {
      var self = this;
      var files = e.target.files || e.dataTransfer.files;
      if (!files.length)
        return;

      var promises = [];

      var paths = [];

      for(let i = 0; i < files.length; i++) {

        let currentFile = files[i];
        promises.push(new Promise((resolve, reject) => {
          let reader = new FileReader();
          reader.onload = function(e) {
            // base64reader.readAsDataURL(currentFile);
            // Hardcoded the prefix for JPEG for now, good to so we can skip multiple filereaders
            const base64 = "data:image/jpeg;base64," + self.arrayBufferToBase64(e.target.result);

            const tags = ExifReader.load(e.target.result);
            // console.log("tags", tags);

            const image = {
              index: i,
              orientation: tags.Orientation,
              base64: base64,
              parsed: false
            }

            if(tags.DateTime && tags.GPSLatitude) {
              image.date = date.parse(tags.DateTime.description, "YYYY:MM:DD HH:mm:ss");
              image.position = { lat: tags.GPSLatitude.description, lng: tags.GPSLongitude.description };
              image.parsed = true;
            }

            resolve(image);
          };

          reader.readAsArrayBuffer(currentFile);
        }));
      }

      Promise.all(promises).then(images => {

        let sortImages = images.filter(i => i.parsed).sort((a, b) => a > b);
        this.path = sortImages.map(i => i.position);
        console.log(this.path);
        
        sortImages.forEach((image) => {
          this.markers.push({
            visible: true,
            position: image.position,
            infoText: '<div><img style="width:100px;height:100px" src=' + image.base64 + ' />Image #' + image.index + ' <b>' + image.date + '</b></div>'
          });
        });
        
      });
    },
    toggleInfoWindow: function(marker, idx) {

      this.infoWindow.position = marker.position;
      this.infoWindow.content = marker.infoText;

      //check if its the same marker that was selected if yes toggle
      if (this.infoWindow.currentMidx == idx) {
        this.infoWindow.open = !this.infoWindow.open;
      } else {       //if different marker set infowindow to open and reset current marker index
        this.infoWindow.open = true;
        this.infoWindow.currentMidx = idx;

      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.marker-image {
  width: 100px;
  height: 100px;
}

h1, h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
