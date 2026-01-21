import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method not allowed" });
    const { email, appointment, icsContent } = req.body || {};
    if (!email || !appointment || !icsContent) {
      return res.status(400).json({ success: false, error: "Missing required fields: email, appointment, icsContent" });
    }

    const emailContent = `
Hello,

Your appointment has been successfully booked!

Appointment Details:
- Date: ${appointment.date}
- Time: ${appointment.time}
- Location Type: ${appointment.location_type}
${appointment.location_details ? `- Location: ${appointment.location_details}` : ""}

Your calendar file (ICS) is attached.

Best regards,
The Appointments Team
    `;

    const response = await resend.emails.send({
      from: process.env.RESEND_API_KEY || "noreply@resend.dev",
      to: email,
      subject: "Appointment Confirmation",
      html: `<pre>${emailContent}</pre>`,
      attachments: [
        { filename: `appointment-${appointment.id}.ics`, content: Buffer.from(icsContent) },
      ],
    });

    // Type guard for error property
    if (typeof response === "object" && response !== null && "error" in response && response.error) {
      const errorMessage = (response as { error: { message?: string } }).error.message || "Failed to send email";
      throw new Error(errorMessage);
    }
    return res.json({ success: true, message: "Email sent successfully", email });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ success: false, error: (error as Error)?.message || "Failed to send email" });
  }
}
