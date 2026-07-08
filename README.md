# Paving Plan AI — GitHub Codespaces Ready

Enter a **business address**, pick a **job type**, and generate a preliminary, editable, printable **parking-lot paving phasing map**. The application geocodes the address, obtains a permitted aerial image, asks an AI vision model to suggest an operational phasing plan, and renders a color-coded map for guests and the paving crew — which you can then drag-edit before exporting.

This package is configured to run directly in **GitHub Codespaces**. It installs Python dependencies, forwards a private preview port, starts the app automatically when the Codespace opens, and keeps API keys out of your repository.

## What's in this version

- **Job type selection** — Sealcoating & Restripe, Mill & Overlay, or Full-Depth Reconstruction, each with its own sensible day-count range instead of a fixed 3-day plan.
- **Review & edit step** — before exporting, drag zone boundaries and the guest-routing arrow directly on the map, and edit zone labels / guest instructions inline. Nothing is exported until you approve it.
- **Guest notice generator** — a ready-to-send parking notice drafted from the final plan, with one-click copy, email, and text links.
- **Project history** — optionally save a finished plan (opt-in, per plan — nothing is saved automatically) to revisit, re-download, or delete later. Stored in a small local SQLite database plus one PNG per saved plan.
- **Basic abuse protection** — `/api/generate-plan` calls paid OpenAI and Mapbox APIs, so it's rate-limited per client IP (configurable).
- A **View example** button that works immediately, even before API secrets are added — the example is a synthesized illustration, not real satellite imagery, so the demo needs zero configuration and no imagery-licensing questions.
- `.devcontainer/devcontainer.json` — reproducible Python 3.12 development container.

## Fastest setup: GitHub Codespaces

### 1. Put this folder in a private GitHub repository

1. Create a new **private** repository in GitHub, for example `paving-plan-ai`.
2. Upload the contents of this folder into that repository. The `.devcontainer` folder must stay at the project root.
3. Do **not** upload `.env`, API keys, or copied secret values.

### 2. Create the Codespace

On the repository page: **Code → Codespaces → Create codespace on main**.

The first startup takes a few minutes while Python packages install. Once the Codespace attaches, the app starts automatically and port **8000** appears in the **Ports** tab as a private preview. Open it to see the site.

### 3. Add two Codespaces secrets

In GitHub, use **profile picture → Settings → Codespaces → New secret**. Create these secrets and grant your new repository access:

| Secret name | What to paste |
|---|---|
| `OPENAI_API_KEY` | Your OpenAI API key |
| `MAPBOX_ACCESS_TOKEN` | Your Mapbox public/default access token with Geocoding and Static Images access |

After adding secrets, **stop and restart the Codespace**. Secrets become environment variables inside the Codespace; they are not saved in the source code.

### 4. Confirm aerial-imagery rights once

In the Codespaces terminal, run:

```bash
./codespaces-configure.sh
```

Type `YES` only after confirming your imagery license permits this workflow: aerial-image viewing, sending the image to the AI processor, and producing annotated maps for contractor/guest communication. The script writes only this confirmation into local `.env`; your keys remain in Codespaces secrets.

Then refresh the preview and submit a business address.

## Daily use

1. Open your Codespace and the port-8000 preview.
2. Enter business name (optional), complete street address, and pick a job type.
3. Select **Generate plan**.
4. On the review screen, drag zone boundaries or the guest-routing arrow, and edit any label text. Use **Regenerate with AI** to try again, or **Reset edits** to discard changes.
5. Select **Finalize & export**.
6. Download the PNG, print/save as PDF, optionally save it to history, and send the drafted guest notice by email or text.

**View example** works without any API configuration.

## Important operational limits

This is a **preliminary operations and communications map**, not a construction drawing. Before work, the paving contractor and site manager must verify:

- pavement limits, base failures, site measurements, and final seam locations;
- accessible parking, access aisles, pedestrian route, and slopes;
- emergency/fire access, deliveries, traffic control, and guest circulation;
- drainage, catch basins, curbs, utilities, and door thresholds; and
- municipal permits and any property-specific requirements.

The app intentionally flags every map for field review, and the AI is never asked to make claims about stall counts, ADA compliance, drainage, or fire routes.

## Useful Codespaces commands

```bash
# Re-start the site if needed
bash .devcontainer/start-server.sh

# View the server log if preview does not open
cat .paving-plan-ai.log

# Confirm live-mode setup after secrets are added
./codespaces-configure.sh

# Regenerate the demo assets (only needed if you edit the demo plan/synthetic image)
python scripts/build_demo_assets.py
```

VS Code also lists the first three under **Terminal → Run Task**.

## Local / Docker use remains available

The app can still be run locally with `.env` or deployed using the supplied `Dockerfile` and `render.yaml`. For local use:

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then fill in your keys and set IMAGERY_LICENSE_CONFIRMED=true
uvicorn app:app --reload
```

### Deploying to Render

`render.yaml` provisions a Docker web service with a small persistent disk mounted at `/data` (via `DATA_DIR`) so saved history survives redeploys. Set `OPENAI_API_KEY` and `MAPBOX_ACCESS_TOKEN` as secret environment variables in the Render dashboard after the first deploy, then set `IMAGERY_LICENSE_CONFIRMED=true` once you've confirmed your imagery license.

Without a persistent disk, saved history is lost on every redeploy — that's fine for a demo, but plan for a disk (or swap in a hosted database/object storage) before relying on history for real record-keeping.

## Project flow

- Mapbox Geocoding API → address coordinates.
- Mapbox Static Images API → aerial site image.
- OpenAI Responses API / vision → phase polygons and guest-routing text, tuned to the selected job type and day count.
- Browser-side SVG editor → drag-correct the AI's polygons/labels before anything is rendered to a final image.
- Pillow (server-side) → renders the final labeled map from the (possibly edited) plan, with automatic label-collision avoidance and a legend/footer sized to the actual number of phases.
- SQLite (opt-in) → stores saved plans for the history view.

## Configuration reference (`.env`)

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY`, `MAPBOX_ACCESS_TOKEN` | Required for live generation. |
| `MAPBOX_STYLE` | Mapbox static-image style, `owner/style-id` format. |
| `OPENAI_VISION_MODEL` | Vision-capable model used for phase generation. |
| `IMAGERY_LICENSE_CONFIRMED` | Must be `true` to enable live generation — an explicit acknowledgment that your imagery license permits this use. |
| `DATA_DIR` | Where the opt-in history database and saved plan images live. Point this at a persistent volume in production. |
| `RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_WINDOW_SECONDS` | Per-IP cap on `/api/generate-plan` calls, since each one costs money. |
| `LOG_LEVEL` | Python logging level. |

## Suggested production improvements

- Accounts/auth if this needs to be multi-tenant, plus retention controls on saved history.
- Full polygon redraw (add/remove points, not just drag existing ones).
- Contractor review/approval workflow before a guest notice goes out.
- Move history storage from local SQLite + disk to a hosted database and object storage for durability across deploys.
- Field measurements, CAD layers, and a professional ADA/drainage review before issuing a construction plan.
