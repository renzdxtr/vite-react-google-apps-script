/**
 * Controller functions for inventory management
 */

/**
 * Updates inventory data based on form submissions or manual edits
 * 
 * @param {Object} inventoryData The inventory data object containing all required fields
 * @return {boolean} Success status of the update
 */
function updateInventory(inventoryData) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Inventory");
    const rowIndex = findRowByCode(inventoryData.Code);
    
    if (rowIndex === -1) {
      // New inventory item
      const newRow = [
        new Date(), // Timestamp
        inventoryData.Email,
        inventoryData.Name,
        inventoryData.Crop,
        inventoryData.Variety,
        inventoryData.LotNumber,
        inventoryData.BagNumber,
        inventoryData.HarvestDate,
        inventoryData.StoredDate,
        inventoryData.Volume,
        inventoryData.Unit,
        inventoryData.GerminationRate,
        inventoryData.MoistureContent,
        inventoryData.SeedClass,
        inventoryData.SeedPhoto,
        inventoryData.CropPhoto,
        inventoryData.Program,
        inventoryData.Remarks,
        inventoryData.Volume, // Initial inventory same as volume
        inventoryData.Location,
        false, // Not archived
        new Date(), // Last modified
        inventoryData.Code,
        inventoryData.QRImage
      ];
      sheet.appendRow(newRow);
      
      // Log the new inventory addition
      logInventoryChange(inventoryData.Code, "New", null, inventoryData);
    } else {
      // Update existing inventory
      const oldData = getInventoryItemByCode(inventoryData.Code);
      
      // Update only changed fields
      const range = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn());
      const values = range.getValues()[0];
      
      // Update specific columns using column indices
      const volumeIndex = getColumnIndexByName(sheet, COLUMN_NAMES.VOLUME) - 1;
      const inventoryIndex = getColumnIndexByName(sheet, COLUMN_NAMES.INVENTORY) - 1;
      const locationIndex = getColumnIndexByName(sheet, COLUMN_NAMES.LOCATION) - 1;
      const lastModifiedIndex = getColumnIndexByName(sheet, COLUMN_NAMES.LAST_MODIFIED) - 1;
      
      values[volumeIndex] = inventoryData.Volume;
      values[inventoryIndex] = inventoryData.Volume;
      values[locationIndex] = inventoryData.Location;
      values[lastModifiedIndex] = new Date();
      
      range.setValues([values]);
      
      // Check if volume is zero and prompt for archiving
      if (parseFloat(inventoryData.Volume) === 0) {
        // This will be handled by the UI to prompt the user
        // For now, we'll just log it
        Logger.log(`Inventory item ${inventoryData.Code} has zero volume. Consider archiving.`);
      }
      
      // Log the inventory update
      logInventoryChange(inventoryData.Code, "Update", oldData, inventoryData);
    }
    
    return true;
  } catch (error) {
    Logger.log(`Error updating inventory: ${error.message}`);
    return false;
  }
}

/**
 * Logs inventory changes for historical tracking
 * 
 * @param {string} itemCode The code of the inventory item
 * @param {string} changeType The type of change (New, Update, Archive)
 * @param {Object} oldData The old inventory data (null for new items)
 * @param {Object} newData The new inventory data
 */
function logInventoryChange(itemCode, changeType, oldData, newData) {
  try {
    const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("InventoryLog");
    if (!logSheet) {
      // Create log sheet if it doesn't exist
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const newSheet = ss.insertSheet("InventoryLog");
      
      // Set up headers
      newSheet.appendRow([
        "Timestamp", "Code", "Change Type", "User", "Old Volume", "New Volume", 
        "Old Location", "New Location", "Details"
      ]);
    }
    
    // Get user email
    const userEmail = Session.getActiveUser().getEmail();
    
    // Create log entry
    const logEntry = [
      new Date(), // Timestamp
      itemCode,
      changeType,
      userEmail,
      oldData ? oldData.Volume : "N/A",
      newData.Volume,
      oldData ? oldData.Location : "N/A",
      newData.Location,
      JSON.stringify({ old: oldData, new: newData })
    ];
    
    logSheet.appendRow(logEntry);
  } catch (error) {
    Logger.log(`Error logging inventory change: ${error.message}`);
  }
}

