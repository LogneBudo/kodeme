# Outlook Calendar Integration Setup

This guide explains how to set up Outlook Calendar integration for your appointment booking system.

## Prerequisites

- A Microsoft account (personal or work/school account)
- Access to Azure Portal (https://portal.azure.com)

## Step 1: Create Azure App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in the details:
   - **Name**: Your App Name (e.g., "Kodika Appointments")
   - **Supported account types**: Choose "Accounts in any organizational directory and personal Microsoft accounts"
   - **Redirect URI**: 
     - Platform: Web
     - URI: `http://localhost:5173/auth/outlook/callback` (for development)
     - For production, add your production URL (e.g., `https://yourdomain.com/auth/outlook/callback`)
5. Click **Register**

## Step 2: Configure API Permissions

1. In your app registration, go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Add these permissions:
   - `Calendars.ReadWrite` - Read and write user calendars
   - `offline_access` - Maintain access to data you have given it access to
6. Click **Add permissions**
7. Click **Grant admin consent** (if you have admin rights)

## Step 3: Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Add a description (e.g., "Kodika Backend Secret")
4. Choose an expiration period (recommended: 24 months)
5. Click **Add**
6. **IMPORTANT**: Copy the secret value immediately - it won't be shown again!

## Step 4: Configure Backend Environment Variables

Add these variables to your `backend/.env` file:

```env
# Microsoft OAuth Configuration
MICROSOFT_CLIENT_ID=your_application_client_id_here
MICROSOFT_CLIENT_SECRET=your_client_secret_value_here
MICROSOFT_REDIRECT_URI=http://localhost:5173/auth/outlook/callback
```

Replace:
- `your_application_client_id_here` with the **Application (client) ID** from your app registration Overview page
- `your_client_secret_value_here` with the secret value you copied in Step 3

## Step 5: Test the Integration

1. Restart your backend server: `cd backend && npm start`
2. Restart your frontend: `npm run dev`
3. Go to **Admin Settings** > **Calendar Integration**
4. Click **Connect Outlook Calendar**
5. Sign in with your Microsoft account
6. Grant the requested permissions
7. You should be redirected back to the settings page with a success message

## Production Deployment

For production:

1. Add your production redirect URI in Azure:
   - Go to your app registration > **Authentication**
   - Add redirect URI: `https://yourdomain.com/auth/outlook/callback`
2. Update `MICROSOFT_REDIRECT_URI` in your production environment variables
3. Update the redirect URLs in `backend/server.js` if needed (search for "http://localhost:5173")

## Troubleshooting

### "Redirect URI mismatch" error
- Make sure the redirect URI in Azure exactly matches the one in your `.env` file
- Check for trailing slashes - they must match exactly

### "Invalid client secret" error
- The secret may have expired - create a new one in Azure
- Make sure you copied the secret value (not the Secret ID)

### Permissions not granted
- Make sure you clicked "Grant admin consent" in API permissions
- Users may need to consent individually if admin consent wasn't granted

## Security Notes

- Never commit your `.env` file to version control
- Rotate client secrets periodically
- Use different app registrations for development and production
- Review and minimize API permissions regularly
