import { useEffect, useState } from "react";
import { onSnapshot, type Query } from "firebase/firestore";

/** Generic live-listener hook — keeps every screen showing bookings/enquiries in sync in real time. */
export function useCollection<T>(buildQuery: () => Query | null, deps: unknown[]): { data: T[]; loading: boolean } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = buildQuery();
    if (!q) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading };
}
