import type {
  AppData,
  AvatarColor,
  CallRecording,
  Company,
  Customer,
  Deal,
  Note,
  Task,
  TeamMember,
  TimelineEvent,
} from "@/types";

export function companyById(
  companies: Company[],
  id: string | undefined,
): Company | undefined {
  if (!id) return undefined;
  return companies.find((c) => c.id === id);
}

export function companyName(
  companies: Company[],
  id: string | undefined,
  fallback = "—",
): string {
  return companyById(companies, id)?.name ?? fallback;
}

export function teamMemberById(
  members: TeamMember[],
  id: string | undefined,
): TeamMember | undefined {
  if (!id) return undefined;
  return members.find((m) => m.id === id);
}

export function teamMemberName(
  members: TeamMember[],
  id: string | undefined,
  fallback = "—",
): string {
  return teamMemberById(members, id)?.name ?? fallback;
}

export function teamMemberAvatar(
  members: TeamMember[],
  id: string | undefined,
): AvatarColor {
  const member = teamMemberById(members, id);
  if (!member || member.avatar === "face") return "indigo";
  return member.avatar;
}

export function dealsForCustomer(deals: Deal[], customerId: string): Deal[] {
  return deals.filter((d) => d.customerId === customerId);
}

export function dealsForCompany(deals: Deal[], companyId: string): Deal[] {
  return deals.filter((d) => d.companyId === companyId);
}

export function customersForCompany(
  customers: Customer[],
  companyId: string,
): Customer[] {
  return customers.filter((c) => c.companyId === companyId);
}

export function callsForCustomer(
  calls: CallRecording[],
  customerId: string,
): CallRecording[] {
  return calls
    .filter((c) => c.customerId === customerId)
    .slice()
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
}

export function notesForCustomer(notes: Note[], customerId: string): Note[] {
  return notes
    .filter((n) => n.customerId === customerId)
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function tasksForCustomer(tasks: Task[], customerId: string): Task[] {
  return tasks.filter((t) => t.customerId === customerId);
}

export function timelineForCustomer(
  events: TimelineEvent[],
  customerId: string,
): TimelineEvent[] {
  return events
    .filter((e) => e.customerId === customerId)
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/** Recompute denormalized deal/contact counts from ID relations. */
export function recountStats(data: AppData): AppData {
  const dealsByCustomer = new Map<string, number>();
  const dealsByCompany = new Map<string, number>();
  const contactsByCompany = new Map<string, number>();

  for (const deal of data.deals) {
    if (deal.customerId) {
      dealsByCustomer.set(
        deal.customerId,
        (dealsByCustomer.get(deal.customerId) ?? 0) + 1,
      );
    }
    if (deal.companyId) {
      dealsByCompany.set(
        deal.companyId,
        (dealsByCompany.get(deal.companyId) ?? 0) + 1,
      );
    }
  }
  for (const customer of data.customers) {
    if (customer.companyId) {
      contactsByCompany.set(
        customer.companyId,
        (contactsByCompany.get(customer.companyId) ?? 0) + 1,
      );
    }
  }

  return {
    ...data,
    customers: data.customers.map((c) => ({
      ...c,
      deals: dealsByCustomer.get(c.id) ?? 0,
    })),
    companies: data.companies.map((c) => ({
      ...c,
      deals: dealsByCompany.get(c.id) ?? 0,
      contacts: contactsByCompany.get(c.id) ?? 0,
    })),
  };
}
