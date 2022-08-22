import { defineStore } from "pinia";
import { useStorage } from "@vueuse/core";

interface centerObject {
  lat: number;
  lng: number;
}

export const useMapStore = defineStore({
  id: "map",
  state: () => ({
    mapCenter: useStorage("mapCenter", { lat: 56.0109643, lng: 10.248719 }),
    mapZoom: useStorage("mapZoom", 6),
    mapMarkers: useStorage("mapMarkers", [] as centerObject[]),
  }),
  actions: {
    setMapCenter(center: centerObject) {
      this.mapCenter = center;
    },
    setMapZoom(zoom: number) {
      this.mapZoom = zoom;
    },
  },
});
