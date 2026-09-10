import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";
import type { StaffUser } from "@wellness-lodge/shared";

export interface AuthState {
  loading: boolean;
  user: User | null;
  staff: StaffUser | null; // null while loading or if no profile doc exists yet
}

/**
 * Tracks both the Firebase Auth user and their live staff profile doc
 * (role, active flag). Using onSnapshot rather than a one-off read means a
 * deactivation by an administrator takes effect immediately in this app —
 * no refresh needed (architecture doc: "A deactivated staff account can no
 * longer enter the administration portal or front desk application").
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [staffLoaded, setStaffLoaded] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoaded(true);
      if (!u) {
        setStaff(null);
        setStaffLoaded(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    setStaffLoaded(false);
    return onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        setStaff(snap.exists() ? ({ ...(snap.data() as StaffUser), uid: user.uid }) : null);
        setStaffLoaded(true);
      },
      () => setStaffLoaded(true)
    );
  }, [user]);

  return { loading: !authLoaded || !staffLoaded, user, staff };
}
