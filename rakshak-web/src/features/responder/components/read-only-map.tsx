"use client";

import { useEffect, useRef } from "react";
import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  setWorkerUrl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface ReadOnlyMapProps {
  latitude: number;
  longitude: number;
}

export function ReadOnlyMap({ latitude, longitude }: ReadOnlyMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

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
      zoom: 15,
    });

    map.addControl(new NavigationControl({ showCompass: false }), "top-right");

    const marker = new Marker({ color: "#dc2626", draggable: false })
      .setLngLat([longitude, latitude])
      .addTo(map);

    return () => {
      marker.remove();
      map.remove();
    };
  }, [latitude, longitude]);

  return (
    <div
      ref={containerRef}
      aria-label="Incident location map"
      className="h-[240px] w-full overflow-hidden rounded-md border border-border-default bg-surface-subtle"
    />
  );
}
