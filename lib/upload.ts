import { createClient } from "@/lib/supabase/client";

export async function uploadStoryImage(file: File, userId: string) {
  const supabase = createClient();
  const ext = file.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}.${ext}`;
  const filePath = `stories/${fileName}`;

  const { data: uploadData, error } = await supabase.storage
    .from("uploads")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  const path = uploadData.path ?? filePath;

  const { data } = supabase.storage.from("uploads").getPublicUrl(path);

  return data.publicUrl;
}
