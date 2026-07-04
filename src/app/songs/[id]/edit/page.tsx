"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { SongEditor } from "@/components/SongEditor";
import { useSongs } from "@/lib/data/SongsProvider";

export default function EditSongPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getSong, updateSong, loading } = useSongs();
  const song = getSong(id);
  const [saving, setSaving] = useState(false);

  if (loading) {
    return <p className="px-4 pt-10 text-center text-muted">Loading…</p>;
  }

  if (!song) {
    return (
      <div className="px-4 pt-16 text-center">
        <p className="font-medium">Song not found</p>
        <Link href="/" className="mt-2 inline-block text-sm text-accent">
          Back to library
        </Link>
      </div>
    );
  }

  return (
    <SongEditor
      heading="Edit Song"
      saving={saving}
      initial={song}
      onSave={async (values) => {
        setSaving(true);
        await updateSong(id, values);
        router.replace(`/songs/${id}`);
      }}
    />
  );
}
