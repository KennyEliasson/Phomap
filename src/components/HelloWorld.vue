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
import onedriveauth from 'onedrive-auth'
import delay from 'delay'
import Image from '@/Image'

export default {
  name: 'HelloWorld',
  data () {
    return {
      markers: [],
      center: { lat: -19.8934596, lng: -44.0586543 },
      zoom: 15,
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
    fluidZoom(maxFluidZoom) {
      if(maxFluidZoom >= 15) 
        return 0;
    
      this.zoom = maxFluidZoom;
      maxFluidZoom = maxFluidZoom+2;
      setTimeout(() => this.fluidZoom(maxFluidZoom), 500);
    },
    play() {
      this.markers.forEach(m => m.visible = false);
      this.path.splice(0, this.path.length);

      let draw = (index) => {
        if(index > this.markers.length)
          return;

        let currentMarker =this.markers[index];
        currentMarker.visible = true;
        this.path.push(currentMarker.position);
        this.toggleInfoWindow(currentMarker, index);

        if(index === 0) {
          this.$refs.mmm.panTo(currentMarker.position);
          delay(5000).then(() => {
            draw(index+1);
          })
        } else {
          var prevMarker = this.markers[index-1];
          let b = new google.maps.LatLngBounds();
          b.extend(prevMarker.position);
          b.extend(currentMarker.position);
            
          this.$refs.mmm.fitBounds(b);
            
          delay(1000).then(() => {
            this.$refs.mmm.panTo(currentMarker.position);
            delay(2000).then(() => {
              var newZoom = this.$refs.mmm.$mapObject.getZoom();
              this.fluidZoom(newZoom);
              delay(5000).then(() => {
                draw(index+1);
              })
            })
          });
        }
      };

      draw(0);
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
            resolve(Image.load(e.target.result, i));
          };
          reader.readAsArrayBuffer(currentFile);
        }));
      }

      Promise.all(promises).then(images => {

        let sortImages = images.filter(i => i.parsed).sort((a, b) => a > b);
        this.path = sortImages.map(i => i.position);
        
        sortImages.forEach((image) => {
          this.markers.push({
            visible: true,
            position: image.position,
            infoText: '<div><img style="width:200px;height:200px" src=' + image.base64 + ' /><br/><b>' + image.dateString + '</b></div>'
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
