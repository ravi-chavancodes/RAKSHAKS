"use client";

import { useEffect, useRef } from "react";
import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  setWorkerUrl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface LocationMapProps {
  latitude: number;
  longitude: number;
  onCoordinatesChange: (lat: number, lng: number) => void;
}

export function LocationMap({
  latitude,
  longitude,
  onCoordinatesChange,
}: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setWorkerUrl("/maplibre-gl-worker.js");

    const map = new MapLibreMap({
      container,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm-tiles",
            type: "raster",
            source: "osm",
          },
        ],
      },
      center: [longitude, latitude],
      zoom: 16,
    });

    map.addControl(new NavigationControl({ showCompass: false }), "top-right");

    const marker = new Marker({
      color: "#dc2626",
      draggable: true,
    })
      .setLngLat([longitude, latitude])
      .addTo(map);

    marker.on("dragend", () => {
      const lngLat = marker.getLngLat();
      onCoordinatesChange(lngLat.lat, lngLat.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      marker.remove();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Initialize map once when mounted; coordinate updates handled below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      markerRef.current.setLngLat([longitude, latitude]);
      mapRef.current.setCenter([longitude, latitude]);
    }
  }, [latitude, longitude]);

  return (
    <div
      ref={containerRef}
      aria-label="Interactive location confirmation map"
      className="h-[260px] w-full overflow-hidden rounded-md border border-border-default bg-surface-subtle sm:h-[300px]"
    />
  );
}
