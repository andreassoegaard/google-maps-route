<template>
  <div class="flex flex-wrap">
    <!-- <div class="w-full lg:w-3/12"></div> -->
    <div class="w-full relative">
      <div ref="mapElement" style="height: 100vh; width: 100%" />
      <div
        class="absolute bottom-8 lg:left-1/2 left-2 transform lg:-translate-x-1/2 lg:-translate-y-1/2 text-lg lg:items-center items-start flex flex-col"
      >
        <div class="bg-white rounded-md shadow flex mb-3">
          <div
            v-if="mapStore.mapMarkers.length > 0"
            class="px-4 py-2 lg:px-5 lg:py-3 whitespace-nowrap"
          >
            <span class="font-medium">Distance: </span>{{ polylineLength }} km.
          </div>
          <div v-else class="px-4 py-2 lg:px-5 lg:py-3 whitespace-nowrap">
            <span class="font-medium"
              >Klik på kortet for at starte din rute!</span
            >
          </div>
        </div>
        <div v-if="mapStore.mapMarkers.length > 0" class="shadow flex">
          <div
            :class="[
              mapStore.mapMarkers.length === 0
                ? 'bg-gray-50 text-gray-400'
                : '',
              'px-4 py-2 lg:py-3 lg:px-5 flex items-center bg-white rounded-l-md border-r cursor-pointer whitespace-nowrap hover:bg-gray-50',
            ]"
            @click.prevent="removeLastMarker"
          >
            <BackspaceIcon class="h-5 w-5 mr-1.5" />
            Slet seneste
          </div>
          <div
            :class="[
              mapStore.mapMarkers.length === 0
                ? 'bg-gray-50 text-gray-400'
                : '',
              'px-4 py-2 lg:py-3 lg:px-5 flex items-center bg-white rounded-r-md cursor-pointer whitespace-nowrap hover:bg-gray-50',
            ]"
            @click.prevent="resetMap"
          >
            <MinusCircleIcon class="h-5 w-5 mr-1.5" />
            Nulstil
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { Loader } from "@googlemaps/js-api-loader";
import { useMapStore } from "@/stores/map";
import { BackspaceIcon, MinusCircleIcon } from "@heroicons/vue/outline";

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

const markerIcon = ref();
const mapInstance = ref();
const mapElement = ref<HTMLElement>();
const mapStore = useMapStore();
const mapMarkers: google.maps.Marker[] = [];
const poly = ref<google.maps.Polyline>();
const initMap = () => {
  if (mapsObject.value && mapElement.value) {
    markerIcon.value = {
      url: "/marker.svg",
      size: new google.maps.Size(16, 16),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(8, 8),
    };
    const mapOptions = {
      center: mapStore.mapCenter,
      zoom: mapStore.mapZoom,
      mapId: "877d5fbdb764662e",
    };
    mapInstance.value = new mapsObject.value.maps.Map(
      mapElement.value,
      mapOptions
    );
    poly.value = new mapsObject.value.maps.Polyline({
      strokeColor: "#000000",
      strokeOpacity: 1.0,
      strokeWeight: 2,
    });
    poly.value.setMap(mapInstance.value);

    if (mapStore.mapMarkers.length > 0) {
      mapStore.mapMarkers.forEach((marker) => {
        if (poly.value && mapsObject.value) {
          const latLng = new google.maps.LatLng(marker.lat, marker.lng);
          const newMarker = new mapsObject.value.maps.Marker({
            position: latLng,
            map: mapInstance.value,
            icon: markerIcon.value,
          });
          newMarker.setMap(mapInstance.value);
          mapMarkers.push(newMarker);
          const path = poly.value.getPath();
          path.push(latLng);
        }
      });
    }

    mapsObject.value.maps.event.addListener(
      mapInstance.value,
      "click",
      (event: google.maps.MapMouseEvent) => {
        if (mapsObject.value && poly.value && event.latLng) {
          const path: google.maps.MVCArray = poly.value.getPath();
          path.push(event.latLng);

          const newMarker = new mapsObject.value.maps.Marker({
            position: event.latLng,
            map: mapInstance.value,
            icon: markerIcon.value,
          });
          newMarker.setMap(mapInstance.value);
          mapMarkers.push(newMarker);
          mapStore.mapMarkers.push({
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
          });
        }
      }
    );

    mapsObject.value.maps.event.addListener(
      mapInstance.value,
      "bounds_changed",
      () => {
        const center = mapInstance.value.getCenter();
        mapStore.setMapCenter({ lat: center.lat(), lng: center.lng() });
        mapStore.setMapZoom(mapInstance.value.getZoom());
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

const removeLastMarker = () => {
  if (mapMarkers.length > 0) {
    const lastIndex = mapMarkers.length > 1 ? mapMarkers.length - 1 : 0;
    const lastMarker = mapMarkers[lastIndex];
    lastMarker.setMap(null);
    lastMarker.setPosition(null);
    mapMarkers.pop();
    mapStore.mapMarkers.pop();

    if (poly.value) {
      poly.value.setPath([]);
    }

    mapMarkers.forEach((marker) => {
      if (poly.value) {
        const position = marker.getPosition();
        if (position) {
          const latLng = new google.maps.LatLng(position.lat(), position.lng());
          const path = poly.value.getPath();
          path.push(latLng);
        }
      }
    });
  }
};

const resetMap = () => {
  if (mapStore.mapMarkers.length > 0) {
    mapStore.mapMarkers = [];
    mapMarkers.forEach((element) => {
      element.setMap(null);
      element.setPosition(null);
    });
    if (poly.value) {
      poly.value.setPath([]);
    }
  }
};

onMounted(() => {
  initLoader();
});
</script>
