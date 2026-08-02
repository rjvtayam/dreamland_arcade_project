import smtplib
import imaplib
import email as email_lib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import decode_header
from email.utils import parsedate_to_datetime
import asyncio
import logging
import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from models.email import Email
from config import settings

logger = logging.getLogger(__name__)

_last_poll_time = None
_poll_task = None


def get_last_poll_time():
    global _last_poll_time
    return _last_poll_time


def set_last_poll_time(t):
    global _last_poll_time
    _last_poll_time = t


def _decode_header_value(header_val):
    if not header_val:
        return ""
    decoded_parts = decode_header(header_val)
    result = []
    for part, charset in decoded_parts:
        if isinstance(part, bytes):
            result.append(part.decode(charset or "utf-8", errors="replace"))
        else:
            result.append(part)
    return " ".join(result)


def send_smtp_email(to_email, subject, body, cc_email=None, in_reply_to_id=None, db=None, sender_id=None, branch_id=None):
    demo_mode = not settings.SMTP_USER or not settings.SMTP_PASSWORD

    if not demo_mode:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
        msg["To"] = to_email
        if cc_email:
            msg["Cc"] = cc_email
        msg["Subject"] = subject
        msg["X-Mailer"] = "Dreamland Arcade Mail System"

        if in_reply_to_id and db:
            original = db.query(Email).filter(Email.id == in_reply_to_id).first()
            if original and original.message_id:
                msg["In-Reply-To"] = original.message_id
                msg["References"] = original.message_id

        msg.attach(MIMEText(body, "html", "utf-8"))
        msg.attach(MIMEText(body, "plain", "utf-8"))

    try:
        if not demo_mode:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30)
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            recipients = [to_email]
            if cc_email:
                recipients.extend([addr.strip() for addr in cc_email.split(",")])
            server.sendmail(settings.SMTP_USER, recipients, msg.as_string())
            server.quit()

        email_record = None
        if db:
            email_record = Email(
                branch_id=branch_id,
                sender_id=sender_id,
                from_email=settings.SMTP_USER or "demo@dreamland.local",
                to_email=to_email,
                cc_email=cc_email,
                subject=subject,
                body=body,
                body_text=_strip_html(body),
                direction="outbound",
                status="sent" if not demo_mode else "demo",
                message_id=msg["Message-ID"] if not demo_mode else f"demo-{datetime.now(timezone.utc).timestamp()}",
                in_reply_to=in_reply_to_id,
                created_at=datetime.now(timezone.utc),
            )
            db.add(email_record)
            db.commit()
            db.refresh(email_record)

        logger.info(f"Email sent to {to_email}: {subject}" + (" [DEMO]" if demo_mode else ""))
        return email_record

    except Exception as e:
        logger.error(f"SMTP send failed: {e}")
        if db:
            email_record = Email(
                branch_id=branch_id,
                sender_id=sender_id,
                from_email=settings.SMTP_USER or "demo@dreamland.local",
                to_email=to_email,
                cc_email=cc_email,
                subject=subject,
                body=body,
                body_text=_strip_html(body),
                direction="outbound",
                status="failed",
                metadata_={"error": str(e)},
                created_at=datetime.now(timezone.utc),
            )
            db.add(email_record)
            db.commit()
            db.refresh(email_record)
            return email_record
        raise


