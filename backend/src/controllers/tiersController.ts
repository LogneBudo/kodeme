import * as tiersService from '../services/tiersService';
import { Request, Response } from 'express';

export async function canAddUserToTenant(req: Request, res: Response) {
  const { orgId } = req.params;
  try {
    const ok = await tiersService.canAddUserToTenant(orgId);
    res.json({ allowed: ok });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to check user limit' });
  }
}

export async function canAddBranchToTenant(req: Request, res: Response) {
  const { orgId } = req.params;
  try {
    const ok = await tiersService.canAddBranchToTenant(orgId);
    res.json({ allowed: ok });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to check branch limit' });
  }
}

export async function hasTierFeature(req: Request, res: Response) {
  const { orgId, feature } = req.params;
  try {
    const ok = await tiersService.hasTierFeature(orgId, feature);
    res.json({ allowed: ok });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to check feature access' });
  }
}
