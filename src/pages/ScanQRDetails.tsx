import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Info, ArrowLeft } from 'lucide-react';
import { fetchSeedDetailsByQrCode } from '@/lib/googleSheetsApi'; // Import the data fetching utility
import { Suspense } from 'react';

// Inner component to fetch and display data
const QRDetailsContent = () => {
  const [searchParams] = useSearchParams();
  const qrCode = searchParams.get('qrCode');
  const navigate = useNavigate();

  const [seedDetails, setSeedDetails] = useState<Record<string, string> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!qrCode) {
        setError("QR code not provided in the URL.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setSeedDetails(null);

      try {
        const details = await fetchSeedDetailsByQrCode(qrCode);
        if (details) {
          setSeedDetails(details);
        } else {
          setError(`No seed details found for QR code: '${qrCode}'. Please scan again or check the data source.`);
        }
      } catch (err: any) {
        console.error("Error fetching seed details:", err);
        setError(err.message || 'An unknown error occurred while fetching seed details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [qrCode]); // Refetch data when the qrCode changes

  // Filter data for display, excluding 'N/A' and empty strings
  const filteredDetails = Object.entries(seedDetails || {}).filter(([key, value]) => {
    return value !== undefined && value !== null && value !== '' && value !== 'N/A';
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-center">Loading seed details for '{qrCode || '...'}'...</p>
        <p className="mt-1 text-muted-foreground text-center">Please wait a moment.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Error Retrieving Details</AlertTitle>
          <AlertDescription>{error || 'An unknown error occurred while fetching seed details.'}</AlertDescription>
        </Alert>
        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={() => navigate('/scan-qr')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Scan
          </Button>
        </div>
      </div>
    );
  }

  // Placeholder for handling case where data is null after loading (e.g., QR not found) - This is now handled by the error state
  // if (!seedDetails && !isLoading && !error && qrCode) {
  //     return (
  //          <div className="max-w-2xl mx-auto">
  //             <Alert variant="destructive">
  //                 <Info className="h-4 w-4" />
  //                 <AlertTitle>Seed Details Not Found</AlertTitle>
  //                 <AlertDescription>No seed details found for QR code: '{qrCode}'. Please scan again or check the data source.</AlertDescription>
  //             </Alert>
  //             <div className="flex justify-center mt-4">
  //                <Button variant="outline" onClick={() => navigate('/scan-qr')}>
  //                 <ArrowLeft className="mr-2 h-4 w-4" /> Back to Scan
  //               </Button>
  //             </div>
  //         </div>
  //     );
  // }


  return (
    <Card className="shadow-xl">
      <div className="p-6">
        {/* Card Header */}
        <div className="flex items-start justify-between pb-2 border-b">
          <div>
            <h2 className="text-2xl font-bold text-primary">Seed Details: {seedDetails?.Crop} - {seedDetails?.Variety}</h2>
          </div>
          <Button variant="outline" size="icon" onClick={() => navigate('/scan-qr')} aria-label="Back to Scan QR">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Scan QR</span>
          </Button>
        </div>

        {/* Featured Information Section */}
        <div className="bg-muted/50 rounded-lg p-6 mt-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Image Display Placeholder */}
          <div className="flex-shrink-0">
            {/* Placeholder Image */}
            <div className="h-[150px] w-[150px] rounded-md border shadow-md bg-gray-200 flex items-center justify-center text-gray-500">
              {/* Generic Placeholder */}
              <span>No Image</span>
            </div>
          </div>

          {/* QR Code Display */}
          <div className="flex-grow text-center sm:text-left">
            <p className="text-sm text-muted-foreground">Scanned QR Code (ID):</p>
            <p className="text-2xl font-mono font-semibold">{qrCode || 'N/A'}</p>
          </div>
        </div>

        {/* Content Description */}
        <p className="mt-6 text-gray-700">Detailed information for the scanned seed lot retrieved from the system.</p>

        {/* Details Table */}
        <div className="overflow-x-auto mt-6">
          <table className="w-full table-auto">
            <thead>
              <tr>
                <th className="w-[200px] text-left text-sm font-medium text-gray-500 uppercase tracking-wider pb-2">Attribute</th>
                <th className="text-left text-sm font-medium text-gray-500 uppercase tracking-wider pb-2">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDetails.map(([key, value]) => (
                <tr key={key}>
                  <td className="py-2 pr-4 text-sm font-medium text-gray-900">{key}</td>
                  <td className="py-2 text-sm text-gray-700">{String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredDetails.length === 0 && (
            <p className="text-center text-gray-500 mt-4">No detailed attributes found for this seed.</p>
          )}
        </div>

        {/* Action Section */}
        {seedDetails?.CODE && ( // Only show withdraw if CODE (QR code) is available
          <div className="flex justify-end mt-6">
            <Button asChild>
              <a href={`/seed-withdrawal/${seedDetails.CODE}`}> {/* Use <a> for navigation outside React Router */}
                Withdraw Seed
              </a>
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

const ScanQRDetails = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg text-center">Preparing QR details page...</p>
          <p className="mt-1 text-muted-foreground text-center">Please wait a moment.</p>
        </div>
      }>
        <QRDetailsContent />
      </Suspense>
    </div>
  );
};

export default ScanQRDetails;
