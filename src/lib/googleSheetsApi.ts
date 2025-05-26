const GOOGLE_SHEETS_API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
const GOOGLE_SHEETS_ID = import.meta.env.VITE_GOOGLE_SHEETS_ID;
const FORM_RESPONSES_SHEET = import.meta.env.VITE_FORM_RESPONSES_SHEET;

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
  CODE: "Code", // This is the column with the QR code
  QR_IMAGE: "QR Image",
  QR_DOCUMENT: "QR Document",
  STATUS: "Status"
};

export const fetchSeedDetailsByQrCode = async (qrCode: string) => {
  if (!GOOGLE_SHEETS_API_KEY || !GOOGLE_SHEETS_ID || !FORM_RESPONSES_SHEET) {
    throw new Error("Google Sheets API credentials are not configured.");
  }

  const range = `${FORM_RESPONSES_SHEET}!A:Z`; // Adjust the range based on your actual data columns

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_ID}/values/${range}?key=${GOOGLE_SHEETS_API_KEY}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error fetching data from Google Sheets: ${response.statusText}`);
    }

    const data = await response.json();
    const rows = data.values;

    if (!rows || rows.length === 0) {
      return null; // No data found
    }

    // Assuming the first row is the header row
    const headerRow = rows[0];
    const dataRows = rows.slice(1);

    const qrCodeColumnIndex = headerRow.indexOf(COLUMN_NAMES.CODE);

    if (qrCodeColumnIndex === -1) {
      throw new Error(`QR code column "${COLUMN_NAMES.CODE}" not found in the sheet header.`);
    }

    // Find the row that matches the QR code
    const matchingRow = dataRows.find(row => row[qrCodeColumnIndex] === qrCode);

    if (!matchingRow) {
      return null; // QR code not found
    }

    // Map the row data to a structured object
    const seedDetails: Record<string, string> = {};
    headerRow.forEach((header, index) => {
      const columnName = Object.keys(COLUMN_NAMES).find(key => COLUMN_NAMES[key as keyof typeof COLUMN_NAMES] === header);
      if (columnName) {
        seedDetails[columnName] = matchingRow[index] || ""; // Use empty string for missing values
      }
    });

    return seedDetails;

  } catch (error) {
    console.error("Error in fetchSeedDetailsByQrCode:", error);
    throw error; // Re-throw the error for handling in the component
  }
};
