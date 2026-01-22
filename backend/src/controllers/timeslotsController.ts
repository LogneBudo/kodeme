import * as svc from '../services/timeslotsService';
import { Request, Response } from 'express';

export async function listTimeSlots(req: Request, res: Response) {
  try {
    const data = await svc.listTimeSlots();
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message || 'Failed' }); }
}
export async function getTimeSlot(req: Request, res: Response) {
  try { const data = await svc.getTimeSlot(req.params.id); res.json(data); } catch (err) { res.status(500).json({ error: err.message || 'Failed' }); }
}
export async function createTimeSlot(req: Request, res: Response) {
  try { const data = await svc.createTimeSlot(req.body); res.json(data); } catch (err) { res.status(500).json({ error: err.message || 'Failed' }); }
}
export async function updateTimeSlot(req: Request, res: Response) {
  try { const data = await svc.updateTimeSlot(req.params.id, req.body); res.json(data); } catch (err) { res.status(500).json({ error: err.message || 'Failed' }); }
}
export async function deleteTimeSlot(req: Request, res: Response) {
  try { await svc.deleteTimeSlot(req.params.id); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message || 'Failed' }); }
}

// tenant-aware
export async function listTenantTimeSlots(req: Request, res: Response) {
  const { orgId, calendarId } = req.params;
  try { const data = await svc.listTenantTimeSlots(orgId, calendarId); res.json(data); } catch (err) { res.status(500).json({ error: err.message || 'Failed' }); }
}
export async function getTenantTimeSlot(req: Request, res: Response) {
  const { orgId, calendarId, id } = req.params;
  try { const data = await svc.getTenantTimeSlot(orgId, calendarId, id); res.json(data); } catch (err) { res.status(500).json({ error: err.message || 'Failed' }); }
}
export async function createTenantTimeSlot(req: Request, res: Response) {
  const { orgId, calendarId } = req.params;
  try { const data = await svc.createTenantTimeSlot(orgId, calendarId, req.body); res.json(data); } catch (err) { res.status(500).json({ error: err.message || 'Failed' }); }
}
export async function updateTenantTimeSlot(req: Request, res: Response) {
  const { orgId, calendarId, id } = req.params;
  try { const data = await svc.updateTenantTimeSlot(orgId, calendarId, id, req.body); res.json(data); } catch (err) { res.status(500).json({ error: err.message || 'Failed' }); }
}
export async function deleteTenantTimeSlot(req: Request, res: Response) {
  const { orgId, calendarId, id } = req.params;
  try { const ok = await svc.deleteTenantTimeSlot(orgId, calendarId, id); res.json({ success: ok }); } catch (err) { res.status(500).json({ error: err.message || 'Failed' }); }
}
