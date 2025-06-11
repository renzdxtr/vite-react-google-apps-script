const DOC_TEMPLATE_ID = '1W_QrPRXWLsgliqV1onfelgyuEC4WsuWZReIXZM2egJM'
const QR_DOC_FOLDER_PATH = 'PROJECTS/SIS/QR Documents'
const QR_DOC_FOLDER_ID = '1FBmHT-f2gCeCx3HqBQefgk-U9oQHNbMT'; // ID of the shared QR documents folder

// Assumes COLUMN_NAMES and updateCellByHeader() are globally defined
function generateSingleDocFromSeed(seedData, row, qrImageBlob = null, folderId = QR_DOC_FOLDER_ID) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Form Responses');

  let directQrLink;

  // Check if document already exists for this row
  const existingDocUrl = sheet.getRange(row, getColumnIndexByHeader(sheet, COLUMN_NAMES.QR_DOCUMENT)).getValue();
  if (existingDocUrl) {
    console.log(`Document already exists for row ${row}, skipping generation`);
    return;
  }

  if (!qrImageBlob) {
    // Example: Assume the QR link is in the sheet, and fetched for this row
    const qrLink = sheet.getRange(row, getColumnIndexByHeader(sheet, COLUMN_NAMES.QR_IMAGE)).getValue();
    directQrLink = convertToDirectImageLink(qrLink);
  }

  // Update status to processing
  updateCellByHeader(sheet, row, COLUMN_NAMES.STATUS, '⏳ Processing...');
  SpreadsheetApp.flush();

  try {
    const newDoc = fillTemplateWithQRAndData( 
      templateId = DOC_TEMPLATE_ID, 
      seedData = seedData, 
      qrImageBlob = qrImageBlob,
      directQrLink = directQrLink,
      folderId = folderId  // Pass the folder ID to fillTemplateWithQRAndData
    );

    // Update sheet with generated doc link and status
    updateCellByHeader(sheet, row, COLUMN_NAMES.QR_DOCUMENT, newDoc.getUrl());
    updateCellByHeader(sheet, row, COLUMN_NAMES.STATUS, '✅ Generated');

  } catch (err) {
    console.error(`❌ Error generating document for row ${row}: ${err.message}`);
    updateCellByHeader(sheet, row, COLUMN_NAMES.STATUS, `❌ Error: ${err.message}`);
  }
}


function convertToDirectImageLink(url) {
  if (!url) return url;
  
  // Extract the file ID from various Google Drive URL formats
  let fileId = null;
  
  // Handle standard Google Drive sharing URLs
  let match = url.match(/\/d\/([a-zA-Z0-9_-]{25,})/);
  if (match) {
    fileId = match[1];
  } else {
    // Handle alternate format URLs
    match = url.match(/id=([a-zA-Z0-9_-]{25,})/);
    if (match) {
      fileId = match[1];
    }
  }
  
  return fileId ? fileId : url;
}

