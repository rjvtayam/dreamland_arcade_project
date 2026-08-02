import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timezone, timedelta
from database import SessionLocal
from models.email import Email
from models.user import User

db = SessionLocal()

owner = db.query(User).filter(User.role == "owner").first()
admin = db.query(User).filter(User.role == "admin").first()

if not owner:
    print("No owner user found. Create users first.")
    sys.exit(1)

demo_emails = [
    {
        "from_email": "supplier@arcadeequip.ph",
        "to_email": "dreamlandarcade2026@gmail.com",
        "subject": "Quotation for New Claw Machine Units",
        "body": "<div style='font-family:Arial,sans-serif;line-height:1.6;'><p>Good day!</p><p>Thank you for your inquiry about our latest claw machine models. Please find attached the quotation for 5 units of the Dream Catcher Pro series.</p><p><strong>Pricing:</strong></p><ul><li>Dream Catcher Pro (Standard) - ₱45,000/unit</li><li>Dream Catcher Pro (LED Edition) - ₱55,000/unit</li><li>Dream Catcher Pro (Deluxe) - ₱65,000/unit</li></ul><p>Delivery lead time: 2-3 weeks upon order confirmation.</p><p>Best regards,<br>Marco Reyes<br>Arcade Equipment Solutions</p></div>",
        "body_text": "Good day! Thank you for your inquiry about our latest claw machine models. Pricing: Dream Catcher Pro Standard ₱45,000/unit, LED Edition ₱55,000/unit, Deluxe ₱65,000/unit. Delivery 2-3 weeks.",
        "direction": "inbound",
        "status": "received",
        "created_at": datetime.now(timezone.utc) - timedelta(days=2),
    },
    {
        "from_email": "dreamlandarcade2026@gmail.com",
        "to_email": "supplier@arcadeequip.ph",
        "subject": "Re: Quotation for New Claw Machine Units",
        "body": "<div style='font-family:Arial,sans-serif;line-height:1.6;'><p>Hi Marco,</p><p>Thank you for the quotation. We are interested in 3 units of the LED Edition. Can you provide a bulk discount for 3+ units?</p><p>Also, do you offer installation and training services?</p><p>Best,<br>Dreamland Arcade Management</p></div>",
        "body_text": "Hi Marco, interested in 3 units LED Edition. Bulk discount available? Installation and training? Best, Dreamland Arcade Management.",
        "direction": "outbound",
        "status": "sent",
        "sender_id": owner.id,
        "created_at": datetime.now(timezone.utc) - timedelta(days=1, hours=6),
    },
    {
        "from_email": "supplier@arcadeequip.ph",
        "to_email": "dreamlandarcade2026@gmail.com",
        "subject": "Re: Re: Quotation for New Claw Machine Units",
        "body": "<div style='font-family:Arial,sans-serif;line-height:1.6;'><p>Good day!</p><p>Yes, we offer a 10% bulk discount for orders of 3+ units. Installation and basic operator training are included free of charge.</p><p>Shall we proceed with 3 units of the LED Edition at ₱49,500/unit (after discount)?</p><p>Total: ₱148,500</p><p>Looking forward to your confirmation.</p><p>Best regards,<br>Marco Reyes</p></div>",
        "body_text": "Yes, 10% bulk discount for 3+ units. Installation and training included free. 3x LED Edition at ₱49,500/unit. Total ₱148,500.",
        "direction": "inbound",
        "status": "received",
        "created_at": datetime.now(timezone.utc) - timedelta(hours=18),
    },
    {
        "from_email": "hr@dreamlandarcade.com",
        "to_email": "dreamlandarcade2026@gmail.com",
        "subject": "Monthly Payroll Report - July 2026",
        "body": "<div style='font-family:Arial,sans-serif;line-height:1.6;'><p>Dear Management,</p><p>Please find the summary for July 2026 payroll:</p><p><strong>Total Employees:</strong> 8<br><strong>Regular Days:</strong> 26<br><strong>Total Gross Pay:</strong> ₱124,500<br><strong>Total Deductions:</strong> ₱12,450<br><strong>Net Pay:</strong> ₱112,050</p><p>Payroll will be processed on August 5, 2026.</p><p>Thank you.</p></div>",
        "body_text": "July 2026 payroll: 8 employees, ₱124,500 gross, ₱12,450 deductions, ₱112,050 net. Processed Aug 5.",
        "direction": "inbound",
        "status": "received",
        "created_at": datetime.now(timezone.utc) - timedelta(hours=8),
    },
    {
        "from_email": "dreamlandarcade2026@gmail.com",
        "to_email": "team@dreamlandarcade.com",
        "subject": "August 2026 Promo Launch Announcement",
        "body": "<div style='font-family:Arial,sans-serif;line-height:1.6;'><p>Hi Team,</p><p>Great news! The August 2026 promotions have been approved by the owner. Here is a summary:</p><ul><li><strong>Arcade:</strong> 10% Student Discount, Senior/PWD 20% Discount, Stick Catcher Challenge, Claw Machine Hunt, Loyalty Card Program</li><li><strong>Playhouse:</strong> Weekend PWD Discount, Bring Me Challenge</li><li><strong>Cafe:</strong> Standard operations, no special promos</li></ul><p>Please review the full proposal in the Proposals section for complete details and budget allocations.</p><p>Let's make August a great month!</p><p>Best,<br>Dreamland Arcade Management</p></div>",
        "body_text": "August promos approved! Arcade: student discount, PWD discount, challenges, loyalty. Playhouse: weekend PWD, Bring Me. Cafe: standard.",
        "direction": "outbound",
        "status": "sent",
        "sender_id": owner.id,
        "created_at": datetime.now(timezone.utc) - timedelta(hours=4),
    },
    {
        "from_email": "insurer@futuregeneral.com.ph",
        "to_email": "dreamlandarcade2026@gmail.com",
        "subject": "Insurance Renewal Reminder - Dreamland Arcade",
        "body": "<div style='font-family:Arial,sans-serif;line-height:1.6;'><p>Dear Dreamland Arcade,</p><p>This is a friendly reminder that your commercial property insurance policy <strong>#FGI-2025-DA-0847</strong> is due for renewal on <strong>September 15, 2026</strong>.</p><p><strong>Policy Details:</strong></p><ul><li>Coverage: Commercial Property + Business Interruption</li><li>Insured Value: ₱5,000,000</li><li>Premium: ₱35,000/year</li></ul><p>Please confirm renewal at your earliest convenience.</p><p> Regards,<br>Future General Insurance Corp.</p></div>",
        "body_text": "Insurance policy #FGI-2025-DA-0847 due for renewal Sept 15, 2026. Coverage ₱5M, premium ₱35,000/year.",
        "direction": "inbound",
        "status": "received",
        "created_at": datetime.now(timezone.utc) - timedelta(hours=2),
    },
]

for edata in demo_emails:
    existing = db.query(Email).filter(
        Email.subject == edata["subject"],
        Email.direction == edata["direction"],
    ).first()
    if existing:
        print(f"  Skip (exists): {edata['subject'][:50]}")
        continue

    em = Email(
        branch_id=admin.branch_id if admin else 1,
        sender_id=edata.get("sender_id"),
        from_email=edata["from_email"],
        to_email=edata["to_email"],
        subject=edata["subject"],
        body=edata["body"],
        body_text=edata["body_text"],
        direction=edata["direction"],
        status=edata["status"],
        created_at=edata["created_at"],
    )
    db.add(em)
    print(f"  Created: [{edata['direction']}] {edata['subject'][:50]}")

db.commit()
db.close()
print("\nDemo emails seeded successfully!")
