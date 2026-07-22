# Ingestion sources

This package is the pluggable boundary between the matching engine
(`app/biometrics/`) and "wherever candidate videos come from." Two
sources ship here on purpose, and a third category is deliberately
**not** implemented. Read this before adding a new source.

## What ships

- **`LocalFolderSource`** — treats files dropped in `data/incoming/` as
  newly-uploaded candidates. This is how you exercise the full
  enroll -> scan -> alert pipeline in a demo or test without touching
  any external network. It's also the right integration point if you
  later get video files handed to you directly (e.g. a bulk export
  from an official platform API, or a partner feed).

- **`YouTubeSearchSource`** — queries the official **YouTube Data API
  v3** (`search.list`), a public, ToS-compliant, key-authenticated API
  Google provides for exactly this kind of use case. It finds
  candidate videos by metadata (title/description matches on the
  creator's name + scam-ad keywords); it does not download video
  files, because the API doesn't expose raw downloads — see the
  docstring in `youtube_source.py`.

## What's intentionally not here: scrapers for Instagram/TikTok/Facebook/X

The original brief asks for "scrapers to check public social media
feeds." Directly scraping those platforms (headless-browser automation
against logged-in feeds, bypassing rate limits or bot-detection, etc.)
was left out on purpose:

1. **It violates those platforms' Terms of Service.** Instagram,
   TikTok, Facebook, and X all explicitly prohibit automated
   collection outside their official APIs. Building it here would mean
   shipping ToS-violating code, not a demo.
2. **Legal exposure is real and platform-specific.** Case law on
   scraping public data is unsettled and jurisdiction-dependent (e.g.
   *hiQ v. LinkedIn*); anti-bot circumvention adds separate risk (e.g.
   CFAA claims in the US) on top of straightforward breach-of-contract
   exposure from the ToS violation itself.
3. **It would require evading detection to work at all** (rotating
   proxies/fingerprints, solving CAPTCHAs, bypassing login walls) —
   that's the kind of anti-detection tooling this assistant won't
   write regardless of the target.

**The legitimate path or a real product to get this coverage:**

- **Meta Content Library API** — Meta's own researcher/partner API for
  querying public Facebook/Instagram content, available under an
  approved-access agreement.
- **TikTok Research API** — same idea for TikTok, requires an approved
  application.
- **Platform-specific "report impersonation" / rights-manager
  integrations** — several platforms (YouTube's Content ID being the
  best-known example) offer creators/rightsholders a sanctioned way to
  flag look-alike or clone content without you needing to ingest their
  firehose at all.
- **Licensed third-party monitoring vendors** who already hold these
  platform partnerships (this space has real commercial players) can
  be integrated as just another `VideoSource` implementation.

Add any of these as a new file in this package implementing the
`VideoSource` interface (`base.py`) once you have the appropriate
access — the scheduler and scanning pipeline don't need to change.
