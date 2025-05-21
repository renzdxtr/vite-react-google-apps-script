import type { LucideIcon } from "lucide-react";

export const APP_NAME = "SIS";

export const PAGE_TITLES: Record<string, string> = {
  '/': 'Home',
  '/menu': 'Menu',
  '/monitor-inventory': 'Monitor Inventory',
  '/scan-qr': 'Scan QR',
  '/scan-qr/details': 'Scan QR Details',
  '/seed-withdrawal': 'Seed Withdrawal',
  '/Tasks': 'Tasks',
};

export const MENU_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Menu', href: '/menu' },
  { label: 'Scan QR', href: '/scan-qr' },
  { label: 'Seed Withdrawal', href: '/seed-withdrawal' },
  { label: 'Tasks', href: '/Tasks' },
];
