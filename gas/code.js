/**
 * Doget function to serve the web app
 */
function doGet() {
  return HtmlService.createTemplateFromFile("index")
    .evaluate()
    .setTitle('BPI Seed Inventory System')
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function includes(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Fetches seed details by QR code from the Google Sheet
 */
function fetchSeedDetailsByQrCode(qrCode) {
  console.log("FETCH SEED DETAILS FOR QR CODE: " + qrCode);
  
  try {
    const spreadsheetId = '1kVzhjXX45GLnqiLiqmeg81sy0FAtEd70EcMAo2_Ejlc';
    const sheetName = SHEET_NAMES.FORM_RESPONSES;
    
    // Open the spreadsheet and get the data
    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found`);
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      throw new Error("No data found in the spreadsheet");
    }
    
    const headers = data[0];
    
    // Find the index of the Code column
    const codeColumnIndex = headers.indexOf('Code');
    if (codeColumnIndex === -1) {
      throw new Error('QR code column "Code" not found in the sheet header.');
    }
    
    // Log all QR codes for debugging
    const allCodes = data.slice(1).map(row => row[codeColumnIndex]);
    console.log("Available QR codes: " + allCodes.join(", "));
    
    // Find the row with the matching QR code
    let matchingRow = null;
    for (let i = 1; i < data.length; i++) {
      if (data[i][codeColumnIndex] === qrCode) {
        matchingRow = data[i];
        break;
      }
    }
    
    if (!matchingRow) {
      console.log("No matching record found for QR code: " + qrCode);
      return null;
    }
    
    console.log("Found seed details for QR code: " + qrCode);
    
    // Create a simple object with the seed details
    const result = {};
    
    // Directly map values to expected keys
    result.TIMESTAMP = '';
    result.EMAIL = '';
    result.NAME = '';
    result.CROP = '';
    result.VARIETY = '';
    result.LOT_NUMBER = '';
    result.BAG_NUMBER = '';
    result.HARVEST_DATE = '';
    result.STORED_DATE = '';
    result.VOLUME = '';
    result.UNIT = '';
    result.GERMINATION_RATE = '';
    result.MOISTURE_CONTENT = '';
    result.SEED_CLASS = '';
    result.SEED_PHOTO = '';
    result.CROP_PHOTO = '';
    result.PROGRAM = '';
    result.REMARKS = '';
    result.INVENTORY = '';
    result.LOCATION = '';
    result.ARCHIVED = '';
    result.LAST_MODIFIED = '';
    result.CODE = '';
    result.QR_IMAGE = '';
    result.QR_DOCUMENT = '';
    result.STATUS = '';
    
    // Map specific columns to their expected keys
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      const value = matchingRow[i] || '';
      
      // Format dates in MM/DD/YYYY format
      let processedValue = value;
      if (value instanceof Date) {
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const day = String(value.getDate()).padStart(2, '0');
        const year = value.getFullYear();
        processedValue = `${month}/${day}/${year}`;
      }
      
      switch(header) {
        case 'Timestamp':
          result.TIMESTAMP = processedValue;
          break;
        case 'Email Address':
          result.EMAIL = processedValue;
          break;
        case 'Name (Last Name, First Name, Middle Initial)':
          result.NAME = processedValue;
          break;
        case 'Crop':
          result.CROP = processedValue;
          break;
        case 'Variety':
          result.VARIETY = processedValue;
          break;
        case 'Lot Number':
          result.LOT_NUMBER = processedValue;
          break;
        case 'Bag Number':
          result.BAG_NUMBER = processedValue;
          break;
        case 'Date of Harvest':
          result.HARVEST_DATE = processedValue;
          break;
        case 'Date Stored':
          result.STORED_DATE = processedValue;
          break;
        case 'Volume Stored':
          result.VOLUME = processedValue;
          break;
        case 'Unit':
          result.UNIT = processedValue;
          break;
        case 'Germination Rate (%)':
          result.GERMINATION_RATE = processedValue;
          break;
        case 'Moisture Content (%)':
          result.MOISTURE_CONTENT = processedValue;
          break;
        case 'Seed Class':
          result.SEED_CLASS = processedValue;
          break;
        case 'Seed Photo':
          result.SEED_PHOTO = processedValue;
          break;
        case 'Standing Crop Photo':
          result.CROP_PHOTO = processedValue;
          break;
        case 'Program':
          result.PROGRAM = processedValue;
          break;
        case 'Remarks':
          result.REMARKS = processedValue;
          break;
        case 'Inventory':
          result.INVENTORY = processedValue;
          break;
        case 'Location':
          result.LOCATION = processedValue;
          break;
        case 'Archived':
          result.ARCHIVED = processedValue;
          break;
        case 'Last Modified':
          result.LAST_MODIFIED = processedValue;
          break;
        case 'Code':
          result.CODE = processedValue;
          break;
        case 'QR Image':
          result.QR_IMAGE = processedValue;
          break;
        case 'QR Document':
          result.QR_DOCUMENT = processedValue;
          break;
        case 'Status':
          result.STATUS = processedValue;
          break;
      }
    }
    
    // Log the final result for debugging
    console.log("Returning data with keys: " + Object.keys(result).join(", "));
    console.log("Result object: " + JSON.stringify(result));
    
    return result;
  } catch (error) {
    console.error('Error in fetchSeedDetailsByQrCode: ' + error.message);
    throw error;
  }
}

function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const { action, data } = requestData;
    
    switch (action) {
      case 'updateSeedVolume':
        return updateSeedVolume(data);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('doPost error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function updateSeedVolume(data) {
  try {
    const { qrCode, inventory, withdrawalAmount, withdrawalReason } = data;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const formSheet = ss.getSheetByName(SHEET_NAMES.FORM_RESPONSES);
    const logsSheet = ss.getSheetByName(SHEET_NAMES.WITHDRAWAL_LOGS);
    
    // Find the row with matching QR code
    const dataRange = formSheet.getDataRange();
    const values = dataRange.getValues();
    const headers = values[0];
    
    // Get column indices
    const qrCodeCol = headers.indexOf("Code");
    const volumeCol = headers.indexOf("Volume Stored");
    const lastModifiedCol = headers.indexOf("Last Modified");
    
    if (qrCodeCol === -1 || volumeCol === -1 || lastModifiedCol === -1) {
      return {
        success: false,
        message: "Required columns not found in the sheet"
      };
    }
    
    // Find the row with matching QR code
    let rowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      if (values[i][qrCodeCol] === qrCode) {
        rowIndex = i + 1; // +1 because array is 0-based but sheets are 1-based
        break;
      }
    }
    
    if (rowIndex === -1) {
      return {
        success: false,
        message: "QR code not found in the sheet"
      };
    }
    
    // Get current volume and calculate new volume
    const currentVolume = parseFloat(values[rowIndex - 1][volumeCol]);
    const newVolume = currentVolume - withdrawalAmount;
    
    // Format current timestamp
    const now = new Date();
    const timestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), "M/d/yyyy HH:mm:ss");
    
    // Update volume and last modified date
    formSheet.getRange(rowIndex, volumeCol + 1).setValue(newVolume);
    formSheet.getRange(rowIndex, lastModifiedCol + 1).setValue(timestamp);
    
    // Log the transaction
    logsSheet.appendRow([
      timestamp,          // Timestamp
      qrCode,             // QR Code
      inventory,          // Inventory (Seed Storage/Planting Materials)
      withdrawalAmount,   // Amount
      currentVolume,      // Previous Value
      newVolume,          // New Value
      withdrawalReason,   // Reason
      ""                  // User
    ]);
    
    return {
      success: true,
      message: "Successfully updated seed volume",
      data: {
        previousVolume: currentVolume,
        newVolume: newVolume,
        withdrawalAmount: withdrawalAmount,
        timestamp: timestamp
      }
    };
    
  } catch (error) {
    console.error("Error in updateSeedVolume:", error);
    return {
      success: false,
      message: "Error updating seed volume: " + error.toString()
    };
  }
}

// Add USER_ROLES at the top of the file with FRS_COL_NAMES
const USER_ROLES = {
  '1120': 'Procurement Team',
  '1931': 'Admin',
  '3910': 'Officer 1'
};

// Add FRS_COL_NAMES at the top of the file
const FRS_COL_NAMES = {
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

function updateSeedDetails(data) {
  try {
    const { qrCode, oldData, newData, pinCode } = data; // Extract pinCode
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const formSheet = ss.getSheetByName(SHEET_NAMES.FORM_RESPONSES);
    const logsSheet = ss.getSheetByName(SHEET_NAMES.EDIT_LOGS);
    
    // Find the row with matching QR code
    const dataRange = formSheet.getDataRange();
    const values = dataRange.getValues();
    const headers = values[0];
    
    // Find the row with matching QR code
    const qrCodeCol = headers.indexOf(FRS_COL_NAMES.CODE);
    let rowIndex = -1;
    
    for (let i = 1; i < values.length; i++) {
      if (values[i][qrCodeCol] === qrCode) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) {
      return {
        success: false,
        message: "QR code not found"
      };
    }

    // Update each changed field
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "M/d/yyyy HH:mm:ss");
    const changedFields = {};

    Object.entries(newData).forEach(([key, newValue]) => {
      if (oldData[key] !== newValue) {
        // Get the actual column name from FRS_COL_NAMES
        const columnName = FRS_COL_NAMES[key];
        const colIndex = headers.indexOf(columnName);
        
        if (colIndex !== -1) {
          formSheet.getRange(rowIndex, colIndex + 1).setValue(newValue);
          changedFields[key] = {
            old: oldData[key],
            new: newValue
          };
        }
      }
    });

    // Update Last Modified
    const lastModifiedCol = headers.indexOf(FRS_COL_NAMES.LAST_MODIFIED);
    if (lastModifiedCol !== -1) {
      formSheet.getRange(rowIndex, lastModifiedCol + 1).setValue(timestamp);
    }

    // Get user role based on PIN code
    const userRole = USER_ROLES[pinCode] || 'Unknown User';

    // Log the changes in Inventory Logs with user information
    logsSheet.appendRow([
      timestamp,                  // Timestamp
      qrCode,                     // QR Code
      JSON.stringify(oldData),    // Previous Value
      JSON.stringify(newData),    // New Value
      userRole                    // User role based on PIN code
    ]);

    return {
      success: true,
      message: "Seed details updated successfully"
    };
  } catch (error) {
    console.error("Error in updateSeedDetails:", error);
    return {
      success: false,
      message: "Error updating seed details: " + error.toString()
    };
  }
}

/**
 * Fetches all seed details with optional inventory filtering
 */
function fetchSeedDetails(inventoryFilter = null) {
  console.log("FETCHING SEED DETAILS");
  if (inventoryFilter) {
    console.log("Filtering by inventory: " + inventoryFilter);
  }
  
  try {
    const spreadsheetId = '1kVzhjXX45GLnqiLiqmeg81sy0FAtEd70EcMAo2_Ejlc';
    const sheetName = SHEET_NAMES.FORM_RESPONSES;
    
    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found`);
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      throw new Error("No data found in the spreadsheet");
    }
    
    const headers = data[0];
    const results = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const seedRecord = mapRowToSeedRecord(headers, row);
      
      if (!inventoryFilter || seedRecord.INVENTORY === inventoryFilter) {
        results.push(seedRecord);
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('Error in fetchSeedDetails: ' + error.message);
    throw error;
  }
}

// Helper function to map a spreadsheet row to seed record object
function mapRowToSeedRecord(headers, row) {
  const result = {
    "LOCATION": "",
    "SEED_CLASS": "",
    "VARIETY": "",
    "LAST_MODIFIED": "",
    "MOISTURE_CONTENT": "",
    "CROP": "",
    "INVENTORY": "",
    "BAG_NUMBER": "",
    "UNIT": "",
    "STORED_DATE": "",
    "VOLUME": "",
    "GERMINATION_RATE": "",
    "CODE": "",
    "QR_DOCUMENT": "",
    "HARVEST_DATE": "",
    "LOT_NUMBER": "",
    "PROGRAM": ""
  };
  
  // Map columns to standardized fields
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const value = row[i] || '';
    const fieldKey = getFieldKeyFromHeader(header);
    
    if (fieldKey) {
      // Process the value based on field type
      let processedValue = value;
      
      // Format dates to MM/DD/YYYY
      if (value instanceof Date) {
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const day = String(value.getDate()).padStart(2, '0');
        const year = value.getFullYear();
        processedValue = `${month}/${day}/${year}`;
      }
      
      // Convert to numbers for numeric fields
      if (['MOISTURE_CONTENT', 'GERMINATION_RATE', 'VOLUME', 'BAG_NUMBER', 'LOT_NUMBER'].includes(fieldKey)) {
        const numValue = parseFloat(processedValue);
        if (!isNaN(numValue)) {
          processedValue = numValue;
        }
      }
      
      result[fieldKey] = processedValue;
    }
  }
  
  return result;
}

