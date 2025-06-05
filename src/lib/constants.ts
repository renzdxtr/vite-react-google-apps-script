import type { LucideIcon } from "lucide-react";

export const APP_NAME = "SIS";

export const PAGE_TITLES: Record<string, string> = {
  '/': 'Home',
  '/menu': 'Menu',
  '/monitor-inventory': 'Monitor Inventory',
  '/scan-qr': 'Scan QR',
  '/scan-qr/details': 'Seed Management',
  '/seed-withdrawal': 'Seed Withdrawal',
  '/Tasks': 'Tasks'
};

export const MENU_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Menu', href: '/menu' },
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

export const DROPDOWN_CHOICES = {
  'INVENTORY': ['Seed Storage', 'Planting Materials'],
  'SEED_CLASS': ['Breeder', 'Foundation', 'Registered', 'Certified', 'NA', 'Others'],
  'LOCATION': ['Conventional', 'Organic', 'Plant Nursery'],
  'PROGRAM': ['HVCDP', 'NCP', 'NOAP', 'NUPAP']
}

export const SAMPLE_DATA_INVENTORY = [
  {
    "LOCATION": "Organic",
    "SEED_CLASS": "Breeder",
    "VARIETY": "Test Variety 101",
    "LAST_MODIFIED": "06/03/2025",
    "MOISTURE_CONTENT": 11,
    "CROP": "Tomato",
    "INVENTORY": "Planting Materials",
    "BAG_NUMBER": 0,
    "UNIT": "Grams (g)",
    "STORED_DATE": "04/20/2025",
    "VOLUME": 1250,
    "GERMINATION_RATE": 92,
    "CODE": "Sbn11-3-2-01-15-2025-P",
    "QR_DOCUMENT": "https://docs.google.com/open?id=1",
    "HARVEST_DATE": "05/18/2025",
    "LOT_NUMBER": 0,
    "PROGRAM": "NCP"
  },
  {
    "LOCATION": "Plant Nursery",
    "SEED_CLASS": "Foundation",
    "VARIETY": "Hybrid Mix 202",
    "LAST_MODIFIED": "06/03/2025",
    "MOISTURE_CONTENT": 9,
    "CROP": "Hot Pepper",
    "INVENTORY": "Seed Storage",
    "BAG_NUMBER": 0,
    "UNIT": "Grams (g)",
    "STORED_DATE": "05/18/2025",
    "VOLUME": 980,
    "GERMINATION_RATE": 85,
    "CODE": "Sbn17-4-5-03-16-2025-O",
    "QR_DOCUMENT": "https://docs.google.com/open?id=2",
    "HARVEST_DATE": "05/16/2025",
    "LOT_NUMBER": 0,
    "PROGRAM": "HVCDP"
  },
  {
    "LOCATION": "Conventional",
    "SEED_CLASS": "Registered",
    "VARIETY": "Golden Bean 789",
    "LAST_MODIFIED": "06/03/2025",
    "MOISTURE_CONTENT": 10,
    "CROP": "Mungbean",
    "INVENTORY": "Seed Storage",
    "BAG_NUMBER": 0,
    "UNIT": "Grams (g)",
    "STORED_DATE": "05/23/2025",
    "VOLUME": 1500,
    "GERMINATION_RATE": 88,
    "CODE": "Sbn20-6-4-06-21-2025-B",
    "QR_DOCUMENT": "https://docs.google.com/open?id=3",
    "HARVEST_DATE": "05/21/2025",
    "LOT_NUMBER": 0,
    "PROGRAM": "NOAP"
  },
  {
    "LOCATION": "Organic",
    "SEED_CLASS": "NA",
    "VARIETY": "Green Glory 456",
    "LAST_MODIFIED": "06/03/2025",
    "MOISTURE_CONTENT": 12,
    "CROP": "Okra",
    "INVENTORY": "Planting Materials",
    "BAG_NUMBER": 0,
    "UNIT": "Grams (g)",
    "STORED_DATE": "06/25/2025",
    "VOLUME": 1000,
    "GERMINATION_RATE": 95,
    "CODE": "Sbn18-2-7-05-20-2025-X",
    "QR_DOCUMENT": "https://docs.google.com/open?id=4",
    "HARVEST_DATE": "05/20/2025",
    "LOT_NUMBER": 0,
    "PROGRAM": "HVCDP"
  },
  {
    "LOCATION": "Plant Nursery",
    "SEED_CLASS": "Others",
    "VARIETY": "Sitao Select 134",
    "LAST_MODIFIED": "06/03/2025",
    "MOISTURE_CONTENT": 8,
    "CROP": "Bush Sitao",
    "INVENTORY": "Seed Storage",
    "BAG_NUMBER": 9,
    "UNIT": "Grams (g)",
    "STORED_DATE": "05/22/2025",
    "VOLUME": 1350,
    "GERMINATION_RATE": 90,
    "CODE": "Sbn16-5-3-04-19-2025-A",
    "QR_DOCUMENT": "https://docs.google.com/open?id=5",
    "HARVEST_DATE": "05/19/2025",
    "LOT_NUMBER": 1,
    "PROGRAM": "NUPAP"
  },
  {
    "LOCATION": "Conventional",
    "SEED_CLASS": "Certified",
    "VARIETY": "Sweet Pod 301",
    "LAST_MODIFIED": "06/03/2025",
    "MOISTURE_CONTENT": 10,
    "CROP": "Cowpea",
    "INVENTORY": "Planting Materials",
    "BAG_NUMBER": 11,
    "UNIT": "Grams (g)",
    "STORED_DATE": "07/21/2025",
    "VOLUME": 1400,
    "GERMINATION_RATE": 89,
    "CODE": "Sbn13-2-6-04-18-2025-H",
    "QR_DOCUMENT": "https://docs.google.com/open?id=6",
    "HARVEST_DATE": "05/18/2025",
    "LOT_NUMBER": 3,
    "PROGRAM": "HVCDP"
  },
  {
    "LOCATION": "Organic",
    "SEED_CLASS": "Registered",
    "VARIETY": "Eggplant Elite 900",
    "LAST_MODIFIED": "06/03/2025",
    "MOISTURE_CONTENT": 11,
    "CROP": "Eggplant",
    "INVENTORY": "Seed Storage",
    "BAG_NUMBER": 13,
    "UNIT": "Grams (g)",
    "STORED_DATE": "05/24/2025",
    "VOLUME": 1100,
    "GERMINATION_RATE": 91,
    "CODE": "Sbn19-8-3-03-17-2025-M",
    "QR_DOCUMENT": "https://docs.google.com/open?id=7",
    "HARVEST_DATE": "05/17/2025",
    "LOT_NUMBER": 2,
    "PROGRAM": "NOAP"
  },
  {
    "LOCATION": "Plant Nursery",
    "SEED_CLASS": "Foundation",
    "VARIETY": "Sponge King 400",
    "LAST_MODIFIED": "06/03/2025",
    "MOISTURE_CONTENT": 9,
    "CROP": "Sponge Gourd",
    "INVENTORY": "Planting Materials",
    "BAG_NUMBER": 10,
    "UNIT": "Grams (g)",
    "STORED_DATE": "05/20/2025",
    "VOLUME": 1200,
    "GERMINATION_RATE": 87,
    "CODE": "Sbn15-6-4-04-19-2025-R",
    "QR_DOCUMENT": "https://docs.google.com/open?id=8",
    "HARVEST_DATE": "05/18/2025",
    "LOT_NUMBER": 4,
    "PROGRAM": "NCP"
  },
  {
    "LOCATION": "Conventional",
    "SEED_CLASS": "Breeder",
    "VARIETY": "Pole Magic 101",
    "LAST_MODIFIED": "06/03/2025",
    "MOISTURE_CONTENT": 12,
    "CROP": "Pole Sitao",
    "INVENTORY": "Seed Storage",
    "BAG_NUMBER": 7,
    "UNIT": "Grams (g)",
    "STORED_DATE": "05/19/2025",
    "VOLUME": 1250,
    "GERMINATION_RATE": 93,
    "CODE": "Sbn14-3-1-03-15-2025-T",
    "QR_DOCUMENT": "https://docs.google.com/open?id=9",
    "HARVEST_DATE": "05/15/2025",
    "LOT_NUMBER": 1,
    "PROGRAM": "NUPAP"
  },
  {
    "LOCATION": "Organic",
    "SEED_CLASS": "Certified",
    "VARIETY": "Peanut Pro 600",
    "LAST_MODIFIED": "06/03/2025",
    "MOISTURE_CONTENT": 10,
    "CROP": "Peanut",
    "INVENTORY": "Planting Materials",
    "BAG_NUMBER": 14,
    "UNIT": "Grams (g)",
    "STORED_DATE": "05/21/2025",
    "VOLUME": 1300,
    "GERMINATION_RATE": 86,
    "CODE": "Sbn20-2-5-05-20-2025-Z",
    "QR_DOCUMENT": "https://docs.google.com/open?id=10",
    "HARVEST_DATE": "05/20/2025",
    "LOT_NUMBER": 5,
    "PROGRAM": "HVCDP"
  },
  {
    "LOCATION": "Conventional",
    "SEED_CLASS": "Registered",
    "VARIETY": "Soy Select 88",
    "LAST_MODIFIED": "06/03/2025",
    "MOISTURE_CONTENT": 9,
    "CROP": "Soybean",
    "INVENTORY": "Seed Storage",
    "BAG_NUMBER": 8,
    "UNIT": "Grams (g)",
    "STORED_DATE": "05/23/2025",
    "VOLUME": 1150,
    "GERMINATION_RATE": 94,
    "CODE": "Sbn16-7-5-06-22-2025-V",
    "QR_DOCUMENT": "https://docs.google.com/open?id=11",
    "HARVEST_DATE": "05/22/2025",
    "LOT_NUMBER": 6,
    "PROGRAM": "NOAP"
  },
  {
    "LOCATION": "Plant Nursery",
    "SEED_CLASS": "Foundation",
    "VARIETY": "Winged Wonder 377",
    "LAST_MODIFIED": "06/03/2025",
    "MOISTURE_CONTENT": 10,
    "CROP": "Winged Bean",
    "INVENTORY": "Seed Storage",
    "BAG_NUMBER": 10,
    "UNIT": "Grams (g)",
    "STORED_DATE": "05/24/2025",
    "VOLUME": 1300,
    "GERMINATION_RATE": 96,
    "CODE": "Sbn18-4-3-04-19-2025-G",
    "QR_DOCUMENT": "https://docs.google.com/open?id=12",
    "HARVEST_DATE": "05/19/2025",
    "LOT_NUMBER": 3,
    "PROGRAM": "NCP"
  },
  {
    "LOCATION": "Organic",
    "SEED_CLASS": "Others",
    "VARIETY": "Bottle Bright 211",
    "LAST_MODIFIED": "06/03/2025",
    "MOISTURE_CONTENT": 11,
    "CROP": "Bottle Gourd",
    "INVENTORY": "Planting Materials",
    "BAG_NUMBER": 9,
    "UNIT": "Grams (g)",
    "STORED_DATE": "05/22/2025",
    "VOLUME": 1100,
    "GERMINATION_RATE": 90,
    "CODE": "Sbn12-2-1-02-15-2025-K",
    "QR_DOCUMENT": "https://docs.google.com/open?id=13",
    "HARVEST_DATE": "05/15/2025",
    "LOT_NUMBER": 2,
    "PROGRAM": "NUPAP"
  },
  {
    "LOCATION": "Conventional",
    "SEED_CLASS": "Certified",
    "VARIETY": "Corn King 500",
    "LAST_MODIFIED": "06/03/2025",
    "MOISTURE_CONTENT": 10,
    "CROP": "Corn",
    "INVENTORY": "Seed Storage",
    "BAG_NUMBER": 10,
    "UNIT": "Grams (g)",
    "STORED_DATE": "05/22/2025",
    "VOLUME": 1400,
    "GERMINATION_RATE": 89,
    "CODE": "Sbn19-5-6-05-18-2025-O",
    "QR_DOCUMENT": "https://docs.google.com/open?id=14",
    "HARVEST_DATE": "05/22/2025",
    "LOT_NUMBER": 5,
    "PROGRAM": "HVCDP"
  },
  {
    "LOCATION": "Plant Nursery",
    "SEED_CLASS": "Breeder",
    "VARIETY": "Golden Pod 912",
    "LAST_MODIFIED": "06/03/2025",
    "MOISTURE_CONTENT": 9,
    "CROP": "Cowpea",
    "INVENTORY": "Planting Materials",
    "BAG_NUMBER": 13,
    "UNIT": "Grams (g)",
    "STORED_DATE": "05/20/2025",
    "VOLUME": 1350,
    "GERMINATION_RATE": 93,
    "CODE": "Sbn21-3-7-05-17-2025-Y",
    "QR_DOCUMENT": "https://docs.google.com/open?id=15",
    "HARVEST_DATE": "05/17/2025",
    "LOT_NUMBER": 4,
    "PROGRAM": "NOAP"
  }
]

export const SEED_STORAGE = SAMPLE_DATA_INVENTORY.filter(item => item.INVENTORY === "Seed Storage")

export const PLANTING_MATERIALS = SAMPLE_DATA_INVENTORY.filter(item => item.INVENTORY === "Planting Materials")