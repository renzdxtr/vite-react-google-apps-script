// /lib/data-calculations.ts

interface WithdrawalRecord {
    TIMESTAMP: string
    QR_CODE: string
    INVENTORY: string
    AMOUNT: string
    PREVIOUS_VALUE: string
    NEW_VALUE: string
    REASON: string
    USER: string
  }
  
  interface ReleaseLogItem {
    id: string
    date: string
    timestamp: string
    volume: number
    reason: string
    user: string
    inventoryType: string
    qrCode: string
    previousValue: string
    newValue: string
  }
  
  export function transformWithdrawalData(
    withdrawalData: WithdrawalRecord[], 
    seedDetails?: { INVENTORY?: string }
  ): ReleaseLogItem[] {
    return withdrawalData.map((record) => {
      // Parse the timestamp (MM/DD/YYYY HH:mm:ss format)
      const timestamp = record.TIMESTAMP
      const date = new Date(timestamp)
      
      return {
        id: record.QR_CODE,
        date: date.toISOString(),
        timestamp: timestamp,
        volume: parseFloat(record.AMOUNT) || 0,
        reason: record.REASON || "",
        user: record.USER || "",
        inventoryType: seedDetails?.INVENTORY || "Seed Storage", // Default to Seed Storage if not specified
        qrCode: record.QR_CODE,
        previousValue: record.PREVIOUS_VALUE,
        newValue: record.NEW_VALUE,
      }
    })
  }