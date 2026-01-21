import { Request, Response } from 'express';
import { sendBookingConfirmationEmail } from '../services/bookingConfirmationService';

/**
 * @openapi
 * /api/booking-confirmation:
 *   post:
 *     summary: Send booking confirmation email (ICS)
 *     tags:
 *       - booking
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingConfirmationRequest'
 *     responses:
 *       '200':
 *         description: Result object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingConfirmationResponse'
 */
export const sendBookingConfirmation = async (req: Request, res: Response) => {
  // TODO: Move logic from api/send-booking-confirmation.ts here
  res.json({ message: 'Booking confirmation sent (placeholder)' });
};

/**
 * @openapi
 * /api/booking-confirmation:
 *   post:
 *     summary: Send booking confirmation email (ICS)
 *     tags:
 *       - booking
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingConfirmationRequest'
 *     responses:
 *       '200':
 *         description: Result object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingConfirmationResponse'
 */

export const postBookingConfirmation = async (req: Request, res: Response) => {
  const { email, appointment, icsContent } = req.body;
  if (!email || !appointment || !icsContent) {
    return res.status(400).json({ error: 'Missing required fields: email, appointment, icsContent' });
  }
  try {
    const result = await sendBookingConfirmationEmail(email, appointment, icsContent);
    res.json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};
