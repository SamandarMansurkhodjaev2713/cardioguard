/**
 * Semantic icon wrapper over lucide-react-native. Screens reference stable
 * semantic names (e.g. `medication`) rather than lucide component names, so the
 * icon set can change in one place. Stroke icons match the design (≈1.8 weight).
 */

import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Bell,
  BookOpen,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Circle,
  Clock,
  Download,
  Droplet,
  Eye,
  EyeOff,
  Footprints,
  Gauge,
  GraduationCap,
  Heart,
  HeartPulse,
  Home,
  Info,
  Link2,
  LogOut,
  Lock,
  Moon,
  MoreHorizontal,
  Pencil,
  Pill,
  Plus,
  Scale,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  ShieldPlus,
  Sparkles,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Trash2,
  Users,
  User,
  Wind,
  X,
  type LucideIcon,
} from 'lucide-react-native';

const ICONS = {
  home: Home,
  monitoring: Activity,
  medication: Pill,
  risk: ShieldCheck,
  more: MoreHorizontal,
  users: Users,
  user: User,
  alert: AlertTriangle,
  bell: Bell,
  check: Check,
  plus: Plus,
  close: X,
  search: Search,
  download: Download,
  settings: Settings,
  education: BookOpen,
  graduation: GraduationCap,
  logout: LogOut,
  lock: Lock,
  eye: Eye,
  eyeOff: EyeOff,
  edit: Pencil,
  trash: Trash2,
  info: Info,
  link: Link2,
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  chevronDown: ChevronDown,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  trendingUp: TrendingUp,
  trendingDown: TrendingDown,
  heart: Heart,
  pulse: HeartPulse,
  weight: Scale,
  bmi: Gauge,
  droplet: Droplet,
  moon: Moon,
  steps: Footprints,
  wind: Wind,
  calendar: Calendar,
  clock: Clock,
  shield: Shield,
  shieldPlus: ShieldPlus,
  sparkles: Sparkles,
  stethoscope: Stethoscope,
  circle: Circle,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export interface IconProps {
  readonly name: IconName;
  readonly size?: number;
  readonly color?: string;
  readonly strokeWidth?: number;
}

export function Icon({ name, size = 20, color = '#111A28', strokeWidth = 1.8 }: IconProps) {
  const Component = ICONS[name];
  return <Component size={size} color={color} strokeWidth={strokeWidth} />;
}
