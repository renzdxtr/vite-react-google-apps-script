import type { LucideIcon } from "lucide-react";

export const APP_NAME = "SIS";

export const PAGE_TITLES: Record<string, string> = {
  '/': 'Home',
  '/menu': 'Menu',
  '/monitor-inventory': 'Monitor Inventory',
  '/scan-qr': 'Scan QR',
  '/scan-qr/details': 'Seed Management',
  '/seed-withdrawal': 'Seed Withdrawal',
  '/dashboard': 'Dashboard'
};

export const MENU_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Menu', href: '/menu' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Monitor Inventory', href: '/monitor-inventory' },
];

// ─── Non‐editable fields in the “Full Details” table ───────────────────────
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

// ─── Fields that are not required (i.e., can be left blank without validation) ──
export const NON_REQUIRED_FIELDS = [
  'GERMINATION_RATE',
  'MOISTURE_CONTENT',
  'HARVEST_DATE',
  'BAG_NUMBER',
  'ARCHIVED'
] as const;

// ─── Fields treated as dates (rendered with <input type="datetime-local">) ───
export const DATE_FIELDS = [
  'HARVEST_DATE',
  'STORED_DATE'
] as const;

/**
 * Fields to display in the Seed Summary Card.
 * (We will render these in the specific grouped order shown below.)
 */
export const SUMMARY_DETAILS = [
  'CODE',
  'CROP',
  'VARIETY',
  'LOT_NUMBER',
  'BAG_NUMBER',
  'STORED_DATE',
  'VOLUME',
  'GERMINATION_RATE',
  'MOISTURE_CONTENT',
  'SEED_CLASS',
  'PROGRAM',
]

/**
 * Pre‐defined “preferred order” for keys in the seed details table.
 * Keys listed here will appear first (in exactly this order).
 * Any keys not included below will be appended afterward, alphabetically by key.
 */
export const DETAIL_KEY_ORDER: string[] = [
  'CODE',
  'CROP',
  'INVENTORY',
  'LOCATION',
  'VARIETY',
  'LOT_NUMBER',
  'BAG_NUMBER',
  'HARVEST_DATE',
  'STORED_DATE',
  'VOLUME',
  'UNIT',
  'GERMINATION_RATE',
  'MOISTURE_CONTENT',
  'SEED_CLASS',
  'PROGRAM',
  'REMARKS',
  'NAME'
];

export const PIN_CODES = [
  '1120',
  '1931',
  '3910'
];

export const USER_ROLES = {
  '1120': 'Procurement Team',
  '1931': 'Admin',
  '3910': 'Officer 1'
};

export const DROPDOWN_CHOICES = {
  'INVENTORY': ['Seed Storage', 'Planting Materials'],
  'SEED_CLASS': ['Breeder', 'Foundation', 'Registered', 'Certified', 'NA', 'Others'],
  'LOCATION': ['Conventional', 'Organic', 'Plant Nursery'],
  'PROGRAM': ['HVCDP', 'NCP', 'NOAP', 'NUPAP']
}

// Import the sample data from the provided files
import { SAMPLE_DATA_INVENTORY } from "./sample-data-inventory"
import { SAMPLE_WITHDRAWAL } from "./sample-withdrawal"

export { SAMPLE_DATA_INVENTORY, SAMPLE_WITHDRAWAL }

export const SEED_STORAGE = SAMPLE_DATA_INVENTORY.filter(item => item.INVENTORY === "Seed Storage")
export const PLANTING_MATERIALS = SAMPLE_DATA_INVENTORY.filter(item => item.INVENTORY === "Planting Materials")

// Global thresholds for aging - easily configurable
export const AGING_THRESHOLD = 365 // days
export const CRITICAL_AGING_THRESHOLD = 912 // days

export const EXPIRY_WARNING_THRESHOLD = 1095 // days until expiry
export const HIGH_WITHDRAWAL_THRESHOLD = 100_000 // withdrawn YTD

// Planting Materials
export const LOW_STOCK_PM_THRESHOLD = 100 // pcs
export const VERY_LOW_STOCK_PM_THRESHOLD = 50 // pcs

// Commercial‐scale crop volume thresholds: [low_volume_threshold, very_low_volume_threshold] in grams
export const CROP_VOLUME_THRESHOLDS = {
  "Tomato": [40.0, 20.0],
  "Eggplant": [60.0, 30.0],
  "Hot Pepper": [20.0, 10.0],
  "Corn": [60.0, 30.0],
  "Peanut": [80.0, 40.0],
  "Bottle Gourd": [200.0, 100.0],
  "Sponge Gourd": [200.0, 100.0],
  "Okra": [70.0, 35.0],
  "Cowpea": [100.0, 50.0],
  "Mungbean": [70.0, 35.0],
  "Soybean": [70.0, 35.0],
  "Bush Sitao": [100.0, 50.0],
  "Pole Sitao": [100.0, 50.0],
  "Winged Bean": [100.0, 50.0],
} as const

// Default thresholds for crops not in the list
export const DEFAULT_THRESHOLDS = [100.0, 50.0] // [low_volume_threshold, very_low_volume_threshold]

// ===== THRESHOLD CONSTANTS =====
export const THRESHOLDS = {
  // Days since last withdrawal to consider item "stale"
  STALE_INVENTORY_DAYS: AGING_THRESHOLD,

  // Days until expiry to show warning
  EXPIRY_WARNING_DAYS: EXPIRY_WARNING_THRESHOLD,
} as const