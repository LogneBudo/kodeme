import express from "express";
import cors from "cors";
import { Resend } from "resend";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { google } from "googleapis";
import fs from "fs";
import path from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env file in the backend directory
dotenv.config({ path: `${__dirname}/.env` });

const app = express();
const PORT = 3001;

// Token storage file path
const TOKEN_FILE = path.join(__dirname, ".google-tokens.json");
const OUTLOOK_TOKEN_FILE = path.join(__dirname, ".outlook-tokens.json");

// Google OAuth client (initialized lazily)
const getOAuthClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:5173/auth/google/callback";

  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in backend .env");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

// Microsoft OAuth configuration
const getMicrosoftAuthUrl = () => {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI || "http://localhost:5173/auth/outlook/callback";
  const scopes = ["Calendars.ReadWrite", "offline_access"];
  
  if (!clientId) {
    throw new Error("Missing MICROSOFT_CLIENT_ID in backend .env");
  }
  
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: scopes.join(" "),
    response_mode: "query",
  });
  
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
};

// Token storage (file-based for persistence)
function loadTokens() {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const data = fs.readFileSync(TOKEN_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn("⚠️  Failed to load tokens from file:", error.message);
  }
  return null;
}

function saveTokens(tokens) {
  try {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
    console.log("✅ Tokens saved to file");
  } catch (error) {
    console.error("❌ Failed to save tokens:", error.message);
  }
}

function loadOutlookTokens() {
  try {
    if (fs.existsSync(OUTLOOK_TOKEN_FILE)) {
      const data = fs.readFileSync(OUTLOOK_TOKEN_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn("⚠️  Failed to load Outlook tokens from file:", error.message);
  }
  return null;
}

function saveOutlookTokens(tokens) {
  try {
    fs.writeFileSync(OUTLOOK_TOKEN_FILE, JSON.stringify(tokens, null, 2));
    console.log("✅ Outlook tokens saved to file");
  } catch (error) {
    console.error("❌ Failed to save Outlook tokens:", error.message);
  }
}

// Load tokens on startup
let googleTokens = loadTokens();
let outlookTokens = loadOutlookTokens();

// Initialize Resend client
const resend = new Resend(process.env.RESEND_[REMOVED]);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow localhost for development
    if (!origin || origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return callback(null, true);
    }
    // Allow all Vercel preview and production URLs
    if (origin.includes("vercel.app")) {
      return callback(null, true);
    }
    // For other origins, log and block
    console.warn(`⚠️  CORS rejected origin: ${origin}`);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json());

// --- Google OAuth & Calendar routes ---
app.get("/auth/google/init", (req, res) => {
  try {
    const oauth2Client = getOAuthClient();
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar.events",
      ],
    });
    res.json({ url });
  } catch (error) {
    console.error("/auth/google/init error", error);
    res.status(500).json({ error: error.message || "Failed to start Google OAuth" });
  }
});

app.get("/auth/google/callback", async (req, res) => {
  try {
    const { code, error: oauthError } = req.query;
    
    // Check if Google returned an error (e.g., user denied)
    if (oauthError) {
      console.error("Google OAuth error:", oauthError);
      return res.redirect(`http://localhost:5173/admin/settings?error=${oauthError}`);
    }
    
    if (!code) {
      console.error("Missing authorization code");
      return res.redirect(`http://localhost:5173/admin/settings?error=missing_code`);
    }

    console.log("🔄 Exchanging code for tokens...");
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    googleTokens = tokens;
    saveTokens(tokens);

    console.log("✅ Google OAuth successful, tokens stored");
    console.log("   Access token:", tokens.access_token ? "✓" : "✗");
    console.log("   Refresh token:", tokens.refresh_token ? "✓" : "✗");
    
    // Redirect back to admin with success
    return res.redirect(`http://localhost:5173/admin/settings?calendar=connected&provider=google`);
  } catch (error) {
    console.error("❌ /auth/google/callback error:", error);
    console.error("   Message:", error.message);
    console.error("   Stack:", error.stack);
    return res.redirect(`http://localhost:5173/admin?error=callback_failed&message=${encodeURIComponent(error.message)}`);
  }
});

// --- Outlook OAuth & Calendar routes ---
app.get("/auth/outlook/init", (req, res) => {
  try {
    const url = getMicrosoftAuthUrl();
    res.json({ url });
  } catch (error) {
    console.error("/auth/outlook/init error", error);
    res.status(500).json({ error: error.message || "Failed to start Outlook OAuth" });
  }
});

