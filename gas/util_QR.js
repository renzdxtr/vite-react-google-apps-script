// At the top of the file, add these constants
const QR_CODE_FOLDER_PATH = 'PROJECTS/SIS/QR Codes';
// Replace these with your actual folder IDs
const QR_CODE_FOLDER_ID = '10A5aXDvJb75SlCTtjE1JazTQ6I70E55u'; // ID of the shared QR codes folder

function generateQRCodeImageDoc(seedData, context) {
  if (context.generateQR === true) {
    // Generate QR code and save the image to Drive
    qrInfo = createAndSaveQRCode(seedData);
    
    // Update the sheet with QR code text and image URL using column names
    updateCellByHeader(context.sheet, context.row, COLUMN_NAMES.CODE, qrInfo.qrCodeText);
    updateCellByHeader(context.sheet, context.row, COLUMN_NAMES.QR_IMAGE, qrInfo.fileUrl);

    if (context.renamePhoto === true){
      // Rename photos using the QR code format
      renamePhoto(seedData.SeedPhoto, qrInfo.qrCodeText + '-SEED');
      renamePhoto(seedData.CropPhoto, qrInfo.qrCodeText + '-STANDING');
    }
  
    if (context.generateDoc === true) {
      // Generate QR Document from Template - pass the QR image blob directly
      generateSingleDocFromSeed(qrInfo.qrSeedData, context.row, qrInfo.qrBlob);
    }
  }
}

/**
 * Utility functions for QR code generation and management
 */

/**
 * Generates a QR code image using goqr.me API
 * 
 * @param {Object} seedData The seed data object containing all required fields
 * @param {number} size The size of the QR code image in pixels (default: 300)
 * @return {Blob} The QR code image as a blob
 */

