import { uid } from "@/lib/utils/id";
import type {
  Conversation,
  Deal,
  DealStage,
  Note,
  Task,
  Ticket,
  TimelineEvent,
} from "@/types";

function stamp(input: { id?: string; createdAt?: Date }): {
  id: string;
  createdAt: Date;
} {
  return {
    id: input.id ?? uid("tl"),
    createdAt: input.createdAt ?? new Date(),
  };
}

export function eventCustomerCreated(input: {
  customerId: string;
  actorId?: string;
  createdAt?: Date;
  id?: string;
}): TimelineEvent {
  return {
    type: "customer_created",
    customerId: input.customerId,
    actorId: input.actorId,
    ...stamp(input),
  };
}

export function eventCustomerUpdated(input: {
  customerId: string;
  actorId?: string;
  createdAt?: Date;
  id?: string;
}): TimelineEvent {
  return {
    type: "customer_updated",
    customerId: input.customerId,
    actorId: input.actorId,
    ...stamp(input),
  };
}

export function eventConversationCreated(input: {
  conversationId: string;
  customerId?: string;
  actorId?: string;
  createdAt?: Date;
  id?: string;
}): TimelineEvent {
  return {
    type: "conversation_created",
    conversationId: input.conversationId,
    customerId: input.customerId,
    actorId: input.actorId,
    ...stamp(input),
  };
}

export function eventMessageReceived(input: {
  conversationId: string;
  customerId?: string;
  actorId?: string;
  createdAt?: Date;
  id?: string;
}): TimelineEvent {
  return {
    type: "message_received",
    conversationId: input.conversationId,
    customerId: input.customerId,
    actorId: input.actorId,
    ...stamp(input),
  };
}

export function eventTicketCreated(input: {
  ticketId: string;
  customerId?: string;
  actorId?: string;
  createdAt?: Date;
  id?: string;
}): TimelineEvent {
  return {
    type: "ticket_created",
    ticketId: input.ticketId,
    customerId: input.customerId,
    actorId: input.actorId,
    ...stamp(input),
  };
}

export function eventDealCreated(input: {
  dealId: string;
  customerId?: string;
  actorId?: string;
  createdAt?: Date;
  id?: string;
}): TimelineEvent {
  return {
    type: "deal_created",
    dealId: input.dealId,
    customerId: input.customerId,
    actorId: input.actorId,
    ...stamp(input),
  };
}

export function eventDealStageChanged(input: {
  dealId: string;
  customerId?: string;
  fromStage?: DealStage;
  toStage: DealStage;
  actorId?: string;
  createdAt?: Date;
  id?: string;
}): TimelineEvent {
  return {
    type: "deal_stage_changed",
    dealId: input.dealId,
    customerId: input.customerId,
    fromStage: input.fromStage,
    toStage: input.toStage,
    actorId: input.actorId,
    ...stamp(input),
  };
}

export function eventTaskCreated(input: {
  taskId: string;
  customerId?: string;
  actorId?: string;
  createdAt?: Date;
  id?: string;
}): TimelineEvent {
  return {
    type: "task_created",
    taskId: input.taskId,
    customerId: input.customerId,
    actorId: input.actorId,
    ...stamp(input),
  };
}

export function eventNoteAdded(input: {
  noteId: string;
  customerId?: string;
  actorId?: string;
  createdAt?: Date;
  id?: string;
}): TimelineEvent {
  return {
    type: "note_added",
    noteId: input.noteId,
    customerId: input.customerId,
    actorId: input.actorId,
    ...stamp(input),
  };
}

/** Build an initial timeline from seeded records (IDs only, no name joins). */
export function buildSeedTimeline(input: {
  deals: Deal[];
  conversations: Conversation[];
  tickets: Ticket[];
  tasks: Task[];
  notes: Note[];
}): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  let n = 0;
  const nextId = () => `TL-${++n}`;

  for (const deal of input.deals) {
    events.push(
      eventDealCreated({
        id: nextId(),
        dealId: deal.id,
        customerId: deal.customerId,
        actorId: deal.ownerId,
        createdAt: deal.close,
      }),
    );
    if (deal.stage !== "lead") {
      events.push(
        eventDealStageChanged({
          id: nextId(),
          dealId: deal.id,
          customerId: deal.customerId,
          actorId: deal.ownerId,
          toStage: deal.stage,
          createdAt: deal.close,
        }),
      );
    }
  }

  for (const conv of input.conversations) {
    events.push(
      eventConversationCreated({
        id: nextId(),
        conversationId: conv.id,
        customerId: conv.customerId,
        createdAt: conv.createdAt,
      }),
    );
    const incoming = conv.messages.find((m) => m.role === "customer");
    if (incoming) {
      events.push(
        eventMessageReceived({
          id: nextId(),
          conversationId: conv.id,
          customerId: conv.customerId,
          createdAt: incoming.time,
        }),
      );
    }
  }

  for (const ticket of input.tickets) {
    events.push(
      eventTicketCreated({
        id: nextId(),
        ticketId: ticket.id,
        customerId: ticket.customerId,
        createdAt: ticket.createdAt,
      }),
    );
  }

  for (const task of input.tasks) {
    events.push(
      eventTaskCreated({
        id: nextId(),
        taskId: task.id,
        customerId: task.customerId,
        actorId: task.assignedTo,
        createdAt: task.due,
      }),
    );
  }

  for (const note of input.notes) {
    events.push(
      eventNoteAdded({
        id: nextId(),
        noteId: note.id,
        customerId: note.customerId,
        actorId: note.authorId,
        createdAt: note.createdAt,
      }),
    );
  }

  return events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
