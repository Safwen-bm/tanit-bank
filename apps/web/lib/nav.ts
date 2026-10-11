import {
  ArrowLeftRight,
  Bell,
  CreditCard,
  FileCheck2,
  HandCoins,
  LayoutDashboard,
  Percent,
  Receipt,
  ScrollText,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Flip to true when the page ships. */
  ready: boolean;
}

export const CUSTOMER_NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, ready: true },
  { href: "/transfers", label: "Transfers", icon: ArrowLeftRight, ready: true },
  { href: "/loans", label: "Loans", icon: HandCoins, ready: true },
  { href: "/cards", label: "Cards", icon: CreditCard, ready: true },
  { href: "/notifications", label: "Notifications", icon: Bell, ready: true },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, ready: true },
  { href: "/admin/customers", label: "Customers", icon: Users, ready: true },
  { href: "/admin/transactions", label: "Transactions", icon: Receipt, ready: true },
  { href: "/admin/loan-products", label: "Loan products", icon: Percent, ready: true },
  { href: "/admin/loan-applications", label: "Applications", icon: FileCheck2, ready: true },
  { href: "/admin/audit-logs", label: "Audit log", icon: ScrollText, ready: true },
];