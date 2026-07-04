"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SongEditor } from "@/components/SongEditor";
import { useSongs } from "@/lib/data/SongsProvider";

export default function NewSongPage() {
  const router = useRouter();
  const { createSong } = useSongs();
  const [saving, setSaving] = useState(false);

  return (
    <SongEditor
      heading="New Song"
      saving={saving}
      onSave={async (values) => {
        setSaving(true);
        const song = await createSong(values);
        router.replace(`/songs/${song.id}`);
      }}
    />
  );
}
