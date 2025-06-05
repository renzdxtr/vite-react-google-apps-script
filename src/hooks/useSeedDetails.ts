// src/hooks/useSeedDetails.ts
import { useState, useEffect, useCallback } from 'react';
import { fetchSeedDetailsByQrCode, fetchAllSeedDetails } from '@/server/gas';

export interface SeedDetails {
  [key: string]: any;
}

export interface UseSeedDetailsResult {
  seedDetails: SeedDetails | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch seed details by QR code.
 * Returns: { seedDetails, isLoading, error, refetch }
 */
export function useSeedDetails(qrCode: string | null): UseSeedDetailsResult {
  const [seedDetails, setSeedDetails] = useState<SeedDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!qrCode) {
      setError('QR code not provided in the URL.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSeedDetails(null);

    try {
      const details = await fetchSeedDetailsByQrCode(qrCode);
      if (details) {
        setSeedDetails(details as SeedDetails);
      } else {
        setError(`No seed details found for QR code: '${qrCode}'.`);
      }
    } catch (err: any) {
      console.error('Error fetching seed details:', err);
      setError(err.message || 'An unknown error occurred while fetching seed details.');
    } finally {
      setIsLoading(false);
    }
  }, [qrCode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { seedDetails, isLoading, error, refetch: fetchData };
}

export function useAllSeedDetails(inventoryFilter?: string): {
  seedDetails: SeedDetails[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [seedDetails, setSeedDetails] = useState<SeedDetails[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSeedDetails([]);

    try {
      const details = await fetchAllSeedDetails(inventoryFilter);
      setSeedDetails(details);
    } catch (err: any) {
      console.error('Error in useAllSeedDetails:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [inventoryFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { seedDetails, isLoading, error, refetch: fetchData };
}