function generateQRCodeImage(qrCode, size = 300) {
  try {
    // Ensure size is within acceptable limits (100-1000)
    size = Math.max(100, Math.min(1000, size));
    
    // Create the goqr.me API URL for QR code generation
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrCode)}`;
    
    // Fetch the QR code image
    const response = UrlFetchApp.fetch(apiUrl);
    
    // Return the image as a blob
    return response.getBlob().setName(`${qrCode}-QR.png`)

  } catch (error) {
    console.error(`Error generating QR code image: ${error.toString()}`);
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
}

function generateQRCodeData(seedData) {
  console.log('Generate QR:', seedData)

  // Create the JSON object for the QR code
  const qrCodeData = {
    Code: generateQRCode(seedData.Variety, seedData.LotNo, seedData.BagNo, seedData.DateStored, seedData.Location),
    Crop: seedData.Crop || "",
    Variety: seedData.Variety || "",
    LotNo: seedData.LotNo || "",
    BagNo: seedData.BagNo || "",
    DateStored: seedData.DateStored || "",
    VolumeStored: seedData.VolumeStored || "",
    SeedClass: seedData.SeedClass || "",
    GerminationRate: seedData.GerminationRate || "",
    MoistureContent: seedData.MoistureContent || "",
    Program: seedData.Program || "",
  };

  return qrCodeData;
}

/**
 * Generates a unique QR code identifier
 * 
 * @param {string} variety The seed variety
 * @param {string} lotNumber The lot number
 * @param {string} bagNumber The bag number
 * @param {string} dateOfHarvest The date of harvest
 * @param {string} location The location code (C, O, or PM)
 * @return {string} The formatted QR code identifier
 */
function generateQRCode(variety, lotNumber, bagNumber, dateOfHarvest, location) {
  // Format: [VARIETY]-[LOT-NUMBER]-[BAG-NUMBER]-[DATE-OF-HARVEST]-[LOCATION]
  return `${variety || "UNK"}-${lotNumber || "UNK"}-${bagNumber || "UNK"}-${dateOfHarvest || "UNK"}-${getLocationAbbreviation(location)}`;
}

/**
 * Gets the location abbreviation based on the location value
 * 
 * @param {string} location The full location value
 * @return {string} The location abbreviation (C, O, PM)
 */
function getLocationAbbreviation(location) {
  if (!location) return "UNK"; // Unknown
  
  // Convert to lowercase for case-insensitive matching
  const locationLower = location.toLowerCase();
  
  if (locationLower.includes("conventional")) return "C";
  if (locationLower.includes("organic")) return "O";
  if (locationLower.includes("plant nursery")) return "PM";
  
  // If no match, return the first character or the full value if it's short
  return location.length <= 3 ? location : location.substring(0, 3);
}

/**
 * Creates a QR code and saves it to Drive
 * 
 * @param {Object} seedData The seed data object containing all required fields
 * @param {number} size The size of the QR code image in pixels (default: 300)
 * @param {string} folderId Optional folder ID to save the QR code to
 * @return {Object} Object containing the QR code text, file ID, and URL
 */
function createAndSaveQRCode(seedData, size = 300, folderId = null) {
  try {
    // Check if we already have a QR code for this data
    const qrCodeData = generateQRCodeData(seedData);
    const qrCodeText = qrCodeData.Code
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Form Responses');
    
    // Find the row with this QR code
    const qrCodeColumn = getColumnIndexByHeader(sheet, COLUMN_NAMES.CODE);
    const qrImageColumn = getColumnIndexByHeader(sheet, COLUMN_NAMES.QR_IMAGE);
    const dataRange = sheet.getRange(2, qrCodeColumn, sheet.getLastRow() - 1, 1).getValues();
    
    for (let i = 0; i < dataRange.length; i++) {
      if (dataRange[i][0] === qrCodeText) {
        const row = i + 2; // +2 because we start from row 2 and i is 0-based
        const existingQrUrl = sheet.getRange(row, qrImageColumn).getValue();
        
        if (existingQrUrl) {
          console.log(`QR code already exists for ${qrCodeText}, reusing existing QR`);
          // For existing QR codes, we'll need to fetch the blob
          const fileId = extractFileId(existingQrUrl);
          let qrBlob = null;
          try {
            qrBlob = DriveApp.getFileById(fileId).getBlob();
          } catch (blobErr) {
            console.warn(`Could not get blob for existing QR: ${blobErr.message}`);
          }
          
          return {
            qrCodeText: qrCodeText,
            fileId: fileId,
            fileUrl: existingQrUrl,
            qrSeedData: qrCodeData,
            qrBlob: qrBlob
          };
        }
      }
    }
    
    // Generate the QR code image
    const generatedQRCode = generateQRCodeImage(qrCodeText, size);
    
    // Save the QR code to Drive, passing the folder ID
    const fileInfo = saveQRCodeToDrive(generatedQRCode, QR_CODE_FOLDER_PATH, folderId);
    
    // Return the QR code information with the blob
    return {
      qrCodeText: qrCodeText,
      fileId: fileInfo.fileId,
      fileUrl: fileInfo.fileUrl,
      qrSeedData: qrCodeData,
      qrBlob: generatedQRCode
    };
  } catch (error) {
    console.error(`Error creating and saving QR code: ${error.toString()}`);
    throw error;
  }
}

/**
 * Saves a QR code image to Google Drive
 * 
 * @param {Blob} qrBlob The QR code image blob
 * @param {string} folderPath The path to the folder where the QR code should be saved
 * @param {string} folderId Optional folder ID to use instead of path
 * @return {Object} Object containing the file ID and URL of the saved QR code image
 */
function saveQRCodeToDrive(qrBlob, folderPath = QR_CODE_FOLDER_PATH, folderId = null) {
  try {
    let folder;
    
    // If folder ID is provided, use it directly
    if (folderId) {
      try {
        folder = DriveApp.getFolderById(folderId);
      } catch (folderError) {
        console.error(`Error accessing folder with ID ${folderId}: ${folderError.message}`);
        // Fall back to path-based approach
        folder = getOrCreateFolder(folderPath);
      }
    } else {
      // Otherwise use the path-based approach
      folder = getOrCreateFolder(folderPath);
    }
    
    // Create the file in the folder
    const file = folder.createFile(qrBlob);
    
    // Return the file information
    return {
      fileId: file.getId(),
      fileUrl: file.getUrl()
    };
  } catch (error) {
    console.error(`Error saving QR code to Drive: ${error.toString()}`);
    throw error;
  }
}

// Keep the original getOrCreateFolder function as a fallback
function getOrCreateFolder(folderPath) {
  // Split the path into components
  const pathComponents = folderPath.split('/');
  
  // Start with the root Drive folder
  let currentFolder = DriveApp.getRootFolder();
  
  // Navigate through each path component
  for (const folderName of pathComponents) {
    // Skip empty folder names
    if (!folderName) continue;
    
    // Look for the folder in the current location
    const folderIterator = currentFolder.getFoldersByName(folderName);
    
    // If the folder exists, use it
    if (folderIterator.hasNext()) {
      currentFolder = folderIterator.next();
    } else {
      // If the folder doesn't exist, create it
      currentFolder = currentFolder.createFolder(folderName);
    }
  }
  
  return currentFolder;
}