// Helper function to get field key from column header
function getFieldKeyFromHeader(header) {
  const requiredFieldMapping = {
    "Location": "LOCATION",
    "Seed Class": "SEED_CLASS",
    "Variety": "VARIETY",
    "Last Modified": "LAST_MODIFIED",
    "Moisture Content (%)": "MOISTURE_CONTENT",
    "Crop": "CROP",
    "Inventory": "INVENTORY",
    "Bag Number": "BAG_NUMBER",
    "Unit": "UNIT",
    "Date Stored": "STORED_DATE",
    "Volume Stored": "VOLUME",
    "Germination Rate (%)": "GERMINATION_RATE",
    "Code": "CODE",
    "QR Document": "QR_DOCUMENT",
    "Date of Harvest": "HARVEST_DATE",
    "Lot Number": "LOT_NUMBER",
    "Program": "PROGRAM"
  };
  
  return requiredFieldMapping[header] || null;
}

/**
 * Google Apps Script for Inventory Data Management
 * Fetches and processes inventory withdrawal logs and form responses
 */

// Configuration
const SHEET_NAMES = {
  WITHDRAWAL_LOGS: 'Withdrawal Logs',
  FORM_RESPONSES: 'Form Responses',
  EDIT_LOGS: 'Edit Logs'
};

