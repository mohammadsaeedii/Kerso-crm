"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createSeedData } from "@/lib/data/seed";
import type { Locale } from "@/lib/i18n/config";
import { uid } from "@/lib/utils/id";
import type {
  AppData,
  Company,
  Customer,
  Deal,
  Notification,
  Review,
  Task,
} from "@/types";

export type DataContextValue = {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  reset: () => void;
  addCustomer: (c: Omit<Customer, "id"> & { id?: string }) => Customer;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  removeCustomer: (id: string) => void;
  removeCustomers: (ids: string[]) => void;
  addCompany: (c: Omit<Company, "id"> & { id?: string }) => Company;
  updateCompany: (id: string, patch: Partial<Company>) => void;
  removeCompany: (id: string) => void;
  addDeal: (d: Omit<Deal, "id"> & { id?: string }) => Deal;
  updateDeal: (id: string, patch: Partial<Deal>) => void;
  removeDeal: (id: string) => void;
  updateReview: (id: string, patch: Partial<Review>) => void;
  toggleTask: (id: string) => void;
  addTask: (t: Omit<Task, "id"> & { id?: string }) => Task;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  removeNotification: (id: string) => void;
};

const DataContext = createContext<DataContextValue | null>(null);

export type DataProviderProps = {
  locale: Locale;
  children: ReactNode;
  initialData?: AppData;
};

export function DataProvider({
  locale,
  children,
  initialData,
}: DataProviderProps) {
  const [data, setData] = useState<AppData>(
    () => initialData ?? createSeedData(locale),
  );

  const reset = useCallback(() => {
    setData(createSeedData(locale));
  }, [locale]);

  const addCustomer = useCallback(
    (c: Omit<Customer, "id"> & { id?: string }): Customer => {
      const row: Customer = { ...c, id: c.id ?? uid("c") };
      setData((d) => ({ ...d, customers: [row, ...d.customers] }));
      return row;
    },
    [],
  );

  const updateCustomer = useCallback((id: string, patch: Partial<Customer>) => {
    setData((d) => ({
      ...d,
      customers: d.customers.map((c) =>
        c.id === id ? { ...c, ...patch } : c,
      ),
    }));
  }, []);

  const removeCustomer = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      customers: d.customers.filter((c) => c.id !== id),
    }));
  }, []);

  const removeCustomers = useCallback((ids: string[]) => {
    const set = new Set(ids);
    setData((d) => ({
      ...d,
      customers: d.customers.filter((c) => !set.has(c.id)),
    }));
  }, []);

  const addCompany = useCallback(
    (c: Omit<Company, "id"> & { id?: string }): Company => {
      const row: Company = { ...c, id: c.id ?? uid("co") };
      setData((d) => ({ ...d, companies: [row, ...d.companies] }));
      return row;
    },
    [],
  );

  const updateCompany = useCallback((id: string, patch: Partial<Company>) => {
    setData((d) => ({
      ...d,
      companies: d.companies.map((c) =>
        c.id === id ? { ...c, ...patch } : c,
      ),
    }));
  }, []);

  const removeCompany = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      companies: d.companies.filter((c) => c.id !== id),
    }));
  }, []);

  const addDeal = useCallback(
    (deal: Omit<Deal, "id"> & { id?: string }): Deal => {
      const row: Deal = { ...deal, id: deal.id ?? uid("d") };
      setData((d) => ({ ...d, deals: [row, ...d.deals] }));
      return row;
    },
    [],
  );

  const updateDeal = useCallback((id: string, patch: Partial<Deal>) => {
    setData((d) => ({
      ...d,
      deals: d.deals.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
  }, []);

  const removeDeal = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      deals: d.deals.filter((x) => x.id !== id),
    }));
  }, []);

  const updateReview = useCallback((id: string, patch: Partial<Review>) => {
    setData((d) => ({
      ...d,
      reviews: d.reviews.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }, []);

  const toggleTask = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      tasks: d.tasks.map((t) =>
        t.id === id ? { ...t, done: !t.done } : t,
      ),
    }));
  }, []);

  const addTask = useCallback(
    (task: Omit<Task, "id"> & { id?: string }): Task => {
      const row: Task = { ...task, id: task.id ?? uid("t") };
      setData((d) => ({ ...d, tasks: [row, ...d.tasks] }));
      return row;
    },
    [],
  );

  const markNotificationRead = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      notifications: d.notifications.map((n: Notification) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setData((d) => ({
      ...d,
      notifications: d.notifications.map((n) => ({ ...n, read: true })),
    }));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      notifications: d.notifications.filter((n) => n.id !== id),
    }));
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      data,
      setData,
      reset,
      addCustomer,
      updateCustomer,
      removeCustomer,
      removeCustomers,
      addCompany,
      updateCompany,
      removeCompany,
      addDeal,
      updateDeal,
      removeDeal,
      updateReview,
      toggleTask,
      addTask,
      markNotificationRead,
      markAllNotificationsRead,
      removeNotification,
    }),
    [
      data,
      reset,
      addCustomer,
      updateCustomer,
      removeCustomer,
      removeCustomers,
      addCompany,
      updateCompany,
      removeCompany,
      addDeal,
      updateDeal,
      removeDeal,
      updateReview,
      toggleTask,
      addTask,
      markNotificationRead,
      markAllNotificationsRead,
      removeNotification,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useDataContext(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error("useData must be used within DataProvider");
  }
  return ctx;
}
