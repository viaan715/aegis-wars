"""Alert delivery: webhook + email. Both are best-effort side channels —
the Alert row in the database is the source of truth, so a failed
notification never loses an alert, it just gets seen on the dashboard
instead."""

from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage

import requests

from app.config import settings
from app.models import Alert, Creator

logger = logging.getLogger(__name__)


def notify(alert: Alert, creator: Creator, video_title: str, video_url: str) -> None:
    _send_webhook(alert, creator, video_title, video_url)
    _send_email(alert, creator, video_title, video_url)


def _send_webhook(alert: Alert, creator: Creator, video_title: str, video_url: str) -> None:
    if not settings.alert_webhook_url:
        return
    payload = {
        "creator": creator.name,
        "match_type": alert.match_type.value,
        "similarity": alert.similarity,
        "threshold": alert.threshold,
        "video_title": video_title,
        "video_url": video_url,
        "timestamp_seconds": alert.timestamp_seconds,
    }
    try:
        requests.post(settings.alert_webhook_url, json=payload, timeout=10)
    except requests.RequestException:
        logger.exception("Alert webhook delivery failed for alert %s", alert.id)


def _send_email(alert: Alert, creator: Creator, video_title: str, video_url: str) -> None:
    if not (settings.smtp_host and settings.alert_email_from):
        return

    msg = EmailMessage()
    msg["Subject"] = f"Possible {alert.match_type.value} clone detected: {creator.name}"
    msg["From"] = settings.alert_email_from
    msg["To"] = creator.email
    msg.set_content(
        f"A possible {alert.match_type.value} match was found for {creator.name}.\n\n"
        f"Video: {video_title}\n{video_url}\n"
        f"Similarity: {alert.similarity:.2f} (threshold {alert.threshold:.2f})\n"
        f"Timestamp in video: {alert.timestamp_seconds:.1f}s\n\n"
        "This is an automated alert. Please review the evidence in your "
        "dashboard before taking any action — biometric matching can "
        "produce false positives."
    )

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            if settings.smtp_username and settings.smtp_password:
                server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(msg)
    except (smtplib.SMTPException, OSError):
        logger.exception("Alert email delivery failed for alert %s", alert.id)
