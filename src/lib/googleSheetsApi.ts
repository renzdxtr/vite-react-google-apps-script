// Add these environment variables to your .env file:
// VITE_GOOGLE_SHEETS_ID=your_sheet_id
// VITE_FORM_RESPONSES_SHEET=Form Responses
// VITE_INVENTORY_LOGS_SHEET=Inventory Logs
// VITE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
// VITE_PRIVATE_KEY=your_private_key_from_json_file

const GOOGLE_SHEETS_ID = import.meta.env.VITE_GOOGLE_SHEETS_ID;
const FORM_RESPONSES_SHEET = import.meta.env.VITE_FORM_RESPONSES_SHEET;
const INVENTORY_LOGS_SHEET = import.meta.env.VITE_INVENTORY_LOGS_SHEET;
const SERVICE_ACCOUNT_EMAIL = import.meta.env.VITE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = import.meta.env.VITE_PRIVATE_KEY?.replace(/\\n/g, '\n');

const COLUMN_NAMES = {
  TIMESTAMP: "Timestamp",
  EMAIL: "Email Address",
  NAME: "Name (Last Name, First Name, Middle Initial)",
  CROP: "Crop",
  VARIETY: "Variety",
  LOT_NUMBER: "Lot Number",
  BAG_NUMBER: "Bag Number",
  HARVEST_DATE: "Date of Harvest",
  STORED_DATE: "Date Stored",
  VOLUME: "Volume Stored",
  UNIT: "Unit",
  GERMINATION_RATE: "Germination Rate (%)",
  MOISTURE_CONTENT: "Moisture Content (%)",
  SEED_CLASS: "Seed Class",
  SEED_PHOTO: "Seed Photo",
  CROP_PHOTO: "Standing Crop Photo",
  PROGRAM: "Program",
  REMARKS: "Remarks",
  INVENTORY: "Inventory",
  LOCATION: "Location",
  ARCHIVED: "Archived",
  LAST_MODIFIED: "Last Modified",
  CODE: "Code",
  QR_IMAGE: "QR Image",
  QR_DOCUMENT: "QR Document"
};

// Function to create JWT token for Service Account authentication
async function createJWT() {
  if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
    throw new Error("Service account credentials are not configured.");
  }

  const header = {
    alg: "RS256",
    typ: "JWT"
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: SERVICE_ACCOUNT_EMAIL,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600, // 1 hour
    iat: now
  };

  // Note: In a real application, you'd need to implement proper JWT signing
  // For now, this is a placeholder - you'll need to use a JWT library
  throw new Error("JWT signing not implemented - use a proper JWT library or service account key file");
}

// Alternative: Use Google Apps Script as a proxy
async function callGoogleAppsScript(action: string, data: any) {
  const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
  
  if (!APPS_SCRIPT_URL) {
    throw new Error("Google Apps Script URL not configured");
  }

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, data }),
  });

  if (!response.ok) {
    throw new Error(`Apps Script error: ${response.statusText}`);
  }

  return response.json();
}

export const fetchSeedDetailsByQrCode = async (qrCode: string) => {
  // This can still use the API key since it's read-only
  const GOOGLE_SHEETS_API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
  
  if (!GOOGLE_SHEETS_API_KEY || !GOOGLE_SHEETS_ID || !FORM_RESPONSES_SHEET) {
    throw new Error("Google Sheets API credentials are not configured.");
  }

  const range = `${FORM_RESPONSES_SHEET}!A:Z`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_ID}/values/${range}?key=${GOOGLE_SHEETS_API_KEY}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error fetching data from Google Sheets: ${response.statusText}`);
    }

    const data = await response.json();
    const rows = data.values;

    if (!rows || rows.length === 0) {
      return null;
    }

    const headerRow = rows[0];
    const dataRows = rows.slice(1);
    const qrCodeColumnIndex = headerRow.indexOf(COLUMN_NAMES.CODE);

    if (qrCodeColumnIndex === -1) {
      throw new Error(`QR code column "${COLUMN_NAMES.CODE}" not found in the sheet header.`);
    }

    const matchingRow = dataRows.find(row => row[qrCodeColumnIndex] === qrCode);

    if (!matchingRow) {
      return null;
    }

    const seedDetails: Record<string, string> = {};
    headerRow.forEach((header, index) => {
      const columnName = Object.keys(COLUMN_NAMES).find(key => COLUMN_NAMES[key as keyof typeof COLUMN_NAMES] === header);
      if (columnName) {
        seedDetails[columnName] = matchingRow[index] || "";
      }
    });

    return seedDetails;

  } catch (error) {
    console.error("Error in fetchSeedDetailsByQrCode:", error);
    throw error;
  }
};

// Alternative approach using GET with URL parameters
async function callGoogleAppsScriptGet(action: string, data: any) {
  const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
  
  if (!APPS_SCRIPT_URL) {
    throw new Error("Google Apps Script URL not configured");
  }

  // Convert data to URL parameters
  const params = new URLSearchParams({
    action,
    ...Object.keys(data).reduce((acc, key) => {
      acc[key] = String(data[key]);
      return acc;
    }, {} as Record<string, string>)
  });

  const response = await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Apps Script error: ${response.statusText}`);
  }

  return response.json();
}

// Updated updateSeedVolume function using GET
export const updateSeedVolume = async (qrCode: string, withdrawalAmount: number, withdrawalReason: string) => {
  try {
    const result = await callGoogleAppsScriptGet('updateSeedVolume', {
      qrCode,
      withdrawalAmount,
      withdrawalReason,
      sheetId: GOOGLE_SHEETS_ID,
      formResponsesSheet: FORM_RESPONSES_SHEET,
      inventoryLogsSheet: INVENTORY_LOGS_SHEET
    });

    return result;

  } catch (error) {
    console.error("Error in updateSeedVolume:", error);
    throw error;
  }
};