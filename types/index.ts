export type Locale = "en" | "fa";

export type CustomerStatus = "active" | "lead" | "prospect" | "churned";

export type DealStage =
  | "lead"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won";

export type DealStatus = "open" | "won" | "lost";

export type CompanyStatus = "customer" | "prospect" | "partner" | "churned";

export type Sentiment = "positive" | "neutral" | "negative";

export type Priority = "high" | "medium" | "low";

export type AvatarColor =
  | "indigo"
  | "violet"
  | "blue"
  | "sky"
  | "teal"
  | "emerald"
  | "amber"
  | "orange"
  | "rose"
  | "pink"
  | "fuchsia"
  | "slate";

export type ActivityType =
  | "deal"
  | "review"
  | "customer"
  | "task"
  | "message";

export type NotificationType =
  | "deal"
  | "review"
  | "task"
  | "customer"
  | "system";

export type IndustryKey =
  | "saas"
  | "fintech"
  | "healthcare"
  | "ecommerce"
  | "logistics"
  | "media"
  | "energy"
  | "education"
  | "realEstate"
  | "manufacturing"
  | "travel"
  | "retail";

export type CompanySizeKey =
  | "1-10"
  | "11-50"
  | "51-200"
  | "201-500"
  | "500+";

export type TagKey =
  | "enterprise"
  | "smb"
  | "hotLead"
  | "vip"
  | "renewal"
  | "upsell"
  | "churnRisk"
  | "newsletter"
  | "demoed"
  | "referral"
  | "inbound"
  | "outbound";

export type CurrentUser = {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar: "face" | AvatarColor;
};

export type TeamMember = {
  id: string;
  name: string;
  email?: string;
  avatar: "face" | AvatarColor;
  role?: string;
};

export type Kpi = {
  id: string;
  label: string;
  value: number;
  display: string;
  delta: number;
  dir: "up" | "down";
  spark: number[];
};

export type RevenuePoint = {
  label: string;
  current: number;
  previous: number;
};

export type DealsCreatedPoint = {
  label: string;
  won: number;
  lost: number;
};

export type PipelineStage = {
  stage: DealStage;
  count: number;
  value: number;
  color: string;
};

export type Deal = {
  id: string;
  title: string;
  customerId?: string;
  companyId?: string;
  ownerId?: string;
  value: number;
  stage: DealStage;
  probability: number;
  close: Date;
  status: DealStatus;
};

export type Customer = {
  id: string;
  name: string;
  companyId?: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  status: CustomerStatus;
  value: number;
  deals: number;
  health: number;
  avatar: AvatarColor;
  ownerId?: string;
  tags: TagKey[];
  joined: Date;
  lastContact: Date;
  rating: number;
};

export type Company = {
  id: string;
  name: string;
  industry: IndustryKey;
  size: CompanySizeKey;
  city: string;
  country: string;
  revenue: number;
  growth: number;
  status: CompanyStatus;
  contacts: number;
  deals: number;
  website: string;
  logo: AvatarColor;
  founded: number;
  rating: string;
  description: string;
};

export type ReviewReply = {
  author: string;
  date: Date;
  body: string;
};

export type Review = {
  id: string;
  author: string;
  avatar: AvatarColor;
  company: string;
  rating: number;
  title: string;
  body: string;
  product: string;
  date: Date;
  sentiment: Sentiment;
  helpful: number;
  verified: boolean;
  replied: boolean;
  reply: ReviewReply | null;
};

export type Activity = {
  type: ActivityType;
  who: string;
  color: AvatarColor;
  text: string;
  time: Date;
};

export type Task = {
  id: string;
  title: string;
  due: Date;
  priority: Priority;
  done: boolean;
  assignedTo?: string;
  customerId?: string;
  companyId?: string;
  dealId?: string;
  conversationId?: string;
};

export type Note = {
  id: string;
  body: string;
  customerId?: string;
  companyId?: string;
  dealId?: string;
  authorId?: string;
  createdAt: Date;
  updatedAt?: Date;
};

type TimelineBase = {
  id: string;
  customerId?: string;
  actorId?: string;
  createdAt: Date;
};

