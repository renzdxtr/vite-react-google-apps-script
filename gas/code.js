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
    const sheetName = 'Form Responses';
    
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
      
      // Convert Date objects to strings to ensure they can be serialized
      const processedValue = value instanceof Date ? value.toString() : value;
      
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