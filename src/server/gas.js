// Check if running in Google Apps Script environment
const isGoogleAppsScript = typeof google !== 'undefined' && google.script;

// Create mock functions for development
const mockFetchSeedDetails = (qrCode) => {
  return Promise.resolve({
    CODE: qrCode,
    CROP: 'Mock Crop',
    VARIETY: 'Mock Variety',
    VOLUME: '100',
    // Add other mock data as needed
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
