# OrvilleChords — Build Plan

A mobile-first web app for worship song chords and lyrics, for Orville and his worship team.

**Stack:** TypeScript · Next.js 15 (App Router) · Tailwind CSS + shadcn/ui · ChordSheetJS · pptxgenjs (slides export) · Supabase (Postgres + Auth) · Vercel · PWA (Serwist)

**Architecture:** Monolith + backend-as-a-service. One Next.js codebase; Supabase provides the managed database and auth.

**Song format:** ChordPro — chords inline with lyrics, e.g. `[G]Amazing [G7]grace, how [C]sweet the [G]sound`

---

## Phase 0 — Project setup

Goal: a running app shell on a phone-sized screen.

- [x] Verify Node.js 20+ is installed (Node 26)
- [x] Scaffold Next.js with TypeScript and Tailwind CSS (Next 16, Tailwind v4)
- [x] Add ChordSheetJS + Vitest (UI uses hand-rolled primitives in the
      shadcn style; add shadcn components when the Phase 2 bottom sheet needs them)
- [x] Initialize git repository
- [x] App shell: bottom navigation bar, dark mode as default, mobile viewport meta
- [x] Base folder structure:
  ```
  src/
    app/            # pages: library, song view, editor
    components/     # SongViewer, ChordEditor, KeySelector...
    lib/chords/     # chord engine wrapper + tests
    lib/data/       # data layer (local first, Supabase later)
  ```

**Done when:** `npm run dev` shows the app shell, and it looks right at 375px width. ✅ **Done.**

---

## Phase 1 — Song library (local-first)

Goal: a usable personal songbook on your phone — before any accounts or servers exist.

- [x] Song model: `title, artist, originalKey, tags[], body (ChordPro)`
- [x] Data layer against browser storage (IndexedDB via `idb`), behind a
      `SongRepository` interface so Supabase can swap in at Phase 4 without touching the UI
- [x] **Library screen:** song list with search (title/artist/tags), A–Z sort, floating "add song" button
- [x] **Song viewer:** renders chords *above* lyrics
  - [x] Pair-aware line wrapping — a chord never separates from its word on narrow screens
  - [x] Font size control (A− / A+), persisted per device
  - [x] Compact pinned header: title, key, artist
- [x] **Song editor:** ChordPro text area with live preview; tap-to-insert chord palette
- [x] Delete song (with confirmation dialog)
- [x] Seed 2–3 public-domain hymns as sample data (Amazing Grace, Holy Holy Holy, Come Thou Fount)

**Done when:** you can add, edit, search, and read songs comfortably on a phone; chords align correctly over lyrics; long lines wrap without orphaning chords. ✅ **Done — verified at 375px, including word-safe wrapping at 180% font.**

---

## Phase 2 — Transposition

Goal: tap a key, every chord updates — correctly.

