#!/usr/bin/env python
"""Enroll a creator: 3 reference photos + a ~10s voice clip.

Usage:
    python scripts/enroll_creator.py \\
        --name "Jane Doe" --email jane@example.com \\
        --photos photo1.jpg photo2.jpg photo3.jpg \\
        --voice voice_sample.wav
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.biometrics.face import extract_face_embedding
from app.biometrics.voice import extract_voice_embedding
from app.config import settings
from app.database import SessionLocal, init_db
from app.models import Creator, FaceReference, VoiceReference


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--name", required=True)
    parser.add_argument("--email", required=True)
    parser.add_argument("--photos", nargs="+", required=True, help="1-3 reference photo paths")
    parser.add_argument("--voice", required=True, help="~10s voice clip (wav/mp3)")
    args = parser.parse_args()

    if len(args.photos) > 3:
        parser.error("Provide at most 3 reference photos")

    init_db()
    db = SessionLocal()
    try:
        creator = db.query(Creator).filter_by(email=args.email).first()
        if creator is None:
            creator = Creator(name=args.name, email=args.email)
            db.add(creator)
            db.flush()
            print(f"Created creator #{creator.id}: {creator.name}")
        else:
            print(f"Using existing creator #{creator.id}: {creator.name}")

        creator_dir = settings.uploads_dir / f"creator_{creator.id}"
        (creator_dir / "faces").mkdir(parents=True, exist_ok=True)
        (creator_dir / "voice").mkdir(parents=True, exist_ok=True)

        for photo in args.photos:
            src = Path(photo)
            dest = creator_dir / "faces" / src.name
            shutil.copy2(src, dest)
            embedding = extract_face_embedding(dest)
            if embedding is None:
                print(f"  ! No face detected in {src.name}, skipping")
                dest.unlink(missing_ok=True)
                continue
            db.add(
                FaceReference(
                    creator_id=creator.id,
                    image_path=str(dest),
                    embedding=embedding,
                    model_name=settings.face_model_name,
                )
            )
            print(f"  + face reference: {src.name}")

        voice_src = Path(args.voice)
        voice_dest = creator_dir / "voice" / voice_src.name
        shutil.copy2(voice_src, voice_dest)
        voice_embedding = extract_voice_embedding(voice_dest)
        db.add(VoiceReference(creator_id=creator.id, audio_path=str(voice_dest), embedding=voice_embedding))
        print(f"  + voice reference: {voice_src.name}")

        db.commit()
        print("Enrollment complete.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
