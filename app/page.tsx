"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { AddStoryForm } from "@/components/add-story-form";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { LucideMenu } from "lucide-react";
import { AuthButton } from "@/components/auth-button";

// Dynamically import react-leaflet and leaflet so they only run on client side
const MapContainer = dynamic(
  async () => (await import("react-leaflet")).MapContainer,
  { ssr: false }
);
const TileLayer = dynamic(
  async () => (await import("react-leaflet")).TileLayer,
  { ssr: false }
);
const Marker = dynamic(async () => (await import("react-leaflet")).Marker, {
  ssr: false,
});
const Popup = dynamic(async () => (await import("react-leaflet")).Popup, {
  ssr: false,
});
// const useMapEvents = dynamic(
//   async () => (await import("react-leaflet")).useMapEvents,
//   { ssr: false }
// );

// Lazy import leaflet and geocoder only on client
const LeafletGeocoder = dynamic(() => import("@/components/leaflet-gocoder"), {
  ssr: false,
});

let L: any;
if (typeof window !== "undefined") {
  // Only require leaflet in the browser
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  L = require("leaflet");
}

interface Story {
  id: string;
  lat: number;
  lng: number;
  message: string;
  image_url: string | null;
  user_id: string;
}

function ClickHandler({
  onClick,
  isAdding,
}: {
  onClick: (lat: number, lng: number) => void;
  isAdding: boolean;
}) {
  if (typeof window === "undefined") return null;

  const { useMapEvents } = require("react-leaflet");
  useMapEvents({
    click(e: any) {
      if (isAdding) {
        onClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function MaporyMap() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [addingMode, setAddingMode] = useState(false);
  const [show, setShow] = useState(false);
  const [newCoords, setNewCoords] = useState<{
    lat: number | null;
    lng: number | null;
  } | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
      const { data, error } = await supabase
        .from("stories")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) console.error("Error fetching stories:", error);
      else setStories(data as Story[]);
    };
    fetchStories();
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const res = await supabase.auth.getUser();
      setUser(res.data.user);
    };
    getUser();
  }, []);

  const handleMapClick = (lat: number, lng: number) =>
    setNewCoords({ lat, lng });
  const toggleAddingMode = () => setAddingMode(!addingMode);

  return (
    <div className="flex h-screen">
      {newCoords?.lat && newCoords.lng && (
        <Button
          className="fixed bottom-8 right-8 z-[999]"
          onClick={() => setNewCoords({ lat: null, lng: null })}
        >
          Clear Coordinates
        </Button>
      )}

      {/* Left Sidebar */}
      <div className="bg-transparent">
        {user && show && (
          <AddStoryForm
            addingMode={addingMode}
            show={show}
            toggleAdding={toggleAddingMode}
            setShow={setShow}
            user={user}
            newCoords={newCoords}
          />
        )}
        {!show && (
          <Button
            disabled={!user}
            title="Login or signup to add your mapory!"
            className="fixed top-4 left-4"
            onClick={() => setShow(true)}
            variant={"outline"}
          >
            <LucideMenu />
          </Button>
        )}
      </div>

      {/* Map Panel */}
      <div className="flex-1">
        <MapContainer
          center={[28.3949, 84.124]}
          zoom={7}
          className="h-full w-full relative"
        >
          <LeafletGeocoder />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <ClickHandler onClick={handleMapClick} isAdding={addingMode} />

          {/* Show existing stories */}
          {stories.map((story) => (
            <Marker key={story.id} position={[story.lat, story.lng]}>
              <Popup>
                {story.image_url && (
                  <img
                    src={story.image_url}
                    className="w-32 h-32 object-cover mb-2"
                  />
                )}
                <p>{story.message}</p>
                <p>{"Anon."}</p>
              </Popup>
            </Marker>
          ))}

          {/* Temporary new pin */}
          {newCoords?.lat != null && newCoords?.lng != null && L && (
            <Marker
              position={[newCoords.lat, newCoords.lng]}
              icon={L.icon({
                iconUrl: "/map-icon.png",
                iconSize: [42, 42],
                iconAnchor: [12, 41],
              })}
            >
              <Popup>New Mapory location</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
