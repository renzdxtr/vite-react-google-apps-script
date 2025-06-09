// ===== CROP-SPECIFIC VOLUME THRESHOLDS =====
// Commercial‐scale crop volume thresholds: [low_volume_threshold, very_low_volume_threshold] in grams
const CROP_VOLUME_THRESHOLDS = {
  Tomato: [40.0, 20.0],
  Eggplant: [60.0, 30.0],
  "Hot Pepper": [20.0, 10.0],
  Corn: [60.0, 30.0],
  Peanut: [80.0, 40.0],
  "Bottle Gourd": [200.0, 100.0],
  "Sponge Gourd": [200.0, 100.0],
  Okra: [70.0, 35.0],
  Cowpea: [100.0, 50.0],
  Mungbean: [70.0, 35.0],
  Soybean: [70.0, 35.0],
  "Bush Sitao": [100.0, 50.0],
  "Pole Sitao": [100.0, 50.0],
  "Winged Bean": [100.0, 50.0],
} as const

// Default thresholds for crops not in the list
const DEFAULT_THRESHOLDS = [100.0, 50.0] // [low_volume_threshold, very_low_volume_threshold]

// ===== THRESHOLD CONSTANTS =====
export const THRESHOLDS = {
  // Days since last withdrawal to consider item "stale"
  STALE_INVENTORY_DAYS: 30,

  // Days until expiry to show warning
  EXPIRY_WARNING_DAYS: 30,
} as const

// Get crop-specific thresholds
const getCropThresholds = (cropName: string): [number, number] => {
  return CROP_VOLUME_THRESHOLDS[cropName as keyof typeof CROP_VOLUME_THRESHOLDS] || DEFAULT_THRESHOLDS
}

// ===== DATA PROCESSING FUNCTIONS =====

/**
 * Join inventory and withdrawal data
 * Matches SAMPLE_DATA_INVENTORY.CODE with SAMPLE_WITHDRAWAL.QR_CODE
 */
export function joinInventoryWithWithdrawals(inventory: any[], withdrawals: any[]) {
  return inventory.map((inventoryItem) => {
    // Find all withdrawals for this inventory item
    const itemWithdrawals = withdrawals.filter((withdrawal) => withdrawal.QR_CODE === inventoryItem.CODE)

    // Calculate total withdrawn amount
    const totalWithdrawn = itemWithdrawals.reduce((sum, withdrawal) => {
      return sum + Number.parseFloat(withdrawal.AMOUNT || "0")
    }, 0)

    // Find most recent withdrawal
    const lastWithdrawal =
      itemWithdrawals.length > 0
        ? itemWithdrawals.sort((a, b) => new Date(b.TIMESTAMP).getTime() - new Date(a.TIMESTAMP).getTime())[0]
        : null

    // Use VOLUME directly as the remaining volume
    return {
      ...inventoryItem,
      withdrawals: itemWithdrawals,
      totalWithdrawn,
      lastWithdrawal,
      remainingVolume: inventoryItem.VOLUME, // Use VOLUME directly
    }
  })
}

/**
 * Process withdrawal data for Release Log
 * Joins withdrawal data with inventory data to get crop and variety information
 */
export function processReleaseLogData(withdrawals: any[], inventory: any[]) {
  // Create a lookup map for inventory items by CODE
  const inventoryMap = inventory.reduce(
    (map, item) => {
      map[item.CODE] = item
      return map
    },
    {} as Record<string, any>,
  )

  // Process each withdrawal record
  return withdrawals.map((withdrawal, index) => {
    const inventoryItem = inventoryMap[withdrawal.QR_CODE] || {}
    const timestamp = new Date(withdrawal.TIMESTAMP)
    const date = timestamp.toISOString().split("T")[0] // YYYY-MM-DD

    return {
      id: `${index}-${withdrawal.QR_CODE}-${withdrawal.TIMESTAMP}`,
      crop: inventoryItem.CROP || "Unknown",
      variety: inventoryItem.VARIETY || "Unknown",
      date,
      timestamp: withdrawal.TIMESTAMP,
      volume: Number.parseFloat(withdrawal.AMOUNT) || 0,
      reason: withdrawal.REASON || "",
      user: withdrawal.USER || "",
      inventoryType: inventoryItem.INVENTORY || "Unknown",
      qrCode: withdrawal.QR_CODE,
      previousValue: withdrawal.PREVIOUS_VALUE,
      newValue: withdrawal.NEW_VALUE,
    }
  })
}

