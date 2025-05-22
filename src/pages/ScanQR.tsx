import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RotateCcw, X, TriangleAlert, Grid } from 'lucide-react';
import QrScanner from 'react-qr-scanner';

const ScanQR = () => {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = (data: { text: string } | null) => {
    if (data) {
      setScanResult(data.text);
      setIsScanning(false);
      navigate(`/scan-qr/details?qrCode=${data.text}`);
    }
  };

  const handleError = (err: Error) => {
    console.error(err);
    setScanError(err.message);
    setIsScanning(false);
  };

  const handleRetry = () => {
    setScanResult('');
    setScanError(null);
    setIsScanning(true);
  };

  const handleClose = () => {
    navigate('/menu'); // Assuming '/menu' is the path to your main menu page
  };

  // Initial state when the page loads
  if (!isScanning && !scanResult && !scanError) {
    setIsScanning(true);
  }


  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center max-w-md">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Scan QR Code</h1>
        <p className="mt-2 text-lg text-foreground/80 text-center max-w-xs mx-auto">
          Position the QR code within the camera frame
        </p>
      </div>

      <div className="w-full max-w-md min-h-[300px] bg-muted rounded-lg shadow-inner overflow-hidden">
        {isScanning && (
          <QrScanner
            delay={300}
            onError={handleError}
            onScan={handleScan}
            style={{ width: '100%' }}
          />
        )}
        {!isScanning && !scanError && scanResult && (
           <div className="flex items-center justify-center h-full">
             <p className="text-center text-green-600 font-semibold">Scan Successful!</p>
           </div>
        )}
         {!isScanning && scanError && (
           <div className="flex items-center justify-center h-full">
             <p className="text-center text-red-600 font-semibold">Scan Failed: {scanError}</p>
           </div>
        )}
      </div>

      {scanError && (
        <Alert variant="destructive" className="w-full max-w-md mt-6">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Scan Error</AlertTitle>
          <AlertDescription>
            {scanError || 'An unknown error occurred during scanning.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="w-full max-w-md grid grid-cols-1 gap-4 mt-6">
        <Button
          onClick={handleRetry}
          variant="outline"
          size="lg"
          className="w-full shadow-md"
          disabled={isScanning && !scanError}
        >
          <RotateCcw className="mr-2 h-5 w-5" />
          Retry Scan
        </Button>
        <Button
          onClick={handleClose}
          variant="ghost"
          className="w-full pt-4"
        >
           <Grid className="mr-2 h-5 w-5" />
          Back to Menu
        </Button>
      </div>
    </div>
  );
};

export default ScanQR;