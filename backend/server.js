import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = 3001;

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

// Debug: Log credentials (mask password)
console.log("📧 Email Configuration:");
console.log(`   User: ${process.env.EMAIL_USER}`);
console.log(`   Password length: ${(process.env.EMAIL_PASSWORD || "").length} characters`);
console.log(`   Password (masked): ${(process.env.EMAIL_PASSWORD || "").substring(0, 4)}${"*".repeat(Math.max(0, (process.env.EMAIL_PASSWORD || "").length - 4))}`);

// Configure email transporter for Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
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

    // Send email with ICS attachment
    const mailOptions = {
      from: process.env.EMAIL_USER || "appointments@example.com",
      to: email,
      subject: "Appointment Confirmation",
      text: emailContent,
      html: `<pre>${emailContent}</pre>`,
      attachments: [
        {
          filename: `appointment-${appointment.id}.ics`,
          content: icsContent,
          contentType: "text/calendar",
        },
      ],
    };

    await transporter.sendMail(mailOptions);

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
  console.log(`📧 Email service configured`);
  console.log(`   User: ${process.env.EMAIL_USER || "Not configured"}`);
});
