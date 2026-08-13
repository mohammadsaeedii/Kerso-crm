"use client";

import type { LucideProps } from "lucide-react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Bell,
  BellOff,
  Briefcase,
  Building2,
  Calendar,
  ChartPie,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronUp,
  CircleCheck,
  CircleQuestionMark,
  CircleX,
  Clock,
  Command,
  Compass,
  Copy,
  CreditCard,
  DollarSign,
  Download,
  Ellipsis,
  EllipsisVertical,
  ExternalLink,
  Eye,
  Flag,
  Funnel,
  Globe,
  GripVertical,
  Heart,
  Info,
  Kanban,
  LayoutDashboard,
  LayoutGrid,
  Link,
  List,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Minus,
  Monitor,
  Moon,
  Palette,
  PanelLeft,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  Shield,
  Sparkles,
  Star,
  Sun,
  Tag,
  Target,
  ThumbsUp,
  Trash2,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const ICONS = {
  dashboard: LayoutDashboard,
  explore: Compass,
  analytics: Monitor,
  customers: Users,
  reviews: Star,
  sidebar: PanelLeft,
  search: Search,
  bell: Bell,
  message: MessageSquare,
  gear: Settings,
  "chevron-down": ChevronDown,
  "chevron-up": ChevronUp,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "chevrons-left": ChevronsLeft,
  "arrow-up": ArrowUp,
  "arrow-down": ArrowDown,
  "arrow-right": ArrowRight,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  "external-link": ExternalLink,
  plus: Plus,
  minus: Minus,
  check: Check,
  "check-circle": CircleCheck,
  x: X,
  "x-circle": CircleX,
  filter: Funnel,
  sort: ArrowUpDown,
  "more-h": Ellipsis,
  "more-v": EllipsisVertical,
  edit: Pencil,
  trash: Trash2,
  download: Download,
  upload: Upload,
  refresh: RefreshCw,
  copy: Copy,
  drag: GripVertical,
  dollar: DollarSign,
  calendar: Calendar,
  mail: Mail,
  phone: Phone,
  "map-pin": MapPin,
  building: Building2,
  briefcase: Briefcase,
  user: User,
  users: Users,
  star: Star,
  flag: Flag,
  clock: Clock,
  sparkles: Sparkles,
  heart: Heart,
  "thumbs-up": ThumbsUp,
  eye: Eye,
  kanban: Kanban,
  list: List,
  grid: LayoutGrid,
  sun: Sun,
  moon: Moon,
  logout: LogOut,
  help: CircleQuestionMark,
  info: Info,
  alert: TriangleAlert,
  target: Target,
  globe: Globe,
  pie: ChartPie,
  tag: Tag,
  link: Link,
  send: Send,
  command: Command,
  "credit-card": CreditCard,
  "bell-off": BellOff,
  lock: Lock,
  shield: Shield,
  palette: Palette,
} as const;

export type IconName = keyof typeof ICONS;

export type IconProps = {
  name: IconName;
  size?: number;
  stroke?: number;
  className?: string;
} & Omit<
  LucideProps,
  "name" | "size" | "stroke" | "strokeWidth" | "children" | "ref"
>;

export function Icon({
  name,
  size = 20,
  stroke = 1.7,
  className,
  ...rest
}: IconProps) {
  const Cmp = ICONS[name];
  return (
    <Cmp
      size={size}
      strokeWidth={stroke}
      aria-hidden="true"
      focusable="false"
      className={cn(className)}
      {...rest}
    />
  );
}

export function hasIcon(name: string): name is IconName {
  return name in ICONS;
}

export const iconNames = Object.keys(ICONS) as IconName[];
