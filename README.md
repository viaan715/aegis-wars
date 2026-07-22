# Aegis — Live Deepfake Auditing Dashboard

A privacy dashboard for creators: enroll a few reference photos and a
voice clip, and Aegis continuously checks newly published public video
against your biometric embeddings, flagging likely face/voice clones
for human review.

## How it works

```
enroll (photos + voice clip)
        │
        ▼
 DeepFace / Resemblyzer embeddings  ──►  stored per creator (SQLite)
        │
        ▼
 scheduler (APScheduler, every N minutes)
        │
        ▼
 ingestion sources (pluggable)  ──►  new candidate videos
        │
        ▼
 scan pipeline: sample frames + audio windows, embed, cosine-compare
        │
        ▼
 Alert (status: new → reviewed → confirmed/dismissed)  ──►  webhook/email
        │
        ▼
 dashboard: review evidence, mark status, manage enrollment/privacy
```

- **Face matching** — `app/biometrics/face.py`, via
  [DeepFace](https://github.com/serengil/deepface) (default model:
  Facenet512). Embeddings, not hashes: matching is cosine similarity
  against a tunable threshold, not exact equality.
- **Voice matching** — `app/biometrics/voice.py`, via
  [Resemblyzer](https://github.com/resemble-ai/Resemblyzer) speaker
  embeddings, same cosine-similarity approach over sliding windows of
  a candidate video's audio track.
- **Ingestion** — `app/ingestion/`, a pluggable `VideoSource`
  interface. See **"On scraping social media" below** — this is the
  part most worth reading before you extend it.
- **Pipeline + scheduler** — `app/pipeline/`, orchestrates fetch →
  download → match → alert → notify, run on a timer.
- **Dashboard** — FastAPI + a single Jinja2 template
  (`app/templates/dashboard.html`): enroll creators, upload
  references, watch the alert feed, trigger a manual scan, delete a
  creator's data outright.

## On scraping social media

The original brief asks for "scrapers to check public social media
feeds." This deliberately does **not** include a scraper for
Instagram/TikTok/Facebook/X. Full reasoning is in
`app/ingestion/README.md`; short version: automated collection against
those platforms outside their official APIs violates their Terms of
Service, carries real legal exposure, and typically requires
bot-detection evasion to function at all. None of that belongs in a
tool you ship.

What ships instead:

- **`YouTubeSearchSource`** — the official, key-authenticated YouTube
  Data API v3. A real, ToS-compliant "public social feed" integration.
- **`LocalFolderSource`** — drop video files in `data/incoming/` and
  they're treated as newly-uploaded candidates. This is how you
  exercise the full pipeline end-to-end (including in the automated
  tests) without any network dependency, and it's also the right
  integration point for a partner feed or bulk export.

To get real Instagram/TikTok/Facebook coverage, apply for the
platforms' own researcher/partner APIs (Meta Content Library API,
TikTok Research API) or integrate a licensed monitoring vendor as
another `VideoSource` — the scanning pipeline doesn't change either
way. Details and links in `app/ingestion/README.md`.

## Setup

Requires Python 3.11+ and `ffmpeg` on PATH (used to pull the audio
track out of candidate videos).

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # optional — every setting has a default
```

`deepface` downloads its model weights on first use (a few hundred MB,
cached locally afterward). No account/API key needed for face or voice
matching — only the optional YouTube source needs a key.

## Running it

```bash
# API + dashboard
uvicorn app.main:app --reload
# → http://localhost:8000/dashboard

# Continuous monitoring, in a separate process
python scripts/run_scheduler.py

# Or drive it by hand:
python scripts/enroll_creator.py --name "Jane Doe" --email jane@example.com \
    --photos p1.jpg p2.jpg p3.jpg --voice clip.wav
python scripts/run_scan.py
```

You can also do all of enrollment (photos + voice), scan-source setup,
and alert review from the dashboard itself — the CLI scripts are just
the scriptable equivalent for the pipeline the brief specifically asks
for.

To register a scan source (also possible via `POST /sources`):

```bash
curl -X POST localhost:8000/sources -H 'content-type: application/json' -d '{
  "name": "incoming folder",
  "type": "local",
  "config": {"folder": "data/incoming"}
}'
```

## Testing

```bash
pip install -r requirements.txt   # includes pytest
pytest
```

The unit tests stub out `deepface`/`resemblyzer` (see
`tests/conftest.py`) rather than downloading real model weights in CI
— they cover the similarity math, ingestion/dedup logic, the scan
pipeline's orchestration, and the API, with the biometric calls
monkeypatched to canned embeddings. Treat real-model accuracy
(threshold tuning, false-positive rate) as a separate, explicitly
opt-in evaluation against labeled data, not something a fast unit
suite should gate on.

## Privacy & responsible-use notes (read before deploying this for real)

- **This is a prototype, not a production security posture.** There's
  no authentication on the API/dashboard as shipped — anyone who can
  reach the port can enroll, delete, or read anyone's data. Put it
  behind real auth before it touches real biometric data.
- **Biometric data is legally sensitive.** Face/voice embeddings are
  "special category" data under GDPR and regulated explicitly under
  laws like Illinois's BIPA. Get informed consent before enrolling
  anyone, encrypt `data/uploads/` at rest, and use the
  `DELETE /creators/{id}` endpoint (or the dashboard's "Delete all
  data" button) as your right-to-erasure path — it removes the DB rows
  and every stored reference file.
- **False positives are expected and by design not auto-actioned.**
  Every match lands as an `Alert` with status `new` — a human has to
  move it to `reviewed`/`confirmed`/`dismissed`. Nothing in this
  codebase auto-publishes an accusation; wire that decision to a human
  in whatever you build on top.
- **Thresholds need real tuning.** `FACE_MATCH_THRESHOLD` /
  `VOICE_MATCH_THRESHOLD` in `.env` are reasonable starting points, not
  validated numbers — deepfake detection has real false-positive/
  false-negative tradeoffs that depend on your model choice and data.

## Project layout

```
app/
  config.py          settings (thresholds, paths, API keys)
  models.py           SQLAlchemy schema
  main.py              FastAPI routes + dashboard
  biometrics/
    face.py            DeepFace embeddings + video frame scanning
    voice.py            Resemblyzer embeddings + video audio scanning
  ingestion/
    base.py             VideoSource interface
    local_source.py      demo/testing source (data/incoming/)
    youtube_source.py     official YouTube Data API v3 source
    README.md             why no IG/TikTok/FB scraper — read this
  pipeline/
    scanner.py           orchestrates one fetch→match→alert cycle
    scheduler.py          runs it on a timer
  alerts/notifier.py    webhook + email delivery
  templates/dashboard.html
scripts/               CLI entry points (enroll, run_scan, run_scheduler)
tests/                  pytest suite (deepface/resemblyzer stubbed)
```
