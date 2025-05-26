import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Info, ArrowLeft } from 'lucide-react';
import { fetchSeedDetailsByQrCode } from '@/lib/googleSheetsApi'; // Import the data fetching utility
import { Suspense } from 'react';

// Inner component to fetch and display data
  const SeedManagementContent = () => {
    // Define the mapping for fields to display in the summary
    const summaryFields = ['CODE', 'Crop', 'Variety', 'Program', 'LOT_NUMBER', 'STORED_DATE', 'BAG_NUMBER', 'VOLUME', 'Seed_Class', 'GERMINATION_RATE', 'MOISTURE_CONTENT'];
    const urlFields = ['SEED_PHOTO', 'CROP_PHOTO', 'QR_IMAGE', 'QR_DOCUMENT'];
    const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [searchParams] = useSearchParams();
  const qrCode = searchParams.get('qrCode');
  const navigate = useNavigate();

  const [seedDetails, setSeedDetails] = useState<Record<string, string> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [withdrawAmount, setWithdrawAmount] = useState<number | ''>('');
  const [withdrawReason, setWithdrawReason] = useState<string>('');

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

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmount === '' || withdrawAmount <= 0) {
      setError("Please enter a valid withdrawal amount.");
      return;
    }
    const currentVolume = parseFloat(seedDetails?.VOLUME || '0');
    if (withdrawAmount > currentVolume) {
      setError(`Withdrawal amount (${withdrawAmount}) exceeds available volume (${currentVolume}).`);
      return;
    }
    // TODO: Implement actual withdrawal logic (update Google Sheet via backend/serverless)
    console.log(`Withdrawal successful: ${withdrawAmount} units for reason "${withdrawReason}"`);
    // Update local state after successful withdrawal (requires backend to confirm actual new volume)
  };

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

  // Filter details for the summary section
  const summaryDetails = Object.entries(seedDetails || {})
    .filter(([key, value]) => summaryFields.includes(key) && value !== undefined && value !== null && value !== '' && value !== 'N/A')
    .reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {} as Record<string, string>);
  // Filter all details for the collapsible section
  const allDetails = Object.entries(seedDetails || {})
    .filter(([key, value]) => value !== undefined && value !== null && value !== '' && value !== 'N/A');

  return (
    // Overall Card with Shadow
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card className="shadow-xl p-6 space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Seed Management</h1>
          {/* Placeholder for header items - replace with your actual header component if needed */}
          {/* <Button onClick={() => navigate('/menu')}>Back to Menu</Button> */}
        </div>

        {/* Summary Information Display */}
        <Card className="shadow-md p-4 space-y-4">
          <CardHeader className="p-0">
             <CardTitle className="text-xl font-semibold text-secondary">Seed Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Top Section */}
            <div className="col-span-full flex flex-col sm:flex-row gap-4">
               {summaryDetails.CODE && (
                <div className="flex-1">
                   <p className="text-sm text-muted-foreground">QR Code:</p>
                   <p className="font-mono font-semibold">{summaryDetails.CODE}</p>
                 </div>
               )}
              {(summaryDetails.Crop || summaryDetails.Variety) && (
                <div className={`flex-1 ${summaryDetails.CODE ? 'sm:border-l sm:pl-4 border-gray-300' : ''}`}>
                  <p className="text-sm text-muted-foreground">Crop | Variety:</p>
                  <p className="font-semibold">{summaryDetails.Crop} {summaryDetails.Crop && summaryDetails.Variety ? '|' : ''} {summaryDetails.Variety}</p>
                </div>
              )}
            </div>
            {summaryDetails.Program && (
               <div className="col-span-full">
                 <p className="text-sm text-muted-foreground">Program:</p>
                 <p className="font-semibold">{summaryDetails.Program}</p>
               </div>
             )}

              {/* Middle Section */}
            <div className="col-span-full pt-4 border-t border-gray-300 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {summaryDetails.LOT_NUMBER && (
                 <div className="flex-1">
                   <p className="text-sm text-muted-foreground">Lot No.:</p>
                   <p className="font-semibold">{summaryDetails.LOT_NUMBER}</p>
                 </div>
              )}
              {summaryDetails.STORED_DATE && (
                 <div className={`flex-1 ${summaryDetails.LOT_NUMBER ? 'sm:border-l sm:pl-4 border-gray-300' : ''}`}>
                    <p className="text-sm text-muted-foreground">Date Stored:</p>
                    <p className="font-semibold">{summaryDetails.STORED_DATE}</p>
                 </div>
              )}
            </div>
            <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              {summaryDetails.BAG_NUMBER && (
                 <div className="flex-1">
                   <p className="text-sm text-muted-foreground">Bag No.:</p>
                   <p className="font-semibold">{summaryDetails.BAG_NUMBER}</p>
                 </div>
              )}
              {(summaryDetails.VOLUME || summaryDetails.UNIT) && (
                 <div className={`flex-1 ${summaryDetails.BAG_NUMBER ? 'sm:border-l sm:pl-4 border-gray-300' : ''}`}>
                    <p className="text-sm text-muted-foreground">Volume Stored:</p>
                    <p className="font-semibold">{summaryDetails.VOLUME} {summaryDetails.UNIT}</p>
                 </div>
              )}
            </div>

          {/* Bottom Section */}
          <div className="col-span-full pt-4 border-t border-gray-300 grid grid-cols-1 sm:grid-cols-3 gap-4">
               {summaryDetails.Seed_Class && (
                  <div className="flex-1">
                   <p className="text-sm text-muted-foreground">Seed Class:</p>
                    <p className="font-semibold">{summaryDetails.Seed_Class}</p>
                  </div>
               )}
               {summaryDetails.GERMINATION_RATE && (
                  <div className={`flex-1 ${summaryDetails.Seed_Class ? 'sm:border-l sm:pl-4 border-gray-300' : ''}`}>
                    <p className="text-sm text-muted-foreground">Germination Rate (%):</p>
                   <p className="font-semibold">{summaryDetails.GERMINATION_RATE}%</p>
                 </div>
               )}
               {summaryDetails.MOISTURE_CONTENT && (
                 <div className={`flex-1 ${(summaryDetails.Seed_Class || summaryDetails.GERMINATION_RATE) ? 'sm:border-l sm:pl-4 border-gray-300' : ''}`}>
                   <p className="text-sm text-muted-foreground">Moisture Content (%):</p>
                   <p className="font-semibold">{summaryDetails.MOISTURE_CONTENT}%</p>
                  </div>
               )}
            </div>
          </CardContent>
        </Card>
        {/* Collapsible Details Section */}
        <Card className="shadow-md">
           <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xl font-semibold text-secondary">Full Details</CardTitle>
             <Button variant="ghost" onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}>
               {isDetailsExpanded ? 'Hide Details' : 'View Details'}
             </Button>
           </CardHeader>
           {/* Collapsible Content */}
           {isDetailsExpanded && (
             <CardContent className="p-4 border-t border-gray-300 space-y-4">
               {/* Details Table - Display all fields except image/document URLs */}
               <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                     <thead>
                       <tr>
                         <th className="w-[200px] text-left text-sm font-medium text-gray-500 uppercase tracking-wider pb-2">Attribute</th>
                         <th className="text-left text-sm font-medium text-gray-500 uppercase tracking-wider pb-2">Value</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-200">
                        {allDetails
                          .filter(([key]) => !urlFields.includes(key))
                          .map(([key, value]) => (
                         <tr key={key}>
                           <td className="py-2 pr-4 text-sm font-medium text-gray-900">{key}</td>
                           <td className="py-2 text-sm text-gray-700">{String(value)}</td>
                         </tr>
                       ))}
                     </tbody>
                  </table>
               </div>
               {/* Image and Document Links */}
                <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-300">
                  {urlFields.map(fieldKey => {
                    const url = seedDetails?.[fieldKey];
                    if (url && url !== 'N/A') {
                       const buttonText = fieldKey.replace(/_/g, ' ').replace('QR', 'QR '); // Format key for button text
                       return (
                          <Button key={fieldKey} asChild variant="outline" size="sm">
                            <a href={url} target="_blank" rel="noopener noreferrer">
                              View {buttonText}
                           </a>
                          </Button>
                        );
                     }
                     return null;
                   })}
                </div>
               {/* TODO: Add Edit button functionality */}
               {/* <Button variant="secondary" className="mt-4">Edit Details</Button> */}
             </CardContent>
           )}
        </Card>
        {/* Withdraw Seed Volume Section */}
        <Card className="shadow-md p-4 space-y-4">
           <CardHeader className="p-0">
             <CardTitle className="text-xl font-semibold text-secondary">Withdraw Seed Volume</CardTitle>
           </CardHeader>
           <CardContent className="p-0 space-y-4">
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                   <label htmlFor="withdrawAmount" className="block text-sm font-medium text-gray-700">Enter Amount:</label>
                   <input
                     type="number"
                     id="withdrawAmount"
                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                     value={withdrawAmount}
                     onChange={(e) => setWithdrawAmount(parseFloat(e.target.value))}
                     min="0"
                     step="any"
                   />
                 </div>
                 <div>
                   <label htmlFor="withdrawReason" className="block text-sm font-medium text-gray-700">Reason:</label>
                   <input
                     type="text"
                     id="withdrawReason"
                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                     value={withdrawReason}
                     onChange={(e) => setWithdrawReason(e.target.value)}
                   />
                 </div>
               </div>
               {error && (
                 <Alert variant="destructive">
                   <Info className="h-4 w-4" />
                   <AlertTitle>Withdrawal Error</AlertTitle>
                   <AlertDescription>{error}</AlertDescription>
                 </Alert>
               )}
               <Button type="submit" className="w-full">Withdraw</Button>
             </form>
           </CardContent>
        </Card>
         {/* Action Section - Back button moved to Header or considered part of main layout */}
         {/* {seedDetails?.CODE && (
           <div className="flex justify-end mt-6 flex-wrap gap-4">
             <Button asChild>
               <a href={`/seed-withdrawal/${seedDetails.CODE}`}>
                 Withdraw Seed
               </a>
             </Button>
           </div>
         )} */}
      </Card>
       {/* Back to Scan button outside the main card */}
       <div className="flex justify-center mt-6">
         <Button variant="outline" onClick={() => navigate('/scan-qr')}>
           <ArrowLeft className="mr-2 h-4 w-4" /> Back to Scan
         </Button>
       </div>
    </div>
  );
};
// This was the missing closing brace for QRDetailsContent, now part of SeedManagementContent
const SeedManagementPage = () => {
  return (
    // Suspense remains outside for lazy loading the content component
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[200px] p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-center">Loading seed management page...</p>
        <p className="mt-1 text-muted-foreground text-center">Please wait a moment.</p>
      </div>
    }>
      <SeedManagementContent />
    </Suspense>
  );
};

// Utility function to convert Google Drive share URL to direct image URL
function convertDriveUrlToDirectImage(url: string): string {
  if (!url || url === 'N/A') return '';
  const match = url.match(/\/d\/([a-zA-Z0-9_-]{25,})/);
  if (!match || !match[1]) return url; // Return original URL if not a standard share link
  return `https://drive.google.com/uc?export=view&id=${match[1]}`;
};

export default SeedManagementPage;