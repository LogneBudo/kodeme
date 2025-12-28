# Quick Start - Location Feature with Restaurant Search

## 🎯 What's New

Your location booking step now has:
- ✅ **Restaurant search** restricted to Attiki region, Greece
- ✅ **Dynamic backgrounds** that update based on selected location
- ✅ **Google Maps integration** for address visualization

## 🚀 Getting Started

### Step 1: Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Maps Static API
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy your API key

### Step 2: Configure Your Project

1. Create `.env` file from template:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API key:
   ```
   VITE_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

3. Restart the dev server:
   ```bash
   npm run dev
   ```

### Step 3: Test It Out

1. Open http://localhost:5173
2. Navigate to booking page
3. Select location type:

**Try "Restaurant":**
- Type "Varoulko" or "Spondi" or "GB Roof Garden"
- See autocomplete suggestions
- Click a restaurant
- Watch background update to show restaurant location on map

**Try "Your Premises":**
- Enter an address like "Syntagma Square, Athens"
- See background update to show the location

**Try "Zoom":**
- See static professional meeting background

## 📱 How It Works

### Location Types & Backgrounds

| Location Type | Initial Background | After Selection |
|--------------|-------------------|-----------------|
| Zoom Meeting | Static meeting photo | (unchanged) |
| Your Premises | Office placeholder | Google Maps view of address |
| Restaurant | Restaurant placeholder | Google Maps view of restaurant |
| Other Location | Generic placeholder | Google Maps view of address |

### Restaurant Search Details

- **Region**: Attiki (Athens metropolitan area)
- **Type**: Restaurants only
- **Country**: Greece only
- **Real-time**: Suggestions appear as you type
- **Automatic**: Coordinates extracted when selected

## 🎨 Visual Experience

```
┌─────────────────────────────────────┐
│                                     │
│     [Background Image Preview]      │
│     (Updates dynamically)           │
│                                     │
└─────────────────────────────────────┘

Where should we meet?
Choose your preferred meeting location

┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ Zoom │ │Office│ │Rest. │ │Other │
└──────┘ └──────┘ └──────┘ └──────┘

[If Restaurant selected]
┌─────────────────────────────────────┐
│ 🔍  e.g., Varoulko, GB Roof...     │
└─────────────────────────────────────┘
  ↓ (suggestions appear)
  • Varoulko - Piraeus  
  • GB Roof Garden - Athens
  • ...
```

## ⚠️ Important Notes

### Without API Key
- App will work but with warnings in console
- Restaurant search won't function
- Background images won't show Google Maps views
- Placeholder images will remain

### With API Key
- Full functionality enabled
- Restaurant search works
- Dynamic backgrounds appear
- Smooth user experience

## 🔧 Troubleshooting

**Can't find restaurants?**
- Make sure you enabled Places API
- Try broader search terms (e.g., "restaurant Athens" instead of full name)
- Search is limited to Attiki region

**Background not updating?**
- Check if Maps Static API is enabled
- Look for errors in browser console (F12)
- Verify API key in `.env` file

**"Google Maps API key not configured"?**
- Make sure `.env` file exists (not just `.env.example`)
- Restart dev server after creating `.env`
- Check spelling of `VITE_GOOGLE_MAPS_API_KEY`

## 📚 More Information

- **Detailed Setup**: See `GOOGLE_MAPS_SETUP.md`
- **Implementation Details**: See `LOCATION_FEATURE.md`
- **API Costs**: Free tier covers typical usage (~$200/month credit)

## 🎉 Ready to Test!

The dev server is running at http://localhost:5173

Try booking an appointment and explore the new location features!
