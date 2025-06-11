/**
 * Handles form submissions and processes the data
 * 
 * @param {Object} e The form submission event object
 */
function onFormSubmit(e) {
  // Use a lock to prevent concurrent execution
  const lock = LockService.getScriptLock();
  const lockAcquired = lock.tryLock(30000); // try to get lock for 30 seconds
  
  if (!lockAcquired) {
    console.log("Could not acquire lock. Another execution might be in progress.");
    return;
  }
  
  try {
    // Log the form submission
    console.log("Form submitted: " + new Date());
    
    // Get the active sheet
    const sheet = SpreadsheetApp.getActiveSheet();
    const row = sheet.getLastRow();

    // Extract all needed seed data using column names
    const seedData = extractSeedDataFromSheet(sheet, row);

    console.log("DATE STORED: ", seedData.DateStored)

    const context = {
      sheet: sheet,
      row: row,
      generateQR: true,
      renamePhoto: true,
      generateDoc: true
    }
    
    // Generate QR Code, Image, and Doc
    generateQRCodeImageDoc(seedData, context)
    
    // Log success
    console.log("Form processing completed successfully");
  } catch (error) {
    console.error("Error processing form submission: " + error.toString());
    // TODO: Implement error notification system
  } finally {
    lock.releaseLock();
  }
}

function extractSeedDataFromSheet(sheet, row) {
  // Extract all needed seed data using column names
  const seedData = {
    Crop: getCellValueByHeader(sheet, row, COLUMN_NAMES.CROP) || "",
    Variety: getCellValueByHeader(sheet, row, COLUMN_NAMES.VARIETY) || "",
    LotNo: getCellValueByHeader(sheet, row, COLUMN_NAMES.LOT_NUMBER) || "",
    BagNo: getCellValueByHeader(sheet, row, COLUMN_NAMES.BAG_NUMBER) || "",
    DateStored: formatDate(getCellValueByHeader(sheet, row, COLUMN_NAMES.STORED_DATE)) || "",
    VolumeStored: getCellValueByHeader(sheet, row, COLUMN_NAMES.VOLUME) || "",
    SeedClass: getCellValueByHeader(sheet, row, COLUMN_NAMES.SEED_CLASS) || "",
    Location: getCellValueByHeader(sheet, row, COLUMN_NAMES.LOCATION) || "",
    SeedPhoto: getCellValueByHeader(sheet, row, COLUMN_NAMES.SEED_PHOTO) || "",
    CropPhoto: getCellValueByHeader(sheet, row, COLUMN_NAMES.CROP_PHOTO) || "",
    GerminationRate: getCellValueByHeader(sheet, row, COLUMN_NAMES.GERMINATION_RATE) || "",
    MoistureContent: getCellValueByHeader(sheet, row, COLUMN_NAMES.MOISTURE_CONTENT) || "",
    Program: getCellValueByHeader(sheet, row, COLUMN_NAMES.PROGRAM) || "",
  };

  return seedData
}

// Helper function to format date as MM-DD-YYYY
function formatDate(dateString) {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}-${day}-${year}`;
}

/**
 * Sets up the form submission trigger
 */
function setupFormTrigger() {
  try {
    // Create new trigger for form submissions
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    ScriptApp.newTrigger('onFormSubmit')
      .forSpreadsheet(sheet)
      .onFormSubmit()
      .create();
    
    SpreadsheetApp.getUi().alert('Form submission trigger set up successfully');
  } catch (error) {
    // Show a more user-friendly error message
    SpreadsheetApp.getUi().alert(
      'Additional permissions required. Please try again and accept the permissions request.\n\n' +
      'Error details: ' + error.toString()
    );
  }
}

/**
 * Creates a menu item to process the last entry manually
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Seed Inventory')
    .addItem('Setup Form Trigger', 'setupFormTrigger')
    .addItem('Generate QR Codes for Rows', 'showQRGenerationDialog')
    .addToUi();
}

/**
 * Rename the photo
 */
function renamePhoto(fileUrl, newName) {
  if (!fileUrl) return;

  const fileId = extractFileId(fileUrl);
  if (!fileId) return;

  try {
    const file = DriveApp.getFileById(fileId);
    file.setName(newName);
  } catch (error) {
    console.error(`Failed to rename file: ${fileId}, Reason: ${error.message}`);
  }
}

function extractFileId(url) {
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}