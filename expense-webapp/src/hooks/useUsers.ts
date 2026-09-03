import { useCallback, useEffect, useState } from "react";
import { listUsers, type User } from "../api";

// Best-effort directory lookup, used only to show a human name next to an
// employeeId/managerId. Some roles are not permitted to list users; on a
// 403 this quietly falls back to showing the raw id (handled by the caller).
export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const page = await listUsers({ limit: 100 });
      setUsers(page.data);
    } catch {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const nameOf = (userId: string | null | undefined) =>
    (userId && users.find((u) => u.id === userId)?.name) || userId || "—";

  return { users, isLoading, nameOf, reload };
}
