import type { NewSong } from "./repository";

/** Public-domain hymns seeded on first launch so the app is never empty. */
export const seedSongs: NewSong[] = [
  {
    title: "Amazing Grace",
    artist: "John Newton",
    originalKey: "G",
    tags: ["hymn"],
    body: `{title: Amazing Grace}
{artist: John Newton}
{key: G}

{start_of_verse: label="Verse 1"}
A[G]mazing [G7]grace, how [C]sweet the [G]sound
That [G]saved a wretch like [D]me
I [G]once was [G7]lost, but [C]now am [G]found
Was [Em]blind, but [D]now I [G]see
{end_of_verse}

{start_of_verse: label="Verse 2"}
'Twas [G]grace that [G7]taught my [C]heart to [G]fear
And [G]grace my fears re[D]lieved
How [G]precious [G7]did that [C]grace ap[G]pear
The [Em]hour I [D]first be[G]lieved
{end_of_verse}`,
  },
  {
    title: "Holy, Holy, Holy",
    artist: "Reginald Heber",
    originalKey: "D",
    tags: ["hymn"],
    body: `{title: Holy, Holy, Holy}
{artist: Reginald Heber}
{key: D}

{start_of_verse: label="Verse 1"}
[D]Holy, holy, [A]holy! [D]Lord God Al[A]mighty!
[D]Early in the [A]morning our [D]song shall rise to [A]Thee
[D]Holy, holy, [G]holy! [D]Merciful and [A]mighty
[D]God in three [G]persons, [D]blessed [A]Trini[D]ty
{end_of_verse}`,
  },
  {
    title: "Come Thou Fount",
    artist: "Robert Robinson",
    originalKey: "D",
    tags: ["hymn"],
    body: `{title: Come Thou Fount of Every Blessing}
{artist: Robert Robinson}
{key: D}

{start_of_verse: label="Verse 1"}
[D]Come Thou Fount of [G]every [D]blessing
[D]Tune my heart to [A]sing Thy [A7]grace
[D]Streams of mercy, [G]never [D]ceasing
[D]Call for songs of [A]loudest [D]praise
{end_of_verse}

{start_of_verse: label="Verse 2"}
[D]Here I raise mine [G]Eben[D]ezer
[D]Hither by Thy [A]help I'm [A7]come
{end_of_verse}`,
  },
];
