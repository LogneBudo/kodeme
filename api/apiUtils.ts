// Utility to extract orgId, branchId, userId from request (cookie, header, or query)
// This is a placeholder. You should adapt this to your actual auth/session system.

type AuthHeaders = { [key: string]: string | undefined };
type AuthQuery = { [key: string]: string | undefined };

export function getAuthContext(
  req: { headers: AuthHeaders; query?: AuthQuery }
) {
  // Works for both Express and VercelRequest
  const orgId = req.headers["x-org-id"] || (req.query && req.query.orgId) || null;
  const branchId = req.headers["x-branch-id"] || (req.query && req.query.branchId) || null;
  const userId = req.headers["x-user-id"] || (req.query && req.query.userId) || null;
  return { orgId, branchId, userId };
}
