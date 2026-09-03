import { useCallback, useEffect, useState } from "react";
import { listExpenseCategories, type ExpenseCategory } from "../api";

export function useCategories() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const page = await listExpenseCategories();
      setCategories(page.data);
    } catch {
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const nameOf = (categoryId: string) =>
    categories.find((c) => c.id === categoryId)?.name ?? categoryId;

  return { categories, isLoading, nameOf, reload };
}
