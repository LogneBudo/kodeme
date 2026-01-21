import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { listTenantUsers } from "../api/firebaseApi/users";
import { getTenantByUser } from "../api/firebaseApi/organizations";
import type { Organization } from "../types/organization";

type User = {
  id: string;
  email: string;
  role: string;
  org_id?: string;
  branch_assignments?: Record<string, string>;
  createdAt?: Date;
  updatedAt?: Date;
};

export default function TestTenantUsers() {
  const [currentUser, setCurrentUser] = useState<import("firebase/auth").User | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ...existing code...
useEffect(() => {
  const auth = getAuth();
  const unsub = auth.onAuthStateChanged(async (user) => {
    if (!user) {
      setError("No user logged in");
      setCurrentUser(null);
      setOrg(null);
      setUsers([]);
      return;
    }
    setCurrentUser(user);
    try {
      console.log("User UID:", user.uid);
      const org = await getTenantByUser(user.uid);
      console.log("getTenantByUser result:", org);
      setOrg(org);
      if (org?.org_id) {
        const users = await listTenantUsers(org.org_id);
        setUsers(users);
      } else {
        setError("No org found for user (org_id missing or org not found)");
      }
    } catch (e) {
      setError((e instanceof Error && e.message) ? e.message : "Error fetching data");
    }
  });
  return () => unsub();
}, []);
// ...existing code...

  return (
    <div style={{ padding: 24 }}>
      <h2>Test Tenant Users</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <h3>Current User</h3>
      <pre>{JSON.stringify(currentUser, null, 2)}</pre>
      <h3>Organization</h3>
      <pre>{JSON.stringify(org, null, 2)}</pre>
      <h3>Tenant Users</h3>
      <pre>{JSON.stringify(users, null, 2)}</pre>
    </div>
  );
}