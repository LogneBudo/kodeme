import { Request } from 'express';

function getString(val: any): string | undefined {
  if (Array.isArray(val)) return val.length ? String(val[0]) : undefined;
  if (typeof val === 'string') return val;
  if (val !== undefined && val !== null) return String(val);
  return undefined;
}

export function getAuthContext(req: Request) {
  const orgId = getString(req.headers['x-org-id'] || req.query.orgId);
  const branchId = getString(req.headers['x-branch-id'] || req.query.branchId);
  const userId = getString(req.headers['x-user-id'] || req.query.userId);
  return { orgId, branchId, userId };
}
