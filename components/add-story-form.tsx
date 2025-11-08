"use client";

import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { uploadStoryImage } from "@/lib/upload";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { LucideX } from "lucide-react";

export function AddStoryForm({
  user,
  show,
  setShow,
  newCoords,
  toggleAdding,
  addingMode,
}: {
  user: User;
  show: boolean;
  setShow: Dispatch<SetStateAction<boolean>>;
  newCoords: { lat: number | null; lng: number | null } | null;
  toggleAdding: () => void;
  addingMode: boolean;
}) {
  const supabase = createClient();
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCoords?.lat || !newCoords?.lng) {
      alert("Please click on the map to set the location first.");
      return;
    }

    if (!message && !file) {
      alert("Please add a message or an image before submitting.");
      return;
    }

    setLoading(true);

    try {
      let imageUrl: string | null = null;

      if (file) {
        imageUrl = await uploadStoryImage(file, user.id);
      }

      const { error } = await supabase.from("stories").insert({
        user_id: user.id,
        message,
        image_url: imageUrl,
        lat: newCoords.lat,
        lng: newCoords.lng,
      });

      if (error) throw error;

      setMessage("");
      setFile(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      alert("Story added!");
      setShow(false);
    } catch (err) {
      console.error(err);
      alert("Upload failed. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <form className="p-4 flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
      <div className="flex justify-between">
        <h1 className="font-bold text-xl">Add Mapory</h1>
        <Button
          variant={"secondary"}
          type="button"
          onClick={() => setShow(false)}
          size={"sm"}
        >
          <LucideX />
        </Button>
      </div>

      <Label>Image</Label>
      <Input type="file" onChange={handleFileChange} key={file?.name ?? ""} />
      {preview && (
        <img
          src={preview}
          alt="Preview"
          className="w-64 h-64 object-cover mt-2 rounded-sm"
        />
      )}

      <Label>Message</Label>
      <Textarea
        placeholder="Describe your memory..."
        rows={6}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <Label>Latitude & Longitude</Label>
      {!newCoords ? (
        <p>First activate pin then, click on the map to set the location</p>
      ) : (
        <p>
          Latitude: <span className="text-red-500">{newCoords.lat}</span>
          <br />
          Longitude: <span className="text-red-500">{newCoords.lng}</span>
        </p>
      )}

      <Button type="button" variant={"secondary"} onClick={toggleAdding}>
        {addingMode ? "Deactivate Pin" : "Activate Pin"}
      </Button>
      {addingMode && (
        <p className="text-sm">
          Now you can click on map to select the coordinates.
        </p>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "Uploading..." : "Add Mapory"}
      </Button>
    </form>
  );
}