/**
 * Calculate Today's Withdrawals
 * Uses: SAMPLE_WITHDRAWAL.TIMESTAMP and SAMPLE_WITHDRAWAL.AMOUNT
 * Logic: Sum all AMOUNT values where TIMESTAMP is today's date
 */
export function calculateTodaysWithdrawals(withdrawals: any[]) {
  const today = new Date().toDateString()

  const todayWithdrawals = withdrawals.filter((withdrawal) => {
    const withdrawalDate = new Date(withdrawal.TIMESTAMP)
    return withdrawalDate.toDateString() === today
  })

  const totalToday = todayWithdrawals.reduce((sum, withdrawal) => {
    return sum + Number.parseFloat(withdrawal.AMOUNT || "0")
  }, 0)

  // Since we don't have inventory type in withdrawal data,
  // we'll need to join with inventory to categorize
  return {
    total: totalToday,
    count: todayWithdrawals.length,
    withdrawals: todayWithdrawals,
  }
}

/**
 * Calculate Today's Withdrawals by Inventory Type
 * Uses: Joined data to categorize withdrawals by INVENTORY type
 */
export function calculateTodaysWithdrawalsByType(joinedData: any[]) {
  const today = new Date().toDateString()

  let seedStorageTotal = 0
  let plantingMaterialsTotal = 0

  joinedData.forEach((item) => {
    const todayWithdrawals = item.withdrawals.filter((withdrawal: any) => {
      const withdrawalDate = new Date(withdrawal.TIMESTAMP)
      return withdrawalDate.toDateString() === today
    })

    const todayAmount = todayWithdrawals.reduce((sum: number, withdrawal: any) => {
      return sum + Number.parseFloat(withdrawal.AMOUNT || "0")
    }, 0)

    if (item.INVENTORY === "Seed Storage") {
      seedStorageTotal += todayAmount
    } else if (item.INVENTORY === "Planting Materials") {
      plantingMaterialsTotal += todayAmount
    }
  })

  return {
    seedStorage: { value: Math.round(seedStorageTotal), unit: "g" },
    plantingMaterials: { value: Math.round(plantingMaterialsTotal), unit: "pcs" },
  }
}

/**
 * Calculate Current Stock
 * Uses: SAMPLE_DATA_INVENTORY.VOLUME and SAMPLE_DATA_INVENTORY.INVENTORY
 * Logic: Sum VOLUME by INVENTORY type (remaining volume after withdrawals)
 */
export function calculateCurrentStock(joinedData: any[]) {
  const seedStorageItems = joinedData.filter((item) => item.INVENTORY === "Seed Storage")
  const plantingMaterialsItems = joinedData.filter((item) => item.INVENTORY === "Planting Materials")

  const seedStorageStock = seedStorageItems.reduce((sum, item) => {
    return sum + item.remainingVolume
  }, 0)

  const plantingMaterialsStock = plantingMaterialsItems.reduce((sum, item) => {
    return sum + item.remainingVolume
  }, 0)

  return {
    seedStorage: { value: Math.round(seedStorageStock), unit: "g" },
    plantingMaterials: { value: Math.round(plantingMaterialsStock), unit: "pcs" },
  }
}

/**
 * Calculate Low-Stock Alerts using crop-specific thresholds
 * Uses: remainingVolume (calculated) and crop-specific thresholds
 * Logic: Count items where remainingVolume < threshold, grouped by INVENTORY type
 */
export function calculateLowStockAlerts(joinedData: any[]) {
  const seedStorageItems = joinedData.filter((item) => item.INVENTORY === "Seed Storage")
  const plantingMaterialsItems = joinedData.filter((item) => item.INVENTORY === "Planting Materials")

  const seedStorageLowStock = seedStorageItems.filter((item) => {
    const [lowVolumeThreshold] = getCropThresholds(item.CROP)
    return item.remainingVolume < lowVolumeThreshold
  }).length

  const plantingMaterialsLowStock = plantingMaterialsItems.filter((item) => {
    const [lowVolumeThreshold] = getCropThresholds(item.CROP)
    return item.remainingVolume < lowVolumeThreshold
  }).length

  return {
    seedStorage: { value: seedStorageLowStock, unit: "" },
    plantingMaterials: { value: plantingMaterialsLowStock, unit: "" },
  }
}

