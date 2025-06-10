import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RotateCcw, X, TriangleAlert, Grid, Camera } from 'lucide-react';
import QrScanner from 'react-qr-scanner'; // Assuming you have react-qr-scanner installed

const ScanQR = () => {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCamera, setCurrentCamera] = useState<string>('');

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

  // Get available cameras
  useEffect(() => {
    const getCameras = async () => {
      try {
        // First try to access the back camera directly using facingMode
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: 'environment' } }
          });
          
          // If successful, we know we have a back camera
          // Get the track and its settings
          const videoTrack = stream.getVideoTracks()[0];
          const settings = videoTrack.getSettings();
          
          // Store the deviceId if available
          if (settings.deviceId) {
            setCurrentCamera(settings.deviceId);
          }
          
          // Stop the stream since we only needed it to get the device ID
          stream.getTracks().forEach(track => track.stop());
          
          // Still enumerate devices to have the full list for camera switching
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          setCameras(videoDevices);
        } catch (err) {
          // If facingMode: environment fails, fall back to device enumeration
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          setCameras(videoDevices);
          
          // Try to find back camera by label
          const backCamera = videoDevices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear')
          );
          setCurrentCamera(backCamera?.deviceId || videoDevices[0]?.deviceId || '');
        }
      } catch (err) {
        console.error('Error getting cameras:', err);
        setScanError('Unable to access camera');
      }
    };

    getCameras();
  }, []);

  // Update constraints to use facingMode as fallback when no deviceId is available
  const constraints = {
    video: currentCamera 
      ? { deviceId: { exact: currentCamera } }
      : { facingMode: { exact: 'environment' } }
  };

  // Switch camera handler
  const handleSwitchCamera = () => {
    const currentIndex = cameras.findIndex(cam => cam.deviceId === currentCamera);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setCurrentCamera(cameras[nextIndex].deviceId);
  };


  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 flex flex-col items-center max-w-md space-y-4 sm:space-y-6">
      <div className="text-center mb-4 sm:mb-6 w-full">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">Scan QR Code</h1>
        <p className="mt-2 text-base sm:text-lg text-muted-foreground text-center max-w-xs mx-auto">
          Position the QR code within the camera frame
        </p>
      </div> 
    
      <div className="w-full max-w-md min-h-[250px] sm:min-h-[300px] bg-muted rounded-lg shadow-inner overflow-hidden relative">
        {isScanning && (
          <>
            <QrScanner
              delay={300}
              onError={handleError}
              onScan={handleScan}
              style={{ width: '100%', height: '100%' }}
              constraints={constraints}
            />
            {cameras.length > 1 && (
              <Button
                onClick={handleSwitchCamera}
                variant="secondary"
                size="sm"
                className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 z-10"
              >
                <Camera className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Switch Camera</span>
              </Button>
            )}
          </>
        )}
        {!isScanning && !scanError && scanResult && (
          <div className="flex items-center justify-center h-full p-4">
            <p className="text-center text-green-600 font-semibold text-base sm:text-lg">Scan Successful!</p>
          </div>
        )}
        {!isScanning && scanError && (
          <div className="flex items-center justify-center h-full p-4">
            <p className="text-center text-red-600 font-semibold text-base sm:text-lg">Scan Failed: {scanError}</p>
          </div>
        )}
      </div>
    
      {scanError && (
        <Alert variant="destructive" className="w-full max-w-md text-sm sm:text-base">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Scan Error</AlertTitle>
          <AlertDescription>
            {scanError || 'An unknown error occurred during scanning.'}
          </AlertDescription>
        </Alert>
      )}
    
      <div className="w-full max-w-md grid grid-cols-1 gap-2 sm:gap-4 mt-2 sm:mt-4">
        <Button
          onClick={handleRetry}
          variant="outline"
          size="lg"
          className="w-full shadow-md h-10 sm:h-12"
          disabled={isScanning && !scanError}
        >
          <RotateCcw className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          Retry Scan
        </Button>
        <Button
          onClick={handleClose}
          variant="ghost"
          className="w-full h-10 sm:h-12"
        >
          <Grid className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          Back to Menu
        </Button>
      </div>
    </div>
  );
};

export default ScanQR;