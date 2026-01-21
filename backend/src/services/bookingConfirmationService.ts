import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface Appointment {
  id: string | number;
  date: string;
  time: string;
  location_type: string;
  location_details?: string;
}

export async function sendBookingConfirmationEmail(email: string, appointment: Appointment, icsContent: string) {
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

  // If the response type is not known, you may want to define a type for it as well.
  if ((response as { error?: { message?: string } }).error) {
    throw new Error((response as { error?: { message?: string } }).error?.message || "Failed to send email");
  }
  return { success: true, message: "Email sent successfully", email };
}
