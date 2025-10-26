# Email Setup for Page Sharing

This document explains how to set up email functionality for page sharing using Microsoft 365.

## Environment Variables

Add these variables to your `backend/.env` file:

```env
# Microsoft 365 Email Configuration
SMTP_HOST=outlook.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=no-reply@slatedraw.com
SMTP_PASS=your-app-password-here
FROM_EMAIL=no-reply@slatedraw.com
FROM_NAME=Slate Support
```

## Microsoft 365 Setup

### 1. Create App Password

1. Go to [Microsoft 365 Admin Center](https://admin.microsoft.com/)
2. Navigate to **Users** → **Active Users**
3. Select your `no-reply@slatedraw.com` account
4. Go to **Mail** → **Manage app passwords**
5. Create a new app password for "Slate Application"
6. Save the generated password securely
7. Use this password as `SMTP_PASS` in your environment variables

### 2. SMTP Settings

- **Host**: `outlook.office365.com`
- **Port**: `587`
- **Security**: `STARTTLS`
- **Authentication**: Username/Password

## Testing Email Delivery

1. Start your backend server
2. Share a page with an email address
3. Check the email delivery in the console logs
4. Verify the email arrives in the recipient's inbox

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify the app password is correct
   - Ensure the email account exists and is active

2. **Connection Timeout**
   - Check your network connection
   - Verify SMTP settings are correct

3. **Emails Not Delivered**
   - Check spam/junk folders
   - Verify the recipient email address is valid
   - Check Microsoft 365 sending limits

### Debug Mode

To enable detailed email logging, set:

```env
NODE_ENV=development
```

This will log email sending attempts and any errors to the console.

## Production Considerations

1. **Rate Limiting**: Microsoft 365 has sending limits
2. **Monitoring**: Set up email delivery monitoring
3. **Fallback**: Consider backup email service
4. **Security**: Use app passwords, never regular passwords
5. **Compliance**: Ensure GDPR/privacy compliance for email data