/**
 * Get withdrawal logs with optional QR Code filtering
 * @param {string|null} qrCode - QR Code to filter by. If null/undefined, returns all data
 * @returns {Array} Array of withdrawal log objects, empty array if no matches found
 */
function getWithdrawalLogs(qrCode = null) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.WITHDRAWAL_LOGS);
    
    if (!sheet) {
      throw new Error(`Sheet "${SHEET_NAMES.WITHDRAWAL_LOGS}" not found`);
    }
    
    // Get the last row and column with data
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();
    
    if (lastRow <= 1) {
      return []; // No data rows
    }
    
    // Get headers first to find QR Code column index
    const headerRange = sheet.getRange(1, 1, 1, lastColumn);
    const headers = headerRange.getValues()[0];
    
    // Find QR Code column index (should be column 2 based on your sample)
    const qrCodeColumnIndex = headers.findIndex(header => 
      header.toString().toLowerCase().replace(/\s+/g, '').includes('qrcode')
    );
    
    if (qrCode && qrCodeColumnIndex === -1) {
      console.warn('QR Code column not found, returning empty array');
      return [];
    }
    
    // Get all data including headers
    const range = sheet.getRange(1, 1, lastRow, lastColumn);
    const values = range.getValues();
    
    // Convert data to array of objects with filtering
    const data = [];
    
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      
      // Early exit: Skip row if QR Code filter is provided and doesn't match exactly
      if (qrCode && String(row[qrCodeColumnIndex]).trim() !== String(qrCode).trim()) {
        continue;
      }
      
      const rowData = {};
      
      // Process each column
      headers.forEach((header, index) => {
        let value = row[index];
        
        // Format timestamp if it's the timestamp column
        if (header.toLowerCase().includes('timestamp') && value instanceof Date) {
          value = Utilities.formatDate(value, Session.getScriptTimeZone(), 'MM/dd/yyyy HH:mm:ss');
        }
        
        // Convert all values to strings and handle null/undefined
        if (value === null || value === undefined || value === '') {
          value = '';
        } else {
          value = String(value);
        }
        
        // Create standardized property name
        rowData[header.toUpperCase().replace(/\s+/g, '_')] = value;
      });
      
      data.push(rowData);
    }
    
    console.log(`Fetched ${data.length} withdrawal logs${qrCode ? ` for QR Code: ${qrCode}` : ''}`);
    return data;
    
  } catch (error) {
    console.error('Error fetching withdrawal logs:', error);
    throw error;
  }
}

// Usage examples:

// Get all withdrawal logs
// const allLogs = getWithdrawalLogs();

// Get logs for specific QR Code (exact match only)
// const specificLogs = getWithdrawalLogs("Sbn19-5-6-05-18-2025-O");

// If no matches found, returns empty array []
// const noMatches = getWithdrawalLogs("NonExistentQRCode");