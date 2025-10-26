import nodemailer from 'nodemailer';
import type { IPage } from '../models/Page';
import type { IUser } from '../models/User';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'outlook.office365.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'no-reply@slatedraw.com',
        pass: process.env.SMTP_PASS || '',
      },
    };

    this.transporter = nodemailer.createTransport(config);
  }

  private async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection verification failed:', error);
      return false;
    }
  }

  async sendPageShareInvitation(
    recipientEmail: string,
    page: IPage,
    sender: IUser,
    invitationToken: string
  ): Promise<void> {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    const isConnected = await this.verifyConnection();
    if (!isConnected) {
      throw new Error('Email service connection failed');
    }

    const acceptUrl = `${process.env.FRONTEND_URL}/shared-page/${invitationToken}`;
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const mailOptions = {
      from: {
        name: process.env.FROM_NAME || 'Slate Support',
        address: process.env.FROM_EMAIL || 'no-reply@slatedraw.com',
      },
      to: recipientEmail,
      subject: `${sender.displayName} shared a page with you on Slate`,
      html: this.generateInvitationEmailHTML(
        sender.displayName,
        page.title,
        acceptUrl,
        appUrl
      ),
      text: this.generateInvitationEmailText(
        sender.displayName,
        page.title,
        acceptUrl,
        appUrl
      ),
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Page share invitation sent:', result.messageId);
    } catch (error) {
      console.error('Failed to send page share invitation:', error);
      throw new Error('Failed to send invitation email');
    }
  }

  async sendShareAcceptedNotification(
    senderEmail: string,
    pageTitle: string,
    recipientName: string
  ): Promise<void> {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    const mailOptions = {
      from: {
        name: process.env.FROM_NAME || 'Slate Support',
        address: process.env.FROM_EMAIL || 'no-reply@slatedraw.com',
      },
      to: senderEmail,
      subject: `${recipientName} accepted your shared page`,
      html: this.generateAcceptedEmailHTML(recipientName, pageTitle),
      text: this.generateAcceptedEmailText(recipientName, pageTitle),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Share accepted notification sent');
    } catch (error) {
      console.error('Failed to send share accepted notification:', error);
      // Don't throw error for notifications - they're not critical
    }
  }

  private generateInvitationEmailHTML(
    senderName: string,
    pageTitle: string,
    acceptUrl: string,
    appUrl: string
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Shared with You</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 30px; }
    .page-info { background: #f8fafc; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .page-title { font-size: 20px; font-weight: 600; color: #1a202c; margin: 0 0 10px 0; }
    .page-meta { color: #718096; font-size: 14px; margin: 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; transition: transform 0.2s; }
    .cta-button:hover { transform: translateY(-2px); }
    .footer { background: #f8fafc; padding: 30px; text-align: center; color: #718096; font-size: 14px; }
    .footer a { color: #667eea; text-decoration: none; }
    .divider { height: 1px; background: #e2e8f0; margin: 30px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📓 Slate</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Collaborative Notebook Application</p>
    </div>
    
    <div class="content">
      <h2 style="margin: 0 0 20px 0; color: #1a202c;">You've been invited to view a page!</h2>
      
      <p style="margin: 0 0 20px 0; font-size: 16px;">
        <strong>${senderName}</strong> has shared a page with you on Slate. 
        You can now access this page in your "Shared" notebook.
      </p>
      
      <div class="page-info">
        <div class="page-title">📄 ${pageTitle}</div>
        <p class="page-meta">Shared by ${senderName}</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${acceptUrl}" class="cta-button">View Shared Page</a>
      </div>
      
      <div class="divider"></div>
      
      <p style="margin: 0; font-size: 14px; color: #718096;">
        If you don't have a Slate account yet, clicking the button above will guide you through 
        creating one. The shared page will be automatically added to your "Shared" notebook.
      </p>
    </div>
    
    <div class="footer">
      <p style="margin: 0 0 10px 0;">
        This invitation was sent from <a href="${appUrl}">Slate</a>
      </p>
      <p style="margin: 0; font-size: 12px;">
        If you didn't expect this invitation, you can safely ignore this email.
      </p>
    </div>
  </div>
</body>
</html>`;
  }

  private generateInvitationEmailText(
    senderName: string,
    pageTitle: string,
    acceptUrl: string,
    appUrl: string
  ): string {
    return `
Slate - Page Shared with You

${senderName} has shared a page with you on Slate.

Page: ${pageTitle}
Shared by: ${senderName}

To view this page, click the link below:
${acceptUrl}

If you don't have a Slate account yet, clicking the link above will guide you through creating one. The shared page will be automatically added to your "Shared" notebook.

This invitation was sent from ${appUrl}

If you didn't expect this invitation, you can safely ignore this email.
`;
  }

  private generateAcceptedEmailHTML(recipientName: string, pageTitle: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Share Accepted</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 30px; }
    .success-icon { text-align: center; font-size: 48px; margin: 20px 0; }
    .footer { background: #f8fafc; padding: 30px; text-align: center; color: #718096; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Share Accepted</h1>
    </div>
    
    <div class="content">
      <div class="success-icon">🎉</div>
      
      <h2 style="margin: 0 0 20px 0; color: #1a202c; text-align: center;">
        Great news!
      </h2>
      
      <p style="margin: 0 0 20px 0; font-size: 16px; text-align: center;">
        <strong>${recipientName}</strong> has accepted your shared page:
      </p>
      
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; text-align: center;">
        <div style="font-size: 18px; font-weight: 600; color: #166534; margin: 0;">
          📄 ${pageTitle}
        </div>
      </div>
      
      <p style="margin: 20px 0 0 0; font-size: 14px; color: #718096; text-align: center;">
        The page is now available in their "Shared" notebook and they can view and edit it based on the permissions you set.
      </p>
    </div>
    
    <div class="footer">
      <p style="margin: 0;">
        This notification was sent from <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="color: #10b981;">Slate</a>
      </p>
    </div>
  </div>
</body>
</html>`;
  }

  private generateAcceptedEmailText(recipientName: string, pageTitle: string): string {
    return `
Slate - Share Accepted

Great news! ${recipientName} has accepted your shared page:

${pageTitle}

The page is now available in their "Shared" notebook and they can view and edit it based on the permissions you set.

This notification was sent from Slate.
`;
  }
}

// Export singleton instance
export const emailService = new EmailService();

