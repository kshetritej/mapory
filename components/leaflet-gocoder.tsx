"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-control-geocoder";

export default function LeafletGeocoder() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // @ts-expect-error if it exists or not who cares it works
    const geocoder = L.Control.geocoder({
      defaultMarkGeocode: false,
    })
      .on("markgeocode", function (e: any) {
        const center = e.geocode.center;
        map.setView(center, 13);
      })
      .addTo(map);

    return () => {
      geocoder.remove();
    };
  }, [map]);

  return null;
}
