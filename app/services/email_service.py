import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import Config

def send_otp_email(to_email: str, otp: str, purpose: str):
    subject_map = {
        'verify_email': 'Verify Your Email — Finance Dashboard',
        'reset_password': 'Reset Your Password — Finance Dashboard'
    }
    body_map = {
        'verify_email': f"""
            <h2>Email Verification</h2>
            <p>Your verification code is:</p>
            <h1 style="letter-spacing:8px;color:#6366f1">{otp}</h1>
            <p>This code expires in 10 minutes.</p>
            <p>If you did not register, ignore this email.</p>
        """,
        'reset_password': f"""
            <h2>Password Reset</h2>
            <p>Your password reset code is:</p>
            <h1 style="letter-spacing:8px;color:#6366f1">{otp}</h1>
            <p>This code expires in 10 minutes.</p>
            <p>If you did not request this, ignore this email.</p>
        """
    }
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject_map.get(purpose, 'Notification — Finance Dashboard')
    msg['From'] = Config.GMAIL_ADDRESS
    msg['To'] = to_email
    msg.attach(MIMEText(body_map.get(purpose, f"OTP: {otp}"), 'html'))

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(Config.GMAIL_ADDRESS, Config.GMAIL_APP_PASSWORD)
            server.sendmail(Config.GMAIL_ADDRESS, to_email, msg.as_string())
    except Exception as e:
        print(f"Error sending email: {e}")
        # Depending on environment, we might want to throw or log this explicitly.
