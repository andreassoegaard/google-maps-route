<template>
  <div>
    <div ref="mapElement" style="height: 100vh; width: 100%" />
    <div
      style="
        position: fixed;
        bottom: 0;
        right: 0;
        z-index: 100;
        font-size: 30px;
        background-color: white;
        padding: 10px 20px;
      "
    >
      {{ polylineLength }} km.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { Loader } from "@googlemaps/js-api-loader";

const mapsLoader = ref<Loader>();
const mapsObject = ref<typeof google>();
const initLoader = () => {
  mapsLoader.value = new Loader({
    apiKey: import.meta.env.VITE_GMAPS_KEY,
    version: "weekly",
    libraries: ["geometry"],
  });
  mapsLoader.value.load().then((googleMap) => {
    mapsObject.value = googleMap;
    initMap();
  });
};

const mapInstance = ref();
const mapElement = ref<HTMLElement>();
// const mapMarkers = ref<google.maps.Marker[]>([]);
const poly = ref<google.maps.Polyline>();
const initMap = () => {
  if (mapsObject.value && mapElement.value) {
    const mapOptions = {
      center: {
        lat: 56.0109643,
        lng: 10.248719,
      },
      zoom: 6,
    };
    mapInstance.value = new mapsObject.value.maps.Map(
      mapElement.value,
      mapOptions
    );

    poly.value = new mapsObject.value.maps.Polyline({
      strokeColor: "#000000",
      strokeOpacity: 1.0,
      strokeWeight: 3,
    });
    poly.value.setMap(mapInstance.value);

    mapsObject.value.maps.event.addListener(
      mapInstance.value,
      "click",
      (event: google.maps.MapMouseEvent) => {
        if (mapsObject.value && poly.value) {
          event.stop();
          const path: google.maps.MVCArray = poly.value.getPath();
          path.push(event.latLng);
          const newMarker = new mapsObject.value.maps.Marker({
            position: event.latLng,
            map: mapInstance.value,
          });
          newMarker.setMap(mapInstance.value);
        }
      }
    );
  }
};

const polylineLength = computed(() => {
  let meters;
  if (mapsObject.value && poly.value) {
    meters = (
      mapsObject.value.maps.geometry.spherical.computeLength(
        poly.value.getPath()
      ) / 1000
    ).toFixed(2);
  }
  return meters;
});

onMounted(() => {
  initLoader();
});
</script>