/**
 * Finds a row by inventory code
 * 
 * @param {string} code The inventory code to search for
 * @return {number} The row index (1-based) or -1 if not found
 */
function findRowByCode(code) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Inventory");
  const codeColumn = getColumnIndexByName(sheet, COLUMN_NAMES.CODE);
  const data = sheet.getRange(2, codeColumn, sheet.getLastRow() - 1, 1).getValues();
  
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === code) {
      return i + 2; // +2 because we start at row 2 and i is 0-based
    }
  }
  
  return -1;
}

/**
 * Gets inventory item by code
 * 
 * @param {string} code The inventory code
 * @return {Object} The inventory item data or null if not found
 */
function getInventoryItemByCode(code) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Inventory");
  const rowIndex = findRowByCode(code);
  
  if (rowIndex === -1) {
    return null;
  }
  
  const range = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn());
  const values = range.getValues()[0];
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const item = {};
  headers.forEach((header, index) => {
    item[header] = values[index];
  });
  
  return item;
}

/**
 * Retrieves historical changes for an inventory item
 * 
 * @param {string} itemCode The code of the inventory item
 * @return {Array} Array of historical changes
 */
function getInventoryHistory(itemCode) {
  // Implementation for retrieving inventory history
}

/**
 * Automatically classifies seeds based on multiple attributes
 * 
 * @param {Object} seedData The seed data object containing all required fields
 * @return {Object} An object containing classifications for each attribute
 */
function classifySeed(seedData) {
  const classifications = {};
  const formChoices = getSpecificFormChoices(); // Retrieve form choices

  // Classify based on Crop
  classifications.Crop = formChoices.Crop.includes(seedData.Crop) ? seedData.Crop : "Unknown";

  // Classify based on Moisture Content
  const moistureContent = parseFloat(seedData.MoistureContent);
  if (moistureContent < 10) {
    classifications.MoistureContent = "Low";
  } else if (moistureContent >= 10 && moistureContent <= 20) {
    classifications.MoistureContent = "Medium";
  } else {
    classifications.MoistureContent = "High";
  }

  // Classify based on Seed Class
  classifications.SeedClass = formChoices["Seed Class"].includes(seedData.SeedClass) ? seedData.SeedClass : "Unknown";

  // Classify based on Program
  classifications.Program = formChoices.Program.includes(seedData.Program) ? seedData.Program : "General";

  // Classify based on Location
  classifications.Location = formChoices.Location.includes(seedData.Location) ? getLocationAbbreviation(seedData.Location) : "UNK";

  return classifications;
}

/**
 * Retrieves the classification for a specific seed
 * 
 * @param {string} seedCode The code of the seed
 * @return {Object} The seed classification or null if not found
 */
function getSeedClass(seedCode) {
  const item = getInventoryItemByCode(seedCode);
  
  if (!item) {
    return null;
  }
  
  // Create a seed data object from the inventory item
  const seedData = {
    Crop: item.Crop,
    MoistureContent: item.MoistureContent,
    SeedClass: item.SeedClass,
    Program: item.Program,
    Location: item.Location
  };
  
  // Use the existing classifySeed function
  return classifySeed(seedData);
}

/**
 * Updates the location data for an inventory item
 * 
 * @param {string} itemCode The code of the inventory item
 * @param {string} newLocation The new location data
 * @return {boolean} Success status of the update
 */
function updateLocation(itemCode, newLocation) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Inventory");
    const rowIndex = findRowByCode(itemCode);
    
    if (rowIndex === -1) {
      return false;
    }
    
    // Get the old data for logging
    const oldData = getInventoryItemByCode(itemCode);
    
    // Update location
    const locationColumn = getColumnIndexByName(sheet, COLUMN_NAMES.LOCATION);
    const lastModifiedColumn = getColumnIndexByName(sheet, COLUMN_NAMES.LAST_MODIFIED);
    
    sheet.getRange(rowIndex, locationColumn).setValue(newLocation);
    sheet.getRange(rowIndex, lastModifiedColumn).setValue(new Date());
    
    // Create new data object for logging
    const newData = Object.assign({}, oldData);
    newData.Location = newLocation;
    
    // Log the change
    logInventoryChange(itemCode, "LocationUpdate", oldData, newData);
    
    return true;
  } catch (error) {
    Logger.log(`Error updating location: ${error.message}`);
    return false;
  }
}

