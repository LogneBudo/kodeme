# Google Maps Setup Guide

This application uses Google Maps APIs for restaurant search and location display. Follow these steps to configure it:

## Required APIs

You need to enable the following APIs in your Google Cloud Console:

1. **Maps JavaScript API** - For the map interface
2. **Places API** - For restaurant search and autocomplete
3. **Maps Static API** - For location background images

## Setup Steps

### 1. Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > API Key**
5. Copy your API key

### 2. Enable Required APIs

1. Go to **APIs & Services > Library**
2. Search for and enable each of these APIs:
   - Maps JavaScript API
   - Places API
   - Maps Static API

### 3. Configure API Key Restrictions (Recommended)

For security, restrict your API key:

1. In the **Credentials** page, click on your API key
2. Under **API restrictions**, select **Restrict key**
3. Select only the APIs you need:
   - Maps JavaScript API
   - Places API
   - Maps Static API
4. Under **Website restrictions**, add your domain(s)

### 4. Add API Key to Your Project

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API key:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

3. Restart your development server

## Features

### Restaurant Search
- Searches restaurants specifically in the **Attiki region** of Greece
- Autocomplete suggestions as you type
- Automatically gets restaurant coordinates for map display

### Dynamic Backgrounds
- **Zoom Meeting**: Static professional meeting image
- **Your Premises**: Google Maps view updates when address is entered
- **Restaurant**: Google Maps view updates when restaurant is selected
- **Other Location**: Google Maps view updates when address is entered

### Map Views
- OpenStreetMap for interactive maps (free, no API key needed)
- Google Maps Static API for background images (requires API key)
- Satellite view toggle option

## Troubleshooting

### "Google Maps API key not configured" error
- Make sure you've created a `.env` file (not just `.env.example`)
- Verify your API key is correctly set in the `.env` file
- Restart your development server after changing `.env`

### Restaurant search not working
- Verify Places API is enabled in Google Cloud Console
- Check browser console for API errors
- Ensure your API key has Places API access

### Background images not loading
- Verify Maps Static API is enabled
- Check that your API key allows Maps Static API requests
- Look for CORS or network errors in browser console

## Cost Considerations

Google Maps APIs have free tiers with monthly credits:
- Maps JavaScript API: $200 free per month
- Places API: $200 free per month
- Maps Static API: $200 free per month

For typical usage, you should stay within the free tier. Monitor usage in Google Cloud Console.

## Development vs Production

For development, you can use the same API key. For production:

1. Create a separate API key
2. Add proper domain restrictions
3. Set up billing alerts in Google Cloud Console
4. Consider implementing request caching to reduce API calls
