import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_[REMOVED]);

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
      from: process.env.RESEND_[REMOVED] || "noreply@resend.dev",
      to: email,
      subject: "Appointment Confirmation",
      html: `<pre>${emailContent}</pre>`,
      attachments: [
        { filename: `appointment-${appointment.id}.ics`, content: Buffer.from(icsContent) },
      ],
    });

    if ((response as any).error) throw new Error((response as any).error.message || "Failed to send email");
    return res.json({ success: true, message: "Email sent successfully", email });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return res.status(500).json({ success: false, error: error?.message || "Failed to send email" });
  }
}