export type TimelineEvent =
  | (TimelineBase & { type: "customer_created"; customerId: string })
  | (TimelineBase & { type: "customer_updated"; customerId: string })
  | (TimelineBase & {
      type: "conversation_created";
      conversationId: string;
    })
  | (TimelineBase & {
      type: "message_received";
      conversationId: string;
    })
  | (TimelineBase & { type: "ticket_created"; ticketId: string })
  | (TimelineBase & { type: "deal_created"; dealId: string })
  | (TimelineBase & {
      type: "deal_stage_changed";
      dealId: string;
      fromStage?: DealStage;
      toStage: DealStage;
    })
  | (TimelineBase & { type: "task_created"; taskId: string })
  | (TimelineBase & { type: "note_added"; noteId: string });

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  desc: string;
  time: Date;
  read: boolean;
};

export type Message = {
  id: string;
  from: string;
  color: AvatarColor;
  preview: string;
  time: Date;
  unread: boolean;
  online: boolean;
};

export type ConversationStatus = "open" | "pending" | "closed";

export type ConversationChannel = "email" | "chat" | "whatsapp";

export type MessageRole = "customer" | "agent" | "ai" | "note" | "system";

export type ConversationMessage = {
  id: string;
  role: MessageRole;
  authorName: string;
  body: string;
  time: Date;
};

export type Conversation = {
  id: string;
  customerId: string;
  subject: string;
  preview: string;
  status: ConversationStatus;
  assignee: string | null;
  channel: ConversationChannel;
  unread: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  messages: ConversationMessage[];
  aiHandled: boolean;
  escalated: boolean;
};

export type TicketStatus =
  | "open"
  | "in_progress"
  | "waiting"
  | "resolved"
  | "closed";

export type Ticket = {
  id: string;
  title: string;
  description: string;
  customerId: string;
  conversationId: string | null;
  status: TicketStatus;
  priority: Priority;
  assignee: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type KbArticleStatus = "draft" | "published";

export type KbArticle = {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  collection: string;
  status: KbArticleStatus;
  updatedAt: Date;
  views: number;
};

export type AutomationRule = {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  active: boolean;
  runs: number;
};

export type AiAgentState = {
  name: string;
  active: boolean;
  instructions: string;
  resolutionRate: number;
  escalationRate: number;
  conversationsHandled: number;
  knowledgeSources: string[];
};

export type SupportAnalytics = {
  totalConversations: number;
  openConversations: number;
  resolvedConversations: number;
  avgFirstResponseMins: number;
  avgResolutionMins: number;
  aiResolutionRate: number;
  aiEscalationRate: number;
  csat: number;
  team: Array<{ name: string; color: AvatarColor; resolved: number; csat: number }>;
};

export type NamedValue = {
  name: string;
  value: number;
  color?: string;
};

export type FunnelStage = {
  stage: string;
  value: number;
};

export type RepStat = {
  name: string;
  color: AvatarColor;
  value: number;
  deals: number;
};

export type CohortRow = {
  label: string;
  vals: number[];
};

export type Analytics = {
  kpis: Kpi[];
  visitors: { label: number; value: number }[];
  funnel: FunnelStage[];
  sources: NamedValue[];
  reps: RepStat[];
  regions: NamedValue[];
  categories: NamedValue[];
  devices: NamedValue[];
  cohort: CohortRow[];
};

export type ExploreStat = {
  label: string;
  value: number;
  sub: string;
  money?: boolean;
  suffix?: string;
};

export type AppData = {
  currentUser: CurrentUser;
  teamMembers: TeamMember[];
  AVATARS: readonly AvatarColor[];
  avatarColor: () => AvatarColor;
  kpis: Kpi[];
  revenueSeries: RevenuePoint[];
  dealsCreated: DealsCreatedPoint[];
  pipeline: PipelineStage[];
  deals: Deal[];
  customers: Customer[];
  companies: Company[];
  reviews: Review[];
  activities: Activity[];
  tasks: Task[];
  notes: Note[];
  timeline: TimelineEvent[];
  notifications: Notification[];
  messages: Message[];
  conversations: Conversation[];
  tickets: Ticket[];
  kbArticles: KbArticle[];
  automations: AutomationRule[];
  aiAgent: AiAgentState;
  supportAnalytics: SupportAnalytics;
  analytics: Analytics;
  exploreStats: ExploreStat[];
  STAGES: readonly DealStage[];
  CUST_STATUS: readonly CustomerStatus[];
  INDUSTRIES: readonly IndustryKey[];
  MONTHS: readonly string[];
};
