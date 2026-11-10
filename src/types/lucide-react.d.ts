import * as React from "react";

declare module "lucide-react" {
  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    className?: string;
  }
  export type LucideIcon = React.ForwardRefExoticComponent<
    LucideProps & React.RefAttributes<SVGSVGElement>
  >;

  // Common icons used across the project
  export const ArrowRight: LucideIcon;
  export const BadgeCheck: LucideIcon;
  export const BarChart3: LucideIcon;
  export const Bot: LucideIcon;
  export const PackageCheck: LucideIcon;
  export const Share2: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const Smartphone: LucideIcon;
  export const Star: LucideIcon;
  export const Store: LucideIcon;
  export const Check: LucideIcon;
  export const Copy: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Send: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const ShoppingBag: LucideIcon;
  export const Truck: LucideIcon;
  export const CreditCard: LucideIcon;
  export const HelpCircle: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const Info: LucideIcon;
  export const X: LucideIcon;
  export const Plus: LucideIcon;
  export const Minus: LucideIcon;
  export const Trash2: LucideIcon;
  export const Eye: LucideIcon;
  export const Edit: LucideIcon;
  export const LogOut: LucideIcon;
  export const Settings: LucideIcon;
  export const Package: LucideIcon;
  export const Clock: LucideIcon;
  export const ArrowUpRight: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const Search: LucideIcon;
  export const MessageCircle: LucideIcon;
  export const Lock: LucideIcon;
  export const Zap: LucideIcon;
  export const DollarSign: LucideIcon;
  export const Users: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const Layers: LucideIcon;
  export const Heart: LucideIcon;

  // Wildcard fallback
  const allIcons: Record<string, LucideIcon>;
  export default allIcons;
}
