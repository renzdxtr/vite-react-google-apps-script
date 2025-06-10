import { SAMPLE_DATA_INVENTORY, SAMPLE_WITHDRAWAL } from "@/lib/constants";

// Check if running in Google Apps Script environment
const isGoogleAppsScript = typeof google !== 'undefined' && google.script;

// Create mock functions for development
const mockFetchSeedDetails = (qrCode) => {
  return Promise.resolve({
      "VARIETY": "Test Variety 291",
      "SEED_CLASS": "Certified",
      "LOCATION": "Conventional",
      "SEED_PHOTO": "https://drive.google.com/open?id=1OKJg9jK4QdJ70MABD8bCvx1UsHVF6XIo",
      "MOISTURE_CONTENT": 100,
      "LAST_MODIFIED": "Mon Jun 02 2025 13:06:13 GMT+0800 (Philippine Standard Time)",
      "REMARKS": "Test remarks ASD",
      "EMAIL": "test@example.com",
      "CROP": "Corn TEST",
      "STATUS": "✅ Generated",
      "INVENTORY": "Seed Storage",
      "TIMESTAMP": "Fri May 09 2025 14:30:09 GMT+0800 (Philippine Standard Time)",
      "CROP_PHOTO": "https://drive.google.com/open?id=19igwvzhh25Ij0wFNGlFjVeETu3WrZ1C2",
      "QR_IMAGE": "https://drive.google.com/file/d/1i0IvFEyaSBPXzMBatCbms9zs-KxdJX7t/view?usp=drivesdk",
      "BAG_NUMBER": "45",
      "UNIT": "Grams (g)",
      "STORED_DATE": "Mon Jun 02 2025 11:28:00 GMT+0800 (Philippine Standard Time)",
      "VOLUME": 250,
      "NAME": "Test User",
      "GERMINATION_RATE": 100,
      "CODE": qrCode,
      "QR_DOCUMENT": "https://docs.google.com/open?id=1BLFrsU3sylv5UObJxYev_QYHK9JctzCnqn4zNcS9iGU",
      "HARVEST_DATE": "Mon Jun 02 2025 11:31:00 GMT+0800 (Philippine Standard Time)",
      "ARCHIVED": "",
      "LOT_NUMBER": "123",
      "PROGRAM": "HVCDP"
  });
};

const mockUpdateSeedVolume = (data) => {
  return Promise.resolve({
    success: true,
    message: 'Mock update successful'
  });
};

// Export functions with environment check
export function getSheetData(sheetName) {
  if (isGoogleAppsScript) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler((res) => {
          console.log(res);
          resolve(res);
        })
        .withFailureHandler((msg) => {
          console.log(msg);
          reject(msg);
        })
        .getSheetData(sheetName);
    });
  }
  // Return mock data for development
  return Promise.resolve([/* mock sheet data */]);
}

export function fetchSeedDetailsByQrCode(qrCode) {
  if (isGoogleAppsScript) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler((res) => {
          console.log("Seed details fetched:", res);
          resolve(processSeedDetails(res));
        })
        .withFailureHandler((msg) => {
          console.error("Error fetching seed details:", msg);
          reject(msg);
        })
        .fetchSeedDetailsByQrCode(qrCode);
    });
  }
  // Return mock data for development
  return mockFetchSeedDetails(qrCode);
}

export function updateSeedVolume(data) {
  if (isGoogleAppsScript) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler((res) => {
          // Ensure we always return an object with success property
          const response = {
            success: res?.success ?? false,
            message: res?.message || 'Operation completed',
            data: res
          };
          console.log("Seed volume updated:", response);
          resolve(response);
        })
        .withFailureHandler((msg) => {
          console.error("Error updating seed volume:", msg);
          reject({
            success: false,
            message: msg || 'Failed to update seed volume',
            error: msg
          });
        })
        .updateSeedVolume(data);
    });
  }
  // Return mock response for development
  return mockUpdateSeedVolume(data);
}

export function updateSeedDetails(data) {
  if (isGoogleAppsScript) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler((res) => {
          const response = {
            success: res?.success ?? false,
            message: res?.message || 'Operation completed',
            data: res
          };
          console.log("Seed details updated:", response);
          resolve(response);
        })
        .withFailureHandler((msg) => {
          console.error("Error updating seed details:", msg);
          reject({
            success: false,
            message: msg || 'Failed to update seed details',
            error: msg
          });
        })
        .updateSeedDetails(data); // data now includes pinCode
    });
  }
  // Return mock response for development
  return Promise.resolve({
    success: true,
    message: 'Mock update successful',
    data: data
  });
}

// Process seed details to format dates consistently
function processSeedDetails(details) {
  if (!details) return details;
  
  const processedDetails = {...details};
  
  // Format date fields
  const dateFields = ['STORED_DATE', 'HARVEST_DATE', 'LAST_MODIFIED', 'TIMESTAMP'];
  dateFields.forEach(field => {
    if (processedDetails[field]) {
      processedDetails[field] = formatDateForDisplay(processedDetails[field]);
    }
  });
  
  return processedDetails;
}

// Helper function to format dates consistently
function formatDateForDisplay(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  } catch (e) {
    console.error("Date formatting error:", e);
    return dateString;
  }
}

const mockFetchAllSeedDetails = (inventoryFilter) => {
  console.log("Mock fetchAllSeedDetails called with filter:", inventoryFilter);
  // Return mock data for development
  return Promise.resolve(SAMPLE_DATA_INVENTORY);
};

export function fetchAllSeedDetails(inventoryFilter) {
  if (isGoogleAppsScript) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler((res) => {
          console.log("All seed details fetched:", res);
          resolve(res);
        })
        .withFailureHandler((msg) => {
          console.error("Error fetching all seed details:", msg);
          reject(msg);
        })
        .fetchSeedDetails(inventoryFilter);
    });
  }
  // Return mock data for development
  return mockFetchAllSeedDetails(inventoryFilter);
}

// Mock function for development environment
const mockFetchAllWithdrawalDetails = (qrCode = null) => {
  console.log("Mock fetchAllWithdrawalDetails called with QR code:", qrCode);
  // Return mock data for development
  return Promise.resolve(SAMPLE_WITHDRAWAL);
};

export function fetchAllWithdrawalDetails(qrCode = null) {
  if (isGoogleAppsScript) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler((res) => {
          console.log("All withdrawal details fetched:", res);
          resolve(res);
        })
        .withFailureHandler((msg) => {
          console.error("Error fetching all withdrawal details:", msg);
          reject(msg);
        })
        .getWithdrawalLogs(qrCode);
    });
  }
  // Return mock data for development
  return mockFetchAllWithdrawalDetails(qrCode);
}