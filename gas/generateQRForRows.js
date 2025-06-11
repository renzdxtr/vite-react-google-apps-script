/**
 * Generates QR codes and documents for specified rows
 * 
 * @param {string} rowsInput - Row specification (e.g., "2", "1-5", "1,3,5")
 * @param {boolean} forceRegenerate - Whether to regenerate for rows that already have QR codes/docs
 * @return {Object} Summary of processing results
 */
function generateQRForRows(rowsInput, forceRegenerate = false) {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Form Responses');
  
  if (!sheet) {
    ui.alert('Error', 'Form Responses sheet not found', ui.ButtonSet.OK);
    return;
  }
  
  // Parse row input (single number, range, or comma-separated)
  const rows = parseRowInput(rowsInput, sheet.getLastRow());
  
  if (rows.length === 0) {
    ui.alert('Error', 'No valid rows specified', ui.ButtonSet.OK);
    return;
  }
  
  // Show progress indicator
  const statusRange = sheet.getRange(1, getColumnIndexByHeader(sheet, COLUMN_NAMES.STATUS));
  const originalStatus = statusRange.getValue();
  statusRange.setValue('⏳ Processing batch...');
  SpreadsheetApp.flush();
  
  // Track results
  const results = {
    total: rows.length,
    processed: 0,
    skipped: 0,
    failed: 0,
    details: []
  };
  
  try {
    // Process rows in batches to avoid hitting quotas
    const BATCH_SIZE = 5;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batchRows = rows.slice(i, i + BATCH_SIZE);
      processBatch(batchRows, results, sheet, forceRegenerate);
      
      // Update progress indicator
      const progress = Math.round((i + batchRows.length) / rows.length * 100);
      statusRange.setValue(`⏳ Processing: ${progress}% (${i + batchRows.length}/${rows.length})`);
      SpreadsheetApp.flush();
      
      // Pause briefly between batches to avoid hitting quotas
      if (i + BATCH_SIZE < rows.length) {
        Utilities.sleep(1000);
      }
    }
    
    // Show summary toast
    const message = `Processing complete: ${results.processed} generated, ${results.skipped} skipped, ${results.failed} failed`;
    SpreadsheetApp.getActiveSpreadsheet().toast(message, 'QR Generation Summary', 30);
    
    // Log detailed results
    Logger.log(`QR Generation Results: ${JSON.stringify(results, null, 2)}`);
    
  } catch (error) {
    ui.alert('Error', `Processing failed: ${error.message}`, ui.ButtonSet.OK);
    Logger.log(`Error in batch processing: ${error.toString()}`);
  } finally {
    // Restore original status
    statusRange.setValue(originalStatus);
    SpreadsheetApp.flush();
  }
  
  return results;
}

/**
 * Parses row input string into array of row numbers
 * 
 * @param {string} input - Row specification (e.g., "2", "1-5", "1,3,5")
 * @param {number} maxRow - Maximum valid row number
 * @return {number[]} Array of row numbers
 */
function parseRowInput(input, maxRow) {
  if (!input || typeof input !== 'string') {
    return [];
  }
  
  const rows = new Set();
  
  // Split by comma first
  const parts = input.split(',');
  
  parts.forEach(part => {
    part = part.trim();
    
    // Check if it's a range (contains hyphen)
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(num => parseInt(num.trim(), 10));
      
      if (!isNaN(start) && !isNaN(end)) {
        // Add all rows in the range
        for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
          if (i >= 2 && i <= maxRow) { // Row 1 is header
            rows.add(i);
          }
        }
      }
    } else {
      // Single row number
      const rowNum = parseInt(part, 10);
      if (!isNaN(rowNum) && rowNum >= 2 && rowNum <= maxRow) {
        rows.add(rowNum);
      }
    }
  });
  
  return Array.from(rows).sort((a, b) => a - b);
}

/**
 * Processes a batch of rows
 * 
 * @param {number[]} rows - Array of row numbers to process
 * @param {Object} results - Results object to update
 * @param {Sheet} sheet - The spreadsheet sheet
 * @param {boolean} forceRegenerate - Whether to regenerate existing QR codes/docs
 */
function processBatch(rows, results, sheet, forceRegenerate) {
  rows.forEach(row => {
    try {
      // Check if QR code and document already exist
      const qrImageUrl = sheet.getRange(row, getColumnIndexByHeader(sheet, COLUMN_NAMES.QR_IMAGE)).getValue();
      const qrDocUrl = sheet.getRange(row, getColumnIndexByHeader(sheet, COLUMN_NAMES.QR_DOCUMENT)).getValue();
      
      if (!forceRegenerate && qrImageUrl && qrDocUrl) {
        // Skip if both already exist and we're not forcing regeneration
        results.skipped++;
        results.details.push({
          row: row,
          status: 'skipped',
          reason: 'QR code and document already exist'
        });
        return;
      }

      // Extract all needed seed data using column names
      const seedData = extractSeedDataFromSheet(sheet, row);
      
      let qrInfo = null;
      
      // Generate QR code if needed
      if (!qrImageUrl || forceRegenerate) {
        // Generate the QR code and get the seed data and blob
        // Pass the QR_CODE_FOLDER_ID to ensure files are saved to the shared folder
        qrInfo = createAndSaveQRCode(seedData, 300, QR_CODE_FOLDER_ID);
        
        // Update the sheet with QR code text and image URL
        updateCellByHeader(sheet, row, COLUMN_NAMES.CODE, qrInfo.qrCodeText);
        updateCellByHeader(sheet, row, COLUMN_NAMES.QR_IMAGE, qrInfo.fileUrl);
      }
      
      // Generate QR document if needed
      if (!qrDocUrl || forceRegenerate) {
        // If we already generated a QR code, use its data and blob
        if (qrInfo) {
          // Pass the QR_DOC_FOLDER_ID to ensure documents are saved to the shared folder
          generateSingleDocFromSeed(qrInfo.qrSeedData, row, qrInfo.qrBlob, QR_DOC_FOLDER_ID);
        } else {
          // Otherwise, generate the document without the blob optimization
          const qrSeedData = generateQRCodeData(seedData);
          generateSingleDocFromSeed(qrSeedData, row, null, QR_DOC_FOLDER_ID);
        }
      }
      
      results.processed++;
      results.details.push({
        row: row,
        status: 'success',
        code: seedData.Code
      });
      
    } catch (error) {
      results.failed++;
      results.details.push({
        row: row,
        status: 'failed',
        error: error.message
      });
      
      // Update status cell with error
      updateCellByHeader(sheet, row, COLUMN_NAMES.STATUS, `❌ Error: ${error.message}`);
      Logger.log(`Error processing row ${row}: ${error.toString()}`);
    }
  });
}

/**
 * Shows a dialog to input rows for QR generation
 */
function showQRGenerationDialog() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt(
    'Generate QR Codes and Documents',
    'Enter row numbers (e.g., "2", "1-5", "1,3,5"):',
    ui.ButtonSet.OK_CANCEL
  );
  
  // Process the user's response
  if (result.getSelectedButton() === ui.Button.OK) {
    const rowsInput = result.getResponseText();
    
    // Ask if user wants to regenerate existing QR codes
    const regenerateResult = ui.alert(
      'Regenerate Existing?',
      'Do you want to regenerate QR codes and documents that already exist?',
      ui.ButtonSet.YES_NO
    );
    
    const forceRegenerate = (regenerateResult === ui.Button.YES);
    
    // Run the generation process
    generateQRForRows(rowsInput, forceRegenerate);
  }
}