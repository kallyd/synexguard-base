import logging

from app.core.config import settings

logger = logging.getLogger("nodeguardian.notifiers")


def notify_discord(message: str) -> None:
    if not settings.discord_webhook_url:
        return
    logger.info("discord_notification", extra={"message": message})


def notify_slack(message: str) -> None:
    if not settings.slack_webhook_url:
        return
    logger.info("slack_notification", extra={"message": message})


def notify_telegram(message: str) -> None:
    if not settings.telegram_bot_token or not settings.telegram_chat_id:
        return
    logger.info("telegram_notification", extra={"message": message})


def notify_email(subject: str, body: str) -> None:
    if not settings.smtp_host:
        return
    logger.info("smtp_notification", extra={"subject": subject, "body": body})


def notify_webhook(url: str, payload: dict) -> None:
    if not url:
        return
    logger.info("webhook_notification", extra={"url": url, "payload": payload})
