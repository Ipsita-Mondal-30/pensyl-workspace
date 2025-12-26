"use client";

import { createClient } from "@supabase/supabase-js";

// Note: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export async function uploadImageToWorkspaceBucket(file: File) {
  if (!supabase) {
    throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  if (file.size > 15 * 1024 * 1024) {
    throw new Error("File too large. Max 15MB.");
  }

  const fileExt = file.name.split(".").pop() || "png";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
  const { data, error } = await supabase.storage
    .from("workspace-media")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from("workspace-media")
    .getPublicUrl(data.path);

  const url = publicUrlData?.publicUrl;
  console.info("[Supabase] Uploaded image", {
    path: data.path,
    url,
    size: file.size,
    type: file.type,
  });
  return url;
}

