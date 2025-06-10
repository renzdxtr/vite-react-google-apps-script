import {  
    ITEM_LIFESPAN_DAYS, 
  } from "@/lib/constants"

  export function calculateExpiryDate(storedDate: string | Date): Date {
    const storedDateObj = typeof storedDate === 'string' ? new Date(storedDate) : storedDate;
    const expiryDate = new Date(storedDateObj);
    
    // Use the actual lifespan, not the warning threshold
    expiryDate.setDate(expiryDate.getDate() + ITEM_LIFESPAN_DAYS);
    
    return expiryDate;
  }