import { useState, useEffect, useCallback } from 'react';
import { fetchAllWithdrawalDetails } from '@/server/gas';

export interface WithdrawalDetails {
  [key: string]: any;
}

export function useAllWithdrawalDetails(qrCode?: string | null): {
  withdrawalDetails: WithdrawalDetails[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [withdrawalDetails, setWithdrawalDetails] = useState<WithdrawalDetails[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setWithdrawalDetails([]);

    try {
      const details = await fetchAllWithdrawalDetails(qrCode || null);
      setWithdrawalDetails(details);
    } catch (err: any) {
      console.error('Error in useAllWithdrawalDetails:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [qrCode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { withdrawalDetails, isLoading, error, refetch: fetchData };
}