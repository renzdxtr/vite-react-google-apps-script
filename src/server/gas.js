// Check if running in Google Apps Script environment
const isGoogleAppsScript = typeof google !== 'undefined' && google.script;

// Create mock functions for development
const mockFetchSeedDetails = (qrCode) => {
  return Promise.resolve({
      "VARIETY": "Test Variety 291",
      "SEED_CLASS": "Certified TEST",
      "LOCATION": "Conventional TEST1",
      "SEED_PHOTO": "https://drive.google.com/open?id=1OKJg9jK4QdJ70MABD8bCvx1UsHVF6XIo",
      "MOISTURE_CONTENT": 100,
      "LAST_MODIFIED": "Mon Jun 02 2025 13:06:13 GMT+0800 (Philippine Standard Time)",
      "REMARKS": "Test remarks ASD",
      "EMAIL": "test@example.com",
      "CROP": "Corn TEST",
      "STATUS": "✅ Generated",
      "INVENTORY": "INVENTORY 101",
      "TIMESTAMP": "Fri May 09 2025 14:30:09 GMT+0800 (Philippine Standard Time)",
      "CROP_PHOTO": "https://drive.google.com/open?id=19igwvzhh25Ij0wFNGlFjVeETu3WrZ1C2",
      "QR_IMAGE": "https://drive.google.com/file/d/1i0IvFEyaSBPXzMBatCbms9zs-KxdJX7t/view?usp=drivesdk",
      "BAG_NUMBER": "BAG45",
      "UNIT": "Grams (g)",
      "STORED_DATE": "Mon Jun 02 2025 11:28:00 GMT+0800 (Philippine Standard Time)",
      "VOLUME": 250,
      "NAME": "Test User",
      "GERMINATION_RATE": 100,
      "CODE": qrCode,
      "QR_DOCUMENT": "https://docs.google.com/open?id=1BLFrsU3sylv5UObJxYev_QYHK9JctzCnqn4zNcS9iGU",
      "HARVEST_DATE": "Mon Jun 02 2025 11:31:00 GMT+0800 (Philippine Standard Time)",
      "ARCHIVED": "",
      "LOT_NUMBER": "LOT123 ASD",
      "PROGRAM": "HVCDP TEST"
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
          resolve(res);
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
        .updateSeedDetails(data);
    });
  }
  // Return mock response for development
  return Promise.resolve({
    success: true,
    message: 'Mock update successful',
    data: data
  });
}
