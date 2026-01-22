import * as svc from '../services/usersService';
import { Request, Response } from 'express';

export async function listUsers(req: Request, res: Response) {
  try {
    const data = await svc.listUsers();
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message || 'Failed' });
  }
}

export async function addUser(req: Request, res: Response) {
  try {
    const data = await svc.addUser(req.body);
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message || 'Failed' });
  }
}

export async function updateUserRole(req: Request, res: Response) {
  try {
    const ok = await svc.updateUserRole(req.params.id, req.body.role);
    res.json({ success: ok });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message || 'Failed' });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const ok = await svc.deleteUser(req.params.id);
    res.json({ success: ok });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message || 'Failed' });
  }
}

// tenant-aware
export async function listTenantUsers(req: Request, res: Response) {
  const { orgId } = req.params;
  try {
    const data = await svc.listTenantUsers(orgId);
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message || 'Failed' });
  }
}

export async function inviteUserToTenant(req: Request, res: Response) {
  const { orgId } = req.params;
  try {
    const { userId, branchAssignments } = req.body;
    await svc.inviteUserToTenant(userId, orgId, branchAssignments);
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message || 'Failed' });
  }
}

export async function removeUserFromTenant(req: Request, res: Response) {
  try {
    const ok = await svc.removeUserFromTenant(req.params.id);
    res.json({ success: ok });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message || 'Failed' });
  }
}
