// ClickHandler.tsx
"use client";

import { useMapEvents } from "react-leaflet";

interface ClickHandlerProps {
  onClick: (lat: number, lng: number) => void;
  isAdding: boolean;
}

export default function ClickHandler({ onClick, isAdding }: ClickHandlerProps) {
  useMapEvents({
    click(e) {
      if (isAdding) {
        onClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}