/**
 * Retrieves detailed location information
 * 
 * @param {string} locationCode The code of the location (C, O, PM)
 * @return {Object} The location details
 */
function getLocationDetails(locationCode) {
  const locationMap = {
    "C": {
      name: "Conventional",
      description: "Seeds stored in conventional storage conditions"
    },
    "O": {
      name: "Organic",
      description: "Seeds stored in organic storage conditions"
    },
    "PM": {
      name: "Plant Nursery",
      description: "Seeds stored in plant nursery conditions"
    },
    "UNK": {
      name: "Unknown",
      description: "Location not specified or unknown"
    }
  };
  
  return locationMap[locationCode] || {
    name: locationCode,
    description: "Custom location"
  };
}

/**
 * Archives an inventory item based on specific criteria
 * 
 * @param {string} itemCode The code of the inventory item
 */
/**
 * Archives an inventory item
 * 
 * @param {string} itemCode The code of the inventory item
 * @param {boolean} archive Whether to archive (true) or unarchive (false)
 * @return {boolean} Success status of the operation
 */
function archiveInventoryItem(itemCode, archive = true) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Inventory");
    const rowIndex = findRowByCode(itemCode);
    
    if (rowIndex === -1) {
      return false;
    }
    
    // Get the old data for logging
    const oldData = getInventoryItemByCode(itemCode);
    
    // Update archived status
    const archivedColumn = getColumnIndexByName(sheet, COLUMN_NAMES.ARCHIVED);
    const lastModifiedColumn = getColumnIndexByName(sheet, COLUMN_NAMES.LAST_MODIFIED);
    
    sheet.getRange(rowIndex, archivedColumn).setValue(archive);
    sheet.getRange(rowIndex, lastModifiedColumn).setValue(new Date());
    
    // Create new data object for logging
    const newData = Object.assign({}, oldData);
    newData.Archived = archive;
    
    // Log the change
    logInventoryChange(itemCode, archive ? "Archive" : "Unarchive", oldData, newData);
    
    return true;
  } catch (error) {
    Logger.log(`Error ${archive ? "archiving" : "unarchiving"} inventory item: ${error.message}`);
    return false;
  }
}

/**
 * Suggests archiving for items with zero volume
 * 
 * @return {Array} Array of items with zero volume that could be archived
 */
function suggestItemsToArchive() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Inventory");
  const volumeColumn = getColumnIndexByName(sheet, COLUMN_NAMES.VOLUME);
  const archivedColumn = getColumnIndexByName(sheet, COLUMN_NAMES.ARCHIVED);
  const codeColumn = getColumnIndexByName(sheet, COLUMN_NAMES.CODE);
  
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  const itemsToArchive = [];
  
  data.forEach(row => {
    const volume = parseFloat(row[volumeColumn - 1]); // -1 because array is 0-based
    const archived = row[archivedColumn - 1];
    const code = row[codeColumn - 1];
    
    if (volume === 0 && !archived) {
      itemsToArchive.push({
        code: code,
        data: getInventoryItemByCode(code)
      });
    }
  });
  
  return itemsToArchive;
}

/**
 * Retrieves archived items for reporting or analysis
 * 
 * @return {Array} Array of archived items
 */
function retrieveArchivedItems() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Inventory");
  const archivedColumn = getColumnIndexByName(sheet, "Archived");
  
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const archivedItems = [];
  
  data.forEach(row => {
    const archived = row[archivedColumn - 1]; // -1 because array is 0-based
    
    if (archived) {
      const item = {};
      headers.forEach((header, index) => {
        item[header] = row[index];
      });
      archivedItems.push(item);
    }
  });
  
  return archivedItems;
}

/**
 * Gets the column index by name
 * 
 * @param {Sheet} sheet The sheet to search in
 * @param {string} columnName The name of the column
 * @return {number} The column index (1-based) or -1 if not found
 */
function getColumnIndexByName(sheet, columnName) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  for (let i = 0; i < headers.length; i++) {
    if (headers[i] === columnName) {
      return i + 1; // +1 because getRange is 1-based
    }
  }
  
  return -1;
}