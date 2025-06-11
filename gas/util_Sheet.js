/**
 * Utility functions for Google Sheet operations
 */

// Global constants for column names
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
  QR_DOCUMENT: "QR Document",
  STATUS: "Status"
};

/**
 * Caches column indices to avoid repeated lookups
 * Will be populated on first use
 */
let columnIndicesCache = {};

/**
 * Gets the column index by header name with caching
 * 
 * @param {Sheet} sheet The Google Sheet to search in
 * @param {string} headerName The name of the header to find
 * @param {boolean} forceRefresh Whether to force a refresh of the cache
 * @return {number} The column index (1-based) or -1 if not found
 */
function getColumnIndexByHeader(sheet, headerName, forceRefresh = false) {
  // If we need to refresh or the cache is empty, rebuild it
  if (forceRefresh || Object.keys(columnIndicesCache).length === 0) {
    refreshColumnIndicesCache(sheet);
  }
  
  // Return from cache if available
  if (headerName in columnIndicesCache) {
    return columnIndicesCache[headerName];
  }
  
  return -1; // Header not found
}

/**
 * Refreshes the column indices cache
 * 
 * @param {Sheet} sheet The Google Sheet to read headers from
 */
function refreshColumnIndicesCache(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Clear the existing cache
  columnIndicesCache = {};
  
  // Populate the cache with new values
  for (let i = 0; i < headers.length; i++) {
    columnIndicesCache[headers[i]] = i + 1; // Convert to 1-based index
  }
}

/**
 * Updates a cell value by row and header name
 * 
 * @param {Sheet} sheet The Google Sheet to update
 * @param {number} row The row number (1-based)
 * @param {string} headerName The name of the column header
 * @param {*} value The value to set
 * @return {boolean} True if successful, false if header not found
 */
function updateCellByHeader(sheet, row, headerName, value) {
  const columnIndex = getColumnIndexByHeader(sheet, headerName);
  
  if (columnIndex === -1) {
    console.error(`Header "${headerName}" not found in sheet`);
    return false;
  }
  
  sheet.getRange(row, columnIndex).setValue(value);
  return true;
}

/**
 * Gets a cell value by row and header name
 * 
 * @param {Sheet} sheet The Google Sheet to read from
 * @param {number} row The row number (1-based)
 * @param {string} headerName The name of the column header
 * @return {*} The cell value or null if header not found
 */
function getCellValueByHeader(sheet, row, headerName) {
  const columnIndex = getColumnIndexByHeader(sheet, headerName);
  
  if (columnIndex === -1) {
    console.error(`Header "${headerName}" not found in sheet`);
    return null;
  }
  
  return sheet.getRange(row, columnIndex).getValue();
}

/**
 * Gets all column indices at once for better performance
 * 
 * @param {Sheet} sheet The Google Sheet to read headers from
 * @return {Object} An object mapping header names to column indices
 */
function getAllColumnIndices(sheet) {
  refreshColumnIndicesCache(sheet);
  return columnIndicesCache;
}