app.get("/auth/outlook/callback", async (req, res) => {
  try {
    const { code, error: oauthError } = req.query;
    
    if (oauthError) {
      console.error("Outlook OAuth error:", oauthError);
      return res.redirect(`http://localhost:5173/admin/settings?error=${oauthError}&provider=outlook`);
    }
    
    if (!code) {
      console.error("Missing authorization code");
      return res.redirect(`http://localhost:5173/admin/settings?error=missing_code&provider=outlook`);
    }

    console.log("🔄 Exchanging code for Outlook tokens...");
    
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI || "http://localhost:5173/auth/outlook/callback";
    
    if (!clientId || !clientSecret) {
      throw new Error("Missing MICROSOFT_CLIENT_ID or MICROSOFT_CLIENT_SECRET in backend .env");
    }
    
    const tokenUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });
    
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    
    const tokens = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      throw new Error(tokens.error_description || "Failed to get tokens");
    }
    
    outlookTokens = tokens;
    saveOutlookTokens(tokens);
    
    console.log("✅ Outlook connected successfully");
    return res.redirect(`http://localhost:5173/admin/settings?calendar=connected&provider=outlook`);
  } catch (error) {
    console.error("❌ /auth/outlook/callback error:", error);
    console.error("   Message:", error.message);
    return res.redirect(`http://localhost:5173/admin/settings?error=callback_failed&message=${encodeURIComponent(error.message)}&provider=outlook`);
  }
});

app.get("/api/calendar/status", (req, res) => {
  // Check if calendars are connected (tokens exist)
  const isConnected = !!googleTokens;
  const isOutlookConnected = !!outlookTokens;
  res.json({ 
    connected: isConnected, 
    outlookConnected: isOutlookConnected 
  });
});

app.post("/api/calendar/events", async (req, res) => {
  try {
    if (!googleTokens) {
      return res.status(401).json({ error: "Google not connected yet" });
    }

    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate are required" });
    }

    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials(googleTokens);

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date(startDate).toISOString(),
      timeMax: new Date(endDate).toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    // Normalize events (handle both timed and all-day events)
    const events = (response.data.items || []).map((evt) => {
      // For all-day events, Google returns only 'date' field (YYYY-MM-DD)
      // For timed events, Google returns 'dateTime' field (ISO 8601)
      const startTime = evt.start?.dateTime || evt.start?.date;
      const endTime = evt.end?.dateTime || evt.end?.date;
      
      return {
        id: evt.id,
        title: evt.summary || "Busy",
        startTime: startTime,
        endTime: endTime,
        provider: "google",
        isAllDay: !evt.start?.dateTime, // True if only date field exists
      };
    });

    res.json({ events });
  } catch (error) {
    console.error("/api/calendar/events error", error);
    res.status(500).json({ error: error.message || "Failed to fetch calendar events" });
  }
});

// Debug: Log configuration
console.log("📧 Email Configuration:");
console.log(`   Provider: Resend`);
console.log(`   API Key configured: ${!!process.env.RESEND_[REMOVED]}`);
console.log(`   From Email: ${process.env.RESEND_[REMOVED] || "noreply@resend.dev"}`);
// Root endpoint
app.get("/", (req, res) => {
  res.json({ status: "OK", message: "Appointments API is running" });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Backend server is running" });
});

// Send booking confirmation email
app.post("/api/send-booking-confirmation", async (req, res) => {
  try {
    const { email, appointment, icsContent } = req.body;

    if (!email || !appointment || !icsContent) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: email, appointment, icsContent",
      });
    }

    // Create email content
    const emailContent = `
Hello,

Your appointment has been successfully booked!

Appointment Details:
- Date: ${appointment.date}
- Time: ${appointment.time}
- Location Type: ${appointment.location_type}
${appointment.location_details ? `- Location: ${appointment.location_details}` : ""}

Your calendar file (ICS) is attached. You can import it into your calendar application.

Thank you for booking with us!

Best regards,
The Appointments Team
    `;

    // Send email using Resend with ICS attachment
    const response = await resend.emails.send({
      from: process.env.RESEND_[REMOVED] || "noreply@resend.dev",
      to: email,
      subject: "Appointment Confirmation",
      html: `<pre>${emailContent}</pre>`,
      attachments: [
        {
          filename: `appointment-${appointment.id}.ics`,
          content: Buffer.from(icsContent),
        },
      ],
    });

    if (response.error) {
      throw new Error(response.error.message || "Failed to send email");
    }

    console.log(`✓ Confirmation email sent to ${email}`);
    res.json({
      success: true,
      message: "Email sent successfully",
      email: email,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to send email",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📧 Email service configured (Resend)`);
  console.log(`   API Key: ${process.env.RESEND_[REMOVED] ? "✓ Configured" : "✗ Missing"}`);
});