def fetch_new_emails(db: Session):
    global _last_poll_time
    if not settings.IMAP_USER or not settings.IMAP_PASSWORD:
        return []

    new_emails = []
    try:
        mail = imaplib.IMAP4_SSL(settings.IMAP_HOST, settings.IMAP_PORT)
        mail.login(settings.IMAP_USER, settings.IMAP_PASSWORD)
        mail.select("INBOX")

        search_criteria = "UNSEEN"
        if _last_poll_time:
            date_str = _last_poll_time.strftime("%d-%b-%Y")
            search_criteria = f'(UNSEEN SINCE "{date_str}")'

        status, data = mail.search(None, search_criteria)
        if status != "OK":
            mail.logout()
            return []

        msg_ids = data[0].split()
        if not msg_ids:
            mail.logout()
            return []

        existing_ids = set()
        existing = db.query(Email.message_id).filter(
            Email.direction == "inbound",
            Email.message_id.isnot(None)
        ).all()
        for row in existing:
            if row.message_id:
                existing_ids.add(row.message_id)

        for msg_id in msg_ids:
            status, msg_data = mail.fetch(msg_id, "(RFC822)")
            if status != "OK":
                continue

            raw_email = msg_data[0][1]
            if isinstance(raw_email, bytes):
                raw_email = raw_email.decode("utf-8", errors="replace")

            mime_msg = email_lib.message_from_string(raw_email)

            message_id = mime_msg.get("Message-ID", "").strip("<>")
            if message_id in existing_ids:
                continue

            from_addr = email_lib.utils.parseaddr(mime_msg.get("From", ""))[1]
            to_addr = email_lib.utils.parseaddr(mime_msg.get("To", ""))[1]
            cc_addr = mime_msg.get("Cc", "")
            if cc_addr:
                cc_addr = email_lib.utils.parseaddr(cc_addr)[1]

            subject = _decode_header_value(mime_msg.get("Subject", ""))
            body_text = ""
            body_html = ""

            if mime_msg.is_multipart():
                for part in mime_msg.walk():
                    content_type = part.get_content_type()
                    if content_type == "text/plain" and not body_text:
                        body_text = part.get_payload(decode=True).decode(part.get_content_charset() or "utf-8", errors="replace")
                    elif content_type == "text/html" and not body_html:
                        body_html = part.get_payload(decode=True).decode(part.get_content_charset() or "utf-8", errors="replace")
            else:
                payload = mime_msg.get_payload(decode=True)
                if payload:
                    decoded = payload.decode(mime_msg.get_content_charset() or "utf-8", errors="replace")
                    if mime_msg.get_content_type() == "text/html":
                        body_html = decoded
                    else:
                        body_text = decoded

            body = body_html or body_text or ""
            date_str = mime_msg.get("Date")
            created_at = datetime.now(timezone.utc)
            if date_str:
                try:
                    created_at = parsedate_to_datetime(date_str)
                except Exception:
                    pass

            in_reply_to_id = None
            in_reply_to_header = mime_msg.get("In-Reply-To", "").strip("<>")
            if in_reply_to_header:
                original = db.query(Email).filter(Email.message_id == in_reply_to_header).first()
                if original:
                    in_reply_to_id = original.id

            email_record = Email(
                from_email=from_addr,
                to_email=to_addr or settings.IMAP_USER,
                cc_email=cc_addr if cc_addr else None,
                subject=subject,
                body=body or body_text,
                body_text=body_text,
                direction="inbound",
                status="received",
                message_id=message_id,
                in_reply_to=in_reply_to_id,
                created_at=created_at,
            )
            db.add(email_record)
            new_emails.append(email_record)

        if new_emails:
            db.commit()
            for e in new_emails:
                db.refresh(e)

        set_last_poll_time(datetime.now(timezone.utc))
        mail.logout()

    except Exception as e:
        logger.error(f"IMAP fetch failed: {e}")

    return new_emails


def _strip_html(html_text):
    import re
    clean = re.sub(r"<[^>]+>", " ", html_text)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean


async def start_imap_poller():
    global _poll_task
    if _poll_task and not _poll_task.done():
        return

    async def _poll_loop():
        from database import SessionLocal
        while True:
            try:
                if settings.IMAP_USER and settings.IMAP_PASSWORD:
                    db = SessionLocal()
                    try:
                        new_emails = fetch_new_emails(db)
                        if new_emails:
                            logger.info(f"Fetched {len(new_emails)} new email(s)")
                            _create_notifications_for_emails(db, new_emails)
                    finally:
                        db.close()
            except Exception as e:
                logger.error(f"IMAP poller error: {e}")
            await asyncio.sleep(settings.IMAP_POLL_INTERVAL)

    _poll_task = asyncio.create_task(_poll_loop())
    logger.info(f"IMAP poller started (interval: {settings.IMAP_POLL_INTERVAL}s)")


def _create_notifications_for_emails(db: Session, emails):
    from models.notification import Notification
    from models.user import User

    admins_and_owners = db.query(User).filter(
        User.is_active == True,
        User.role.in_(["owner", "admin"])
    ).all()

    for em in emails:
        for user in admins_and_owners:
            notif = Notification(
                user_id=user.id,
                branch_id=user.branch_id,
                title=f"New email from {em.from_email}",
                message=f"Subject: {em.subject or '(no subject)'}",
                type="email",
                link="#email",
                created_by=None,
            )
            db.add(notif)
    db.commit()
