import type { LucideIcon } from "lucide-react";

export const APP_NAME = "SIS";

export const PAGE_TITLES: Record<string, string> = {
  '/': 'Home',
  '/menu': 'Menu',
  '/monitor-inventory': 'Monitor Inventory',
  '/scan-qr': 'Scan QR',
  '/scan-qr/details': 'Seed Management',
  '/seed-withdrawal': 'Seed Withdrawal',
  '/Tasks': 'Tasks',
};

export const MENU_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Menu', href: '/menu' },
  { label: 'Monitor Inventory', href: '/monitor-inventory' },
  { label: 'Scan QR', href: '/scan-qr' },
  { label: 'Seed Withdrawal', href: '/seed-withdrawal' },
  { label: 'Tasks', href: '/Tasks' },
];

export const NON_EDITABLE_FIELDS = [
  'LAST_MODIFIED',
  'EMAIL',
  'TIMESTAMP',
  'NAME',
  'CODE',
  'QR_IMAGE',
  'QR_DOCUMENT',
  'STATUS',
  'UNIT'
] as const;

export const NON_REQUIRED_FIELDS = [
  'GERMINATION_RATE',
  'MOISTURE_CONTENT',
  'HARVEST_DATE',
  'BAG_NUMBER'
] as const;

export const DATE_FIELDS = [
  'HARVEST_DATE',
  'STORED_DATE'
] as const;
