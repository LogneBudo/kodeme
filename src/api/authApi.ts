export type AuthUser = {
  role: string;
} | null;

// In-memory mock user
const mockUser: AuthUser = { role: "admin" };


export async function getCurrentUser(): Promise<AuthUser> {
  await new Promise((res) => setTimeout(res, 150));
  return mockUser;
}

export function redirectToLogin(path: string) {
  window.location.href = "/login?redirect=" + encodeURIComponent(path);
}