- [x] Chord engine module (`lib/chords/`): `renderInKey` wraps ChordSheetJS's
      key-aware `changeKey` (spells in the target key's context — avoids B# glitches)
- [x] Vitest unit tests — **24 passing** (`npm test`):
  - [x] Basic transposition (G → A, etc.) across keys, up and down
  - [x] Enharmonic correctness: B♭ not A♯ when target key calls for flats
  - [x] Slash chords (G/B → A/C#), sevenths/extensions (Cmaj7, Dm7), altered (F#m7b5)
  - [x] Round-trip: transpose up then back down returns the original
  - [x] Capo (key A + capo 2 → G shapes)
- [x] **Key selector** as a bottom sheet: 12 big tappable key buttons, current key
      highlighted, "orig" marker, "reset to original"; buttons match the song's major/minor mode
- [x] Original-key hint in the header ("A from G")
- [x] **Capo mode:** pick a capo fret → display shape chords + banner ("Capo 2 — play F shapes, sounds in G")
- [x] Per-device remembered key + capo per song (localStorage)

**Done when:** the test suite passes and manual spot-checks on real worship songs produce chords a musician would actually write. ✅ **Done — 24 tests green; verified G→A, G→Bb (flats), and capo 1/2 in the browser.**

---

## Phase 3 — Lyrics slides (PowerPoint export)

Goal: one tap turns a song into a projection-ready .pptx — lyrics only, no chords.

- [x] Lyrics extractor (`lib/slides/lyrics.ts`): ChordPro body → plain lyrics
  - [x] Strips all `[chord]` tokens and ChordPro directives/comments
  - [x] Keeps section structure (verses, choruses) intact
  - [x] Unit-tested (8 tests) alongside the chord engine
- [x] Slide splitter: one stanza/section per slide, with a max-lines-per-slide
      setting (default 6) that splits long verses cleanly
- [x] .pptx generation with pptxgenjs — runs entirely in the browser (lazy-loaded), no server:
  - [x] 16:9 slides, black background, large centered white text
  - [x] Title slide with song title and artist
  - [x] Optional copyright/CCLI-number footer on each slide
- [x] "Export slides" button on the song view → downloads `SongTitle.pptx`
- [~] Verify output opens cleanly in PowerPoint, Google Slides, and LibreOffice
      (verified valid .pptx + correct slide XML; open-in-app spot check still worth doing on a real machine)

**Done when:** you can export any song and project it as-is — clean slides, readable from the back row, zero manual editing in PowerPoint. ✅ **Done — generated a real deck; slide XML confirmed clean lyrics, no chords, title slide + footer.**

---

## Phase 4 — Team access + PWA

Goal: the team signs in from their phones, installs the app, and songs work offline on stage.

*Requires Orville: free accounts on Supabase, GitHub, and Vercel (I'll walk through each).*

- [x] Supabase project + schema as SQL migration ([supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql)):
  - `songs`, `setlists`, and `profiles` (user_id, display_name, role: 'editor' | 'viewer')
- [x] Row-level security: signed-in users read all; only editors write (applied & verified)
- [x] Magic-link email sign-in (no passwords) — `AuthProvider` + gate; OTP send verified (200)
- [x] Swap data layer from IndexedDB to Supabase; one-time migration of local songs
      (`supabaseSongRepository` / `supabaseSetlistRepository` behind the same interfaces)
- [x] Push to GitHub (`orvilledev/OrvilleChords`, private) + deploy to Vercel
      → **https://orvillechords.vercel.app** (env vars set; Supabase auth URLs updated)
  - [ ] Optional: connect the GitHub repo in the Vercel dashboard for auto-deploy on push
        (needs a one-time GitHub login connection; today deploys are via CLI)
- [x] **PWA:**
  - [x] Web app manifest + generated icons (192/512/maskable, apple-touch), standalone display — installable to home screen
  - [x] Service worker (`public/sw.js`): cache app shell, Next assets, and Supabase song reads for offline use (hand-rolled; registers in production only)
  - [x] Screen Wake Lock while performing (added in stage mode, Phase 5)
- [ ] Verify on real phones: install, sign in, airplane-mode test *(manual — over to you)*

**Done when:** a team member can sign in on their phone, add the app to their home screen, and read every song with no connection. ✅ **Built & deployed — final airplane-mode check on a real phone is yours to do.**

### Also shipped (not in the original plan)
- Auth switched from magic link to **email + password** (+ email confirmation off, so signup needs no email).
- **Password reset** flow ("Forgot password?" + recovery screen).

---

## Phase 5 — Setlists & stage mode

Goal: run a full Sunday service from a phone.

- [x] Schema: `setlists` store (id, name, serviceDate, items[]) in IndexedDB (DB v2);
      each item carries **keyOverride** + capo (the set owns the performance key)
- [x] Setlist builder: create list, add songs from library, reorder (up/down),
      set the performance key + capo per song, remove, delete set
- [x] **Performance flow:** open a setlist → swipe left/right between songs in order (scroll-snap)
- [x] Stage mode: extra-large adjustable font, auto-scroll with speed control, screen wake lock
- [~] Setlist sharing: every team member sees the upcoming set — **deferred to Phase 4**
      (needs the shared cloud DB; local sets work fully today)
- [x] **Full-service slide deck:** export an entire setlist as one .pptx —
      cover slide + each song in order, lyrics only

**Done when:** you can build Sunday's set on Saturday and the whole team plays from it Sunday morning without touching anything but "next song." ✅ **Done locally — verified: built a 3-song set, per-song key override (Amazing Grace in A), stage swipe/auto-scroll, and a 7-slide set deck. Cross-device sharing arrives with Phase 4.**

**Note on reorder:** used up/down buttons rather than drag-and-drop — reliable on touch
without a DnD library. Drag can be added later if desired.

---

## Later ideas (backlog, not scheduled)

- ChordPro file import/export (backup, migrate from other tools)
- Nashville number system view
- Print / PDF export
- Custom slide themes (church branding, background images, font choices)
- Song usage history ("when did we last play this?")
- Duplicate-song detection

## Cost

$0/month — Vercel free tier, Supabase free tier (500 MB Postgres, 50k monthly auth users). A worship team won't approach either limit.
