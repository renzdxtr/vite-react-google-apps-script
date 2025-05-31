import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Info, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchSeedDetailsByQrCode, updateSeedVolume, updateSeedDetails } from '@/server/gas';
import { Suspense } from 'react';
import { NON_EDITABLE_FIELDS, NON_REQUIRED_FIELDS, DATE_FIELDS } from '@/lib/constants';

import { CustomAlert } from '@/components/ui/custom-alert';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

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

  const [withdrawalSuccess, setWithdrawalSuccess] = useState<string | null>(null);
  const [withdrawalError, setWithdrawalError] = useState<string | null>(null);

  const [withdrawAmount, setWithdrawAmount] = useState<number | ''>('');
  const [withdrawReason, setWithdrawReason] = useState<string>('');

  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // State for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editedDetails, setEditedDetails] = useState<Record<string, string>>({});

  // Add new state for edit success
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Add state for confirmation view
  const [isConfirming, setIsConfirming] = useState(false);

  // Define fetchData as a useCallback to avoid recreation on each render
  const fetchData = useCallback(async () => {
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
  }, [qrCode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Validation function
  const validateWithdrawal = () => {
    if (withdrawAmount === '' || withdrawAmount <= 0) {
      setWithdrawalError("Please enter a valid withdrawal amount.");
      return false;
    }
    const currentVolume = parseFloat(seedDetails?.VOLUME || '0');
    if (withdrawAmount > currentVolume || currentVolume <= 0) {
      setWithdrawalError(`Withdrawal amount (${withdrawAmount}) exceeds available volume (${currentVolume}).`);
      return false;
    }
    return true;
  };

  // Handle withdrawal form submission
  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateWithdrawal()) {
      setIsConfirming(true);
    }
  };

  // Handle actual withdrawal after confirmation
  const handleConfirmWithdraw = async () => {
    setIsWithdrawing(true);
    setWithdrawalError(null);
    
    try {
      if (qrCode) {
        const result = await updateSeedVolume({
          qrCode,
          withdrawalAmount: withdrawAmount,
          withdrawalReason: withdrawReason
        });

        if (result.success) {
          setWithdrawalSuccess(`Successfully withdrew ${withdrawAmount} units.`);
          setWithdrawAmount('');
          setWithdrawReason('');
          setIsConfirming(false);
          await fetchData();
        } else {
          setWithdrawalError(result.message || 'Failed to withdraw seed volume.');
        }
      }
    } catch (err: any) {
      setWithdrawalError(err.message || 'An unexpected error occurred during withdrawal.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Handle edit changes
  const handleEditChange = (key: string, value: string) => {
    setEditedDetails(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    try {
      const response = await updateSeedDetails({
        qrCode: seedDetails?.CODE,
        oldData: seedDetails,
        newData: editedDetails
      });

      if (response.success) {
        setIsEditing(false);
        setEditedDetails({});
        await fetchData();
        setEditSuccess("Details updated successfully");
      } else {
        setWithdrawalError(response.message || "Failed to update details");
      }
    } catch (error: any) {
      setWithdrawalError(error.message || "Error updating details");
    }
  };

  // Effect for edit success message
  useEffect(() => {
    if (editSuccess) {
      const timer = setTimeout(() => {
        setEditSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [editSuccess]);

  // Effect for withdrawal success message - FIXED: removed duplicate timer logic
  useEffect(() => {
    if (withdrawalSuccess) {
      const timer = setTimeout(() => {
        setWithdrawalSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [withdrawalSuccess]);

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card className="shadow-xl p-6 space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Seed Management</h1>
        </div>

        {/* Centralized Alerts */}
        <CustomAlert
          type="success"
          title="Withdrawal Successful"
          message={withdrawalSuccess}
          show={!!withdrawalSuccess}
          onDismiss={() => setWithdrawalSuccess(null)}
        />
        <CustomAlert
          type="success"
          title="Edit Successful"
          message={editSuccess}
          show={!!editSuccess}
          onDismiss={() => setEditSuccess(null)}
        />

        {/* Summary Information Display */}
        <Card className="shadow-md p-4 space-y-4">
          <CardHeader className="p-0">
            <CardTitle className="text-xl font-bold">Seed Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            {/* Top Section */}
            <div className="col-span-full flex flex-col sm:flex-row gap-4">
              {seedDetails?.CODE && (
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">QR Code:</p>
                  <p className="font-mono font-semibold">{seedDetails.CODE}</p>
                </div>
              )}
              {(seedDetails?.Crop || seedDetails?.Variety) && (
                <div className={`flex-1 ${seedDetails?.CODE ? 'sm:border-l sm:pl-4 border-gray-300' : ''}`}>
                  <p className="text-sm text-muted-foreground">Crop | Variety:</p>
                  <p className="font-semibold">{seedDetails?.Crop} {seedDetails?.Crop && seedDetails?.Variety ? '|' : ''} {seedDetails?.Variety}</p>
                </div>
              )}
            </div>
            {seedDetails?.Program && (
              <div className="col-span-full">
                <p className="text-sm text-muted-foreground">Program:</p>
                <p className="font-semibold">{seedDetails.Program}</p>
              </div>
            )}

            {/* Middle Section */}
            <div className="col-span-full pt-4 border-t border-gray-300 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {seedDetails?.LOT_NUMBER && (
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Lot No.:</p>
                  <p className="font-semibold">{seedDetails.LOT_NUMBER}</p>
                </div>
              )}
              {seedDetails?.STORED_DATE && (
                <div className={`flex-1 ${seedDetails?.LOT_NUMBER ? 'sm:border-l sm:pl-4 border-gray-300' : ''}`}>
                  <p className="text-sm text-muted-foreground">Date Stored:</p>
                  <p className="font-semibold">{seedDetails.STORED_DATE}</p>
                </div>
              )}
            </div>
            <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              {seedDetails?.BAG_NUMBER && (
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Bag No.:</p>
                  <p className="font-semibold">{seedDetails.BAG_NUMBER}</p>
                </div>
              )}
              {(seedDetails?.VOLUME || seedDetails?.UNIT) && (
                <div className={`flex-1 ${seedDetails?.BAG_NUMBER ? 'sm:border-l sm:pl-4 border-gray-300' : ''}`}>
                  <p className="text-sm text-muted-foreground">Volume Stored:</p>
                  <p className="font-semibold">{seedDetails?.VOLUME} {seedDetails?.UNIT}</p>
                </div>
              )}
            </div>

            {/* Bottom Section */}
            <div className="col-span-full pt-4 border-t border-gray-300 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {seedDetails?.Seed_Class && (
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Seed Class:</p>
                  <p className="font-semibold">{seedDetails?.Seed_Class}</p>
                </div>
              )}
              {seedDetails?.GERMINATION_RATE && (
                <div className={`flex-1 ${seedDetails?.Seed_Class ? 'sm:border-l sm:pl-4 border-gray-300' : ''}`}>
                  <p className="text-sm text-muted-foreground">Germination Rate (%):</p>
                  <p className="font-semibold">{seedDetails?.GERMINATION_RATE}%</p>
                </div>
              )}
              {seedDetails?.MOISTURE_CONTENT && (
                <div className={`flex-1 ${(seedDetails?.Seed_Class || seedDetails?.GERMINATION_RATE) ? 'sm:border-l sm:pl-4 border-gray-300' : ''}`}>
                  <p className="text-sm text-muted-foreground">Moisture Content (%):</p>
                  <p className="font-semibold">{seedDetails?.MOISTURE_CONTENT}%</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Collapsible Details Section */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xl font-bold">Full Details</CardTitle>
            <div className="flex gap-2">
              {isDetailsExpanded && (
                isEditing ? (
                  <>
                    <Button variant="ghost" onClick={() => {
                      setIsEditing(false);
                      setEditedDetails({});
                    }}>
                      Cancel
                    </Button>
                    <Button variant="default" onClick={handleSaveEdit}>
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button variant="ghost" onClick={() => setIsEditing(true)}>
                    Edit Details
                  </Button>
                )
              )}
              <Button
                variant="ghost"
                onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                className="transition-transform duration-300 ease-in-out"
              >
                {isDetailsExpanded ? (
                  <><ChevronUp className="mr-1 h-4 w-4" /> Hide Details</>
                ) : (
                  <><ChevronDown className="mr-1 h-4 w-4" /> View Details</>
                )}
              </Button>
            </div>
          </CardHeader>
          
          {/* FIXED: Better collapsible implementation */}
          {isDetailsExpanded && (
            <CardContent className="p-4 border-t border-gray-300 space-y-4">
              {/* Details Table */}
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr>
                      <th className="w-[200px] text-left text-sm font-medium text-gray-500 uppercase tracking-wider pb-2">Attribute</th>
                      <th className="text-left text-sm font-medium text-gray-500 uppercase tracking-wider pb-2">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(seedDetails || {})
                      .filter(([key, value]) =>
                        value !== undefined &&
                        value !== null &&
                        value !== '' &&
                        value !== 'N/A' &&
                        !urlFields.includes(key)
                      )
                      .map(([key, value]) => (
                        <tr key={key}>
                          <td className="py-2 pr-4 text-sm font-medium text-gray-900">{key}</td>
                          <td className="py-2 text-sm text-gray-700">
                            {isEditing && !NON_EDITABLE_FIELDS.includes(key) ? (
                              DATE_FIELDS.includes(key) ? (
                                <input
                                  type="datetime-local"
                                  value={editedDetails[key] || value}
                                  onChange={(e) => handleEditChange(key, e.target.value)}
                                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                />
                              ) : (
                                <input
                                  type={key === 'GERMINATION_RATE' || key === 'MOISTURE_CONTENT' || key === 'VOLUME' ? 'number' : 'text'}
                                  value={editedDetails[key] || value}
                                  onChange={(e) => handleEditChange(key, e.target.value)}
                                  required={!NON_REQUIRED_FIELDS.includes(key)}
                                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                />
                              )
                            ) : (
                              String(value)
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              
              {/* Image and Document Links */}
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider pb-2">
                Related Links
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-300">
                {urlFields.map(fieldKey => {
                  const url = seedDetails?.[fieldKey];
                  if (url && url !== 'N/A') {
                    const buttonText = fieldKey.replace(/_/g, ' ').replace('QR', 'QR ');
                    return (
                      <Button key={fieldKey} asChild variant="secondary" size="sm">
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          {buttonText}
                        </a>
                      </Button>
                    );
                  }
                  return null;
                })}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Withdrawal Error above the card for easier viewing */}
        <CustomAlert
          type="error"
          title="Error"
          message={withdrawalError}
          show={!!withdrawalError}
          onDismiss={() => setWithdrawalError(null)}
        />

        {/* Withdraw Seed Volume Section */}
        <Card className="shadow-md p-4 space-y-4">
          <CardHeader className="p-0">
            <CardTitle className="text-xl font-bold mb-4">
              {isConfirming ? 'Confirm Withdrawal' : 'Withdraw Seed Volume'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isConfirming ? (
              <div className="space-y-4">
                <div className="space-y-2 bg-muted p-4 rounded-md">
                  <div className="flex justify-between">
                    <span>Current Volume:</span>
                    <span className="font-semibold">{seedDetails?.VOLUME} {seedDetails?.UNIT}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Withdrawal Amount:</span>
                    <span className="font-semibold">{withdrawAmount} {seedDetails?.UNIT}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining Volume:</span>
                    <span className="font-semibold">
                      {parseFloat(seedDetails?.VOLUME || '0') - Number(withdrawAmount)} {seedDetails?.UNIT}
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Reason: </span>
                    <span className="text-sm">{withdrawReason}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsConfirming(false)}
                    disabled={isWithdrawing}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleConfirmWithdraw}
                    disabled={isWithdrawing}
                  >
                    {isWithdrawing ? 'Processing...' : 'Confirm Withdrawal'}
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="withdrawAmount" className="block text-sm font-medium text-gray-700">Enter Amount:</label>
                    <input
                      type="number"
                      id="withdrawAmount"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
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
                <Button type="submit" className="w-full">Withdraw</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </Card>
      
      {/* Back to Scan button */}
      <div className="flex justify-center mt-6">
        <Button variant="outline" onClick={() => navigate('/scan-qr')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Scan
        </Button>
      </div>
    </div>
  );
};

const SeedManagementPage = () => {
  return (
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

export default SeedManagementPage;