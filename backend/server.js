import express from "express";
import cors from "cors";
import { Resend } from "resend";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env file in the backend directory
dotenv.config({ path: `${__dirname}/.env` });

const app = express();
const PORT = 3001;

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