function fetchWithRetries(urlOrFileId, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      let imageBlob;
      
      // Check if this is a file ID (not a full URL)
      if (!urlOrFileId.includes('http')) {
        Logger.log(`Fetching image directly from Drive with ID: ${urlOrFileId}`);
        try {
          // Try to get the file directly from Drive
          const file = DriveApp.getFileById(urlOrFileId);
          imageBlob = file.getBlob();
          Logger.log(`Successfully retrieved image from Drive: ${file.getName()}`);
          return imageBlob.setName("qr.png");
        } catch (driveErr) {
          Logger.log(`Error accessing Drive file: ${driveErr.message}`);
          throw driveErr;
        }
      } else {
        // It's a URL, use the fetch approach
        Logger.log(`Attempting to fetch image from URL: ${urlOrFileId}`);
        const response = UrlFetchApp.fetch(urlOrFileId, { 
          muteHttpExceptions: true
        });
        
        const responseCode = response.getResponseCode();
        Logger.log(`Response code: ${responseCode}`);
        
        if (responseCode !== 200) {
          throw new Error(`HTTP error: ${responseCode}`);
        }
        
        const contentType = response.getHeaders()['Content-Type'] || '';
        Logger.log(`Content type: ${contentType}`);

        // Validate image type
        if (!contentType.startsWith('image/')) {
          // Try to get the content as text to see what's being returned
          const content = response.getContentText().substring(0, 200);
          Logger.log(`Received non-image content: ${content}...`);
          throw new Error(`Invalid content type: ${contentType}`);
        }
        
        imageBlob = response.getBlob();
      }

      return imageBlob.setName("qr.png");
    } catch (err) {
      const is429 = err.message.includes("429") || err.message.includes("Too Many Requests");
      Logger.log(`Retry ${i + 1} failed: ${err.message}`);
      if (i === retries - 1 || !is429) throw err;
      Utilities.sleep(Math.pow(2, i) * 1000); // exponential backoff
    }
  }
  throw new Error("Failed to fetch image after multiple retries.");
}

// Update the fillTemplateWithQRAndData function to use the folder ID
function fillTemplateWithQRAndData(
  templateId,
  seedData,
  qrImageBlob = null,
  qrImageUrl = null,
  folderId = QR_DOC_FOLDER_ID
) {
  // 1. Get the destination folder by ID
  let folder;
  try {
    folder = DriveApp.getFolderById(folderId);
  } catch (folderError) {
    console.error(`Error accessing document folder with ID ${folderId}: ${folderError.message}`);
    // Fall back to path-based approach
    folder = getOrCreateFolder('PROJECTS/SIS/QR Documents');
  }

  console.log("SEED DATA: ", seedData)

  // 2. Copy the template into the folder
  const fileName = seedData.Code ? `${seedData.Code}-DOCS` : 'Unknown';
  const file = DriveApp.getFileById(templateId).makeCopy(fileName, folder);
  const doc = DocumentApp.openById(file.getId());
  const body = doc.getBody();

  // 3. Fetch QR image blob if not provided
  const imageBlob = qrImageBlob || fetchWithRetries(qrImageUrl);
  const table = body.getTables()[0];
  if (!table) throw new Error("Template must contain at least one table");

  // 4. Helper to insert centered image in a cell
  function insertCenteredImage(cell, imageBlob, width = 100, height = 100) {
    cell.clear();
      const paragraph = cell.appendParagraph('');
      paragraph.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      const img = paragraph.insertInlineImage(0, imageBlob);
    
      // Set desired image size (width and height in points)
      img.setWidth(width);
      img.setHeight(height);
  }

  // 5. Insert QR images into top left and right cells
  const qrSize = 274.5
  insertCenteredImage(table.getCell(0, 0), imageBlob, qrSize, qrSize);
  insertCenteredImage(table.getCell(0, 2), imageBlob, qrSize, qrSize);

  // 6. Prepare seed data lines
  const seedInfoLines = Object.values(seedData).map(String).join('\n');

  // 7. Insert seed data into cells
  const dataCellLeft = table.getCell(1, 1);
  const dataCellRight = table.getCell(1, 3);
  dataCellLeft.setText(seedInfoLines);
  dataCellRight.setText(seedInfoLines);

  // 8. Apply single line spacing (use getChild to access Paragraphs)
  [dataCellLeft, dataCellRight].forEach(cell => {
    const numChildren = cell.getNumChildren();
    for (let i = 0; i < numChildren; i++) {
      const child = cell.getChild(i);
      if (child.getType() === DocumentApp.ElementType.PARAGRAPH) {
        child.asParagraph().setLineSpacing(1);
      }
    }
  });

  // 9. Save document
  doc.saveAndClose();

  Logger.log(`✅ Document saved & renamed: ${seedData.Code}-DOCS (${file.getId()})`);
  return doc;
}