/**
 * Calculate Stock by Seed Class
 * Uses: SAMPLE_DATA_INVENTORY.SEED_CLASS and remainingVolume
 * Logic: Group by SEED_CLASS, sum remainingVolume for each class
 */
export function calculateStockBySeedClass(joinedData: any[]) {
  const seedClassData = joinedData.reduce((acc: any, item) => {
    const seedClass = item.SEED_CLASS

    if (!acc[seedClass]) {
      acc[seedClass] = {
        seedClass,
        volume: 0,
        count: 0,
        varieties: [],
      }
    }

    acc[seedClass].volume += item.remainingVolume
    acc[seedClass].count += 1
    acc[seedClass].varieties.push({
      variety: item.VARIETY,
      crop: item.CROP,
      volume: item.remainingVolume,
    })

    return acc
  }, {})

  return Object.values(seedClassData)
}

/**
 * Calculate Monthly Withdrawal Patterns
 * Uses: SAMPLE_WITHDRAWAL.TIMESTAMP and SAMPLE_WITHDRAWAL.AMOUNT
 * Logic: Group withdrawals by month, sum AMOUNT for each month
 */
export function calculateMonthlyWithdrawalPatterns(withdrawals: any[]) {
  const monthlyData = new Map()

  withdrawals.forEach((withdrawal) => {
    const timestamp = new Date(withdrawal.TIMESTAMP)

    if (isNaN(timestamp.getTime())) return // Skip invalid dates

    const year = timestamp.getFullYear()
    const month = timestamp.getMonth()
    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`
    const monthLabel = timestamp.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    })

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, {
        month: monthLabel,
        monthKey,
        totalWithdrawal: 0,
        transactionCount: 0,
        details: [],
      })
    }

    const monthData = monthlyData.get(monthKey)
    const withdrawalAmount = Number.parseFloat(withdrawal.AMOUNT) || 0

    monthData.totalWithdrawal += withdrawalAmount
    monthData.transactionCount += 1
    monthData.details.push({
      qrCode: withdrawal.QR_CODE,
      amount: withdrawalAmount,
      reason: withdrawal.REASON || "Not specified",
      timestamp: withdrawal.TIMESTAMP,
    })
  })

  return Array.from(monthlyData.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey))
}

/**
 * Calculate Stock by Location
 * Uses: SAMPLE_DATA_INVENTORY.LOCATION, SAMPLE_DATA_INVENTORY.CROP, and remainingVolume
 * Logic: Group by LOCATION, then by CROP, sum remainingVolume
 */
export function calculateStockByLocation(joinedData: any[]) {
  const locationData = joinedData.reduce((acc: any, item) => {
    const location = item.LOCATION

    if (!acc[location]) {
      acc[location] = {
        location,
        totalVolume: 0,
        crops: {},
      }
    }

    if (!acc[location].crops[item.CROP]) {
      acc[location].crops[item.CROP] = 0
    }

    acc[location].crops[item.CROP] += item.remainingVolume
    acc[location].totalVolume += item.remainingVolume

    return acc
  }, {})

  return Object.values(locationData)
}

/**
 * Calculate Withdrawal Time Analysis
 * Uses: SAMPLE_WITHDRAWAL.TIMESTAMP and SAMPLE_WITHDRAWAL.AMOUNT
 * Logic: Group by time periods (morning, afternoon, evening), sum AMOUNT
 */
export function calculateWithdrawalTimeAnalysis(withdrawals: any[]) {
  const timeData = withdrawals.reduce((acc: any, withdrawal) => {
    const timestamp = new Date(withdrawal.TIMESTAMP)

    if (isNaN(timestamp.getTime())) return acc

    const date = timestamp.toISOString().split("T")[0]
    const hour = timestamp.getHours()
    const amount = Number.parseFloat(withdrawal.AMOUNT) || 0

    // Determine time period
    let period = "morning" // 5-11
    if (hour >= 12 && hour < 17) {
      period = "afternoon" // 12-16
    } else if (hour >= 17 || hour < 5) {
      period = "evening" // 17-4
    }

    if (!acc[date]) {
      acc[date] = {
        date,
        morning: 0,
        afternoon: 0,
        evening: 0,
        total: 0,
      }
    }

    acc[date][period] += amount
    acc[date].total += amount

    return acc
  }, {})

  return Object.values(timeData)
}

/**
 * Calculate Inventory Summary Status using crop-specific thresholds
 * Uses: remainingVolume, lastWithdrawal.TIMESTAMP, and crop-specific thresholds
 * Logic: Determine status based on stock levels and activity
 */
export function calculateInventoryStatus(item: any) {
  const now = new Date()
  const remainingVolume = item.remainingVolume
  const cropName = item.CROP

  // Get crop-specific thresholds
  const [lowVolumeThreshold, veryLowVolumeThreshold] = getCropThresholds(cropName)

  // Check last withdrawal date
  let daysSinceLastWithdrawal = Number.POSITIVE_INFINITY
  if (item.lastWithdrawal) {
    const lastWithdrawalDate = new Date(item.lastWithdrawal.TIMESTAMP)
    daysSinceLastWithdrawal = Math.floor((now.getTime() - lastWithdrawalDate.getTime()) / (1000 * 60 * 60 * 24))
  }

  // Determine status using crop-specific thresholds
  if (remainingVolume <= veryLowVolumeThreshold) {
    return "Critical"
  } else if (remainingVolume <= lowVolumeThreshold) {
    return "Warning"
  } else if (daysSinceLastWithdrawal > THRESHOLDS.STALE_INVENTORY_DAYS) {
    return "Stale"
  } else {
    return "Normal"
  }
}

/**
 * Generate System Alerts using crop-specific thresholds
 * Uses: All calculated data to generate relevant alerts
 */
export function generateSystemAlerts(joinedData: any[]) {
  const alerts = []

  // Critical stock alerts using crop-specific thresholds
  const criticalItems = joinedData.filter((item) => {
    const [, veryLowVolumeThreshold] = getCropThresholds(item.CROP)
    return item.remainingVolume <= veryLowVolumeThreshold
  })

  criticalItems.forEach((item) => {
    const [, veryLowVolumeThreshold] = getCropThresholds(item.CROP)
    alerts.push({
      type: "low-stock",
      message: `CRITICAL: ${item.CROP} (${item.VARIETY}) has only ${item.remainingVolume}g remaining (threshold: ${veryLowVolumeThreshold}g)`,
    })
  })

  // Low stock alerts using crop-specific thresholds
  const lowStockItems = joinedData.filter((item) => {
    const [lowVolumeThreshold, veryLowVolumeThreshold] = getCropThresholds(item.CROP)
    return item.remainingVolume > veryLowVolumeThreshold && item.remainingVolume <= lowVolumeThreshold
  })

  lowStockItems.slice(0, 3).forEach((item) => {
    const [lowVolumeThreshold] = getCropThresholds(item.CROP)
    alerts.push({
      type: "low-stock",
      message: `${item.CROP} (${item.VARIETY}) is running low with ${item.remainingVolume}g remaining (threshold: ${lowVolumeThreshold}g)`,
    })
  })

  // Stale inventory alerts
  const now = new Date()
  const staleItems = joinedData.filter((item) => {
    if (!item.lastWithdrawal) return true

    const lastWithdrawalDate = new Date(item.lastWithdrawal.TIMESTAMP)
    const daysSince = Math.floor((now.getTime() - lastWithdrawalDate.getTime()) / (1000 * 60 * 60 * 24))

    return daysSince > THRESHOLDS.STALE_INVENTORY_DAYS
  })

  staleItems.slice(0, 2).forEach((item) => {
    alerts.push({
      type: "inventory-check",
      message: `${item.CROP} (${item.VARIETY}) has no recent activity - check inventory`,
    })
  })

  return alerts.slice(0, 5) // Limit to 5 alerts
}
