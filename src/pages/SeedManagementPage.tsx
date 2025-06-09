// src/pages/SeedManagementPage.tsx
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Loader2,
  Info,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Edit,
} from 'lucide-react';

import { updateSeedVolume, updateSeedDetails } from '@/server/gas';
import {
  NON_EDITABLE_FIELDS,
  NON_REQUIRED_FIELDS,
  DATE_FIELDS,
  DETAIL_KEY_ORDER,
  SUMMARY_DETAILS,
} from '@/lib/constants';
import { CustomAlert } from '@/components/ui/custom-alert';

import { useSeedDetails, SeedDetails as SeedDetailsType } from '@/hooks/useSeedDetails';
import { SeedDetailsTable } from '@/components/SeedDetailsTable';

import { PIN_CODES } from '@/lib/constants';

/**
 * validateField: coerce any rawValue → string, then run:
 *  1) Required‐field check (string.trim() === '')
 *  2) Date format check (if key ∈ DATE_FIELDS)
 *  3) Numeric range check (0 ≤ x ≤ 100) for GERMINATION_RATE / MOISTURE_CONTENT
 */
function validateField(key: string, rawValue: unknown): string | null {
  const value = rawValue == null ? '' : String(rawValue);

  // 1) Required check
  if (!NON_REQUIRED_FIELDS.includes(key) && value.trim() === '') {
    return `${key.replace(/_/g, ' ')} is required`;
  }

  // 2) Date‐field validation
  if (DATE_FIELDS.includes(key) && value.trim() !== '') {
    // Accept MM/DD/YYYY format
    const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
    if (!dateRegex.test(value)) {
      return `${key.replace(/_/g, ' ')} must be in MM/DD/YYYY format`;
    }
    return null;
  }

  // 3) Numeric range for germination/moisture
  if (['GERMINATION_RATE', 'MOISTURE_CONTENT'].includes(key) && value.trim() !== '') {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0 || num > 100) {
      return `${key.replace(/_/g, ' ')} must be a number between 0 and 100`;
    }
  }

  return null;
}

export const SeedManagementContent: React.FC = () => {
  const urlFields = ['SEED_PHOTO', 'CROP_PHOTO', 'QR_IMAGE', 'QR_DOCUMENT'];
  const [searchParams] = useSearchParams();
  const qrCode = searchParams.get('qrCode');
  const navigate = useNavigate();

  // ─── Fetching state via custom hook ────────────────────────────────────────
  const { seedDetails, isLoading, error, refetch } = useSeedDetails(qrCode);

  // ─── Withdrawal state ──────────────────────────────────────────────────────
  const [withdrawAmount, setWithdrawAmount] = useState<number | ''>('');
  const [withdrawReason, setWithdrawReason] = useState<string>('');
  const [withdrawalError, setWithdrawalError] = useState<string | null>(null);
  const [withdrawalSuccess, setWithdrawalSuccess] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);

  // ─── Editing state ─────────────────────────────────────────────────────────
  const [isDetailsExpanded, setIsDetailsExpanded] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedDetails, setEditedDetails] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // ─── Pin when Editing state ─────────────────────────────────────────────────────────
  const [isPinVerifying, setIsPinVerifying] = useState<boolean>(false);
  const [pin, setPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinAttempts, setPinAttempts] = useState<number>(0);

  //
  // ─── VALIDATE & HANDLE WITHDRAWAL ───────────────────────────────────────────
  //
  const validateWithdrawal = (): boolean => {
    const rawVolume = (seedDetails as SeedDetailsType)?.VOLUME;
    const currentVolume = parseFloat(rawVolume == null ? '0' : String(rawVolume));

    if (withdrawAmount === '' || withdrawAmount <= 0) {
      setWithdrawalError('Please enter a valid withdrawal amount.');
      return false;
    }
    if (withdrawAmount > currentVolume || currentVolume <= 0) {
      setWithdrawalError(
        `Withdrawal amount (${withdrawAmount}) exceeds available volume (${currentVolume}).`
      );
      return false;
    }
    return true;
  };

  const handleWithdrawSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setWithdrawalError(null);

    if (validateWithdrawal()) {
      setIsConfirming(true);
    }
  };

  const handleConfirmWithdraw = async () => {
    setIsWithdrawing(true);
    setWithdrawalError(null);

    try {
      if (qrCode) {
        const result = await updateSeedVolume({
          qrCode,
          withdrawalAmount: withdrawAmount as number,
          withdrawalReason: withdrawReason,
        });
        if (result.success) {
          setWithdrawalSuccess(`Successfully withdrew ${withdrawAmount} units.`);
          setWithdrawAmount('');
          setWithdrawReason('');
          setIsConfirming(false);
          await refetch();
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

  // Add this function to your component
  // ...
  // Add a state to store the verified PIN
  const [verifiedPin, setVerifiedPin] = useState<string>('');
  
  // Modify the handlePinSubmit function to store the verified PIN
  const handlePinSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPinError(null);
  
    if (PIN_CODES.includes(pin)) {
      setVerifiedPin(pin); // Store the verified PIN
      setPin('');
      setPinError(null);
      setPinAttempts(0);
      setIsPinVerifying(false);
      setIsEditing(true);
    } else {
      const newAttempts = pinAttempts + 1;
      setPinAttempts(newAttempts);
      setPinError(`Invalid PIN. ${newAttempts >= 3 ? 'Please contact an administrator.' : ''}`);
      if (newAttempts >= 5) {
        setTimeout(() => {
          setIsPinVerifying(false);
          setPin('');
          setPinError(null);
          setPinAttempts(0);
        }, 2000);
      }
    }
  };

  useEffect(() => {
    if (withdrawalSuccess) {
      const timer = setTimeout(() => setWithdrawalSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [withdrawalSuccess]);

  //
  // ─── HANDLE EDITING ─────────────────────────────────────────────────────────
  //
  const getDisplayValue = (key: string, originalValue: any): string => {
    return key in editedDetails ? editedDetails[key] : String(originalValue);
  };

  const getPlaceholder = (key: string): string => {
    if (NON_REQUIRED_FIELDS.includes(key)) return '';
    if (DATE_FIELDS.includes(key)) return 'Required (MM/DD/YYYY)';
    return `${key.replace(/_/g, ' ')} is required`;
  };

  const handleEditChange = (key: string, value: string) => {
    // Special handling for VOLUME to ensure precise number handling
    if (key === 'VOLUME') {
      // Ensure we're storing the exact string value without any manipulation
      setEditedDetails((prev) => ({
        ...prev,
        [key]: value.trim(),
      }));
    }

    else if (DATE_FIELDS.includes(key)) {
      // Special handling for date fields to maintain MM/DD/YYYY format
      setEditedDetails((prev) => ({
        ...prev,
        [key]: value,
      }));
    } 

    else {
      setEditedDetails((prev) => ({
        ...prev,
        [key]: value,
      }));
    }

    // Real‐time validation
    const errorMsg = validateField(key, value);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (errorMsg) next[key] = errorMsg;
      else delete next[key];
      return next;
    });

    setHasUnsavedChanges(true);
  };

  const handleSaveEdit = async () => {
    const errors: Record<string, string> = {};

    // 1) Validate edited fields
    Object.keys(editedDetails).forEach((key) => {
      const errMsg = validateField(key, editedDetails[key]);
      if (errMsg) errors[key] = errMsg;
    });

    // 2) Validate required original fields that weren't edited
    if (seedDetails) {
      Object.keys(seedDetails).forEach((key) => {
        if (
          !NON_REQUIRED_FIELDS.includes(key) &&
          !urlFields.includes(key) &&
          !(key in editedDetails)
        ) {
          const rawValue = (seedDetails as SeedDetailsType)[key];
          const errMsg = validateField(key, rawValue);
          if (errMsg) errors[key] = errMsg;
        }
      });
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Create a copy of editedDetails to ensure we don't modify the original state
    const processedDetails = { ...editedDetails };
    
    // Process date fields to ensure they're in MM/DD/YYYY format without time component
    Object.keys(processedDetails).forEach(key => {
      if (DATE_FIELDS.includes(key) && processedDetails[key]) {
        // If the date already has the correct format, keep it as is
        const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
        if (!dateRegex.test(processedDetails[key])) {
          // Try to extract just the date part if it contains time
          const dateObj = new Date(processedDetails[key]);
          if (!isNaN(dateObj.getTime())) {
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const year = dateObj.getFullYear();
            processedDetails[key] = `${month}/${day}/${year}`;
          }
        }
      }
    });
    
    // Debug what's being sent to the server
    console.log('Edited details before sending:', processedDetails);
    if (processedDetails.VOLUME) {
      console.log('VOLUME type:', typeof processedDetails.VOLUME, 'Value:', processedDetails.VOLUME);
    }

    // 3) Call updateSeedDetails
    try {
      const response = await updateSeedDetails({
        qrCode: (seedDetails as SeedDetailsType)?.CODE,
        oldData: seedDetails as SeedDetailsType,
        newData: processedDetails,
        pinCode: verifiedPin // Add the PIN code to the request
      });

      if (response.success) {
        setIsEditing(false);
        setEditedDetails({});
        setFieldErrors({});
        setHasUnsavedChanges(false);
        setVerifiedPin(''); // Reset the verified PIN
        await refetch();
        setEditSuccess('Details updated successfully');
      } else {
        setFieldErrors({ _global: response.message || 'Failed to update details' });
      }
    } catch (err: any) {
      setFieldErrors({ _global: err.message || 'Error updating details' });
    }
  };

  // Helper function to format dates consistently
  const formatDate = (dateValue: any): string => {
    if (!dateValue) return '';
    
    // If already in MM/DD/YYYY format, return as is
    if (typeof dateValue === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateValue)) {
      return dateValue;
    }
    
    try {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      }
    } catch (e) {
      // Fall back to original value if date parsing fails
    }
    
    return String(dateValue);
  };

  useEffect(() => {
    if (editSuccess) {
      const timer = setTimeout(() => setEditSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [editSuccess]);

  //
  // ─── RENDER LOADING / ERROR STATES ───────────────────────────────────────────
  //
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-center">
          Loading seed details for '{qrCode || '...'}'...
        </p>
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
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={() => navigate('/scan-qr')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Scan
          </Button>
        </div>
      </div>
    );
  }

  //
  // ─── RENDER MAIN CONTENT ───────────────────────────────────────────────────────
  //
  return (
    <div className="container mx-auto py-4 max-w-3xl">
      <Card className="shadow-xl p-6 space-y-6">
        {/* ─── Header & Alerts ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Seed Management</h1>
        </div>

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

        {/* ─── Updated Seed Summary Card ──────────────────────────────── */}
        <Card className="shadow-md p-4 space-y-4">
          <CardHeader className="p-0">
            <CardTitle className="text-xl font-bold">Seed Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            {/* ─── Group 1: QR Code ──────────────────────────────────── */}
            {seedDetails?.CODE && (
              <div>
                <p className="text-sm text-muted-foreground">QR Code:</p>
                <p className="font-mono font-semibold">{seedDetails.CODE}</p>
              </div>
            )}

            {/* Separator */}
            <div className="border-t border-gray-300 my-2" />

            {/* ─── Group 2: Crop, Variety, Volume Stored ──────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {seedDetails?.CROP && (
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Crop:</p>
                  <p className="font-semibold">{seedDetails.CROP}</p>
                </div>
              )}
              {seedDetails?.VARIETY && (
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Variety:</p>
                  <p className="font-semibold">{seedDetails.VARIETY}</p>
                </div>
              )}
              {(seedDetails?.VOLUME || seedDetails?.UNIT) && (
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Volume Stored:</p>
                  <p className="font-semibold">
                    {seedDetails.VOLUME} {seedDetails.UNIT}
                  </p>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="border-t border-gray-300 my-2" />

            {/* ─── Group 3: Lot No., Bag No., Date Stored ─────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {seedDetails?.LOT_NUMBER && (
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Lot No.:</p>
                  <p className="font-semibold">{seedDetails.LOT_NUMBER}</p>
                </div>
              )}
              {seedDetails?.BAG_NUMBER && (
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Bag No.:</p>
                  <p className="font-semibold">{seedDetails.BAG_NUMBER}</p>
                </div>
              )}
              {seedDetails?.STORED_DATE && (
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Date Stored:</p>
                  <p className="font-semibold">{formatDate(seedDetails.STORED_DATE)}</p>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="border-t border-gray-300 my-2" />

            {/* ─── Group 4: Germination Rate (%), Moisture Content (%) ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {seedDetails?.GERMINATION_RATE && (
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Germination Rate (%):</p>
                  <p className="font-semibold">{seedDetails.GERMINATION_RATE}%</p>
                </div>
              )}
              {seedDetails?.MOISTURE_CONTENT && (
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Moisture Content (%):</p>
                  <p className="font-semibold">{seedDetails.MOISTURE_CONTENT}%</p>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="border-t border-gray-300 my-2" />

            {/* ─── Group 5: Seed Class, Program ────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {seedDetails?.SEED_CLASS && (
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Seed Class:</p>
                  <p className="font-semibold">{seedDetails.SEED_CLASS}</p>
                </div>
              )}
              {seedDetails?.PROGRAM && (
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Program:</p>
                  <p className="font-semibold">{seedDetails.PROGRAM}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ─── Collapsible “Full Details” Section ───────────────────────────── */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xl font-bold">Full Details</CardTitle>
            <div className="flex gap-2">
              {isDetailsExpanded && (
                isEditing ? (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsEditing(false);
                        setEditedDetails({});
                        setFieldErrors({});
                        setHasUnsavedChanges(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button variant="default" onClick={handleSaveEdit}>
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button variant="ghost" onClick={() => setIsPinVerifying(true)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                )
              )}
              <Button
                variant="ghost"
                onClick={() => {
                  setIsDetailsExpanded(!isDetailsExpanded);
                  // Cancel editing when hiding details
                  if (isDetailsExpanded) {
                    setIsEditing(false);
                    setEditedDetails({});
                    setFieldErrors({});
                    setHasUnsavedChanges(false);
                  }
                }}
                className="transition-transform duration-300 ease-in-out"
              >
                {isDetailsExpanded ? (
                  <>
                    <ChevronUp className="mr-1 h-4 w-4" /> Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-1 h-4 w-4" /> View Details
                  </>
                )}
              </Button>
            </div>
          </CardHeader>

          {isDetailsExpanded && (
            <CardContent className="p-4 border-t border-gray-300 space-y-4">
              {/* ─── Error Summary (shown only in edit mode) ─────────────────── */}
              {isEditing && Object.keys(fieldErrors).length > 0 && (
                <CustomAlert
                  type="error"
                  title="Fix the following errors"
                  message={
                    <ul className="list-disc pl-5">
                      {Object.entries(fieldErrors).map(([key, msg]) => (
                        <li key={key}>{msg}</li>
                      ))}
                    </ul>
                  }
                  show={true}
                  onDismiss={() => {
                    /* no-op: keep errors displayed until user corrects them */
                  }}
                />
              )}

              {/* ─── Details Table (attributes + inputs) ─────────────────── */}
              {seedDetails && (
                <SeedDetailsTable
                  seedDetails={seedDetails}
                  isEditing={isEditing}
                  editedDetails={editedDetails}
                  fieldErrors={fieldErrors}
                  handleEditChange={handleEditChange}
                  getDisplayValue={getDisplayValue}
                  getPlaceholder={getPlaceholder}
                />
              )}

              {/* ─── Image & Document Links ─────────────────────────────── */}
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider pb-2">
                Related Links
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-300">
                {urlFields.map((fieldKey) => {
                  const url = (seedDetails as SeedDetailsType)?.[fieldKey];
                  if (url && url !== 'N/A') {
                    const buttonText = fieldKey
                      .replace(/_/g, ' ')
                      .replace('QR', 'QR ');
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

        {isPinVerifying && (
          <Card className="shadow-md p-4 space-y-4">
            <CardHeader className="p-0">
              <CardTitle className="text-xl font-bold mb-4">
                Authorization Required
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Please enter your PIN to edit seed details.
                  </p>
                  <input
                    type="password"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-center text-lg tracking-widest"
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      setPinError(null);
                    }}
                    placeholder="Enter PIN"
                    maxLength={6}
                    autoFocus
                  />
                  {pinError && (
                    <p className="text-destructive text-sm">{pinError}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setIsPinVerifying(false);
                      setPin('');
                      setPinError(null);
                      setPinAttempts(0);
                    }}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    type="submit"
                  >
                    Verify
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <CustomAlert
          type="error"
          title="Error"
          message={withdrawalError}
          show={!!withdrawalError}
          onDismiss={() => setWithdrawalError(null)}
        />

        {/* ─── Withdraw Seed Volume Section ─────────────────────────────── */}
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
                    <span className="font-semibold">
                      {String((seedDetails as SeedDetailsType)?.VOLUME)}{' '}
                      {(seedDetails as SeedDetailsType)?.UNIT}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Withdrawal Amount:</span>
                    <span className="font-semibold">
                      {withdrawAmount} {(seedDetails as SeedDetailsType)?.UNIT}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining Volume:</span>
                    <span className="font-semibold">
                      {parseFloat(
                        String((seedDetails as SeedDetailsType)?.VOLUME || 0)
                      ) - Number(withdrawAmount)}{' '}
                      {(seedDetails as SeedDetailsType)?.UNIT}
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
                    <label
                      htmlFor="withdrawAmount"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Enter Amount:
                    </label>
                    <input
                      type="number"
                      id="withdrawAmount"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      value={withdrawAmount}
                      onChange={(e) =>
                        setWithdrawAmount(
                          e.target.value === '' ? '' : parseFloat(e.target.value)
                        )
                      }
                      min="0"
                      step="any"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="withdrawReason"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Reason:
                    </label>
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

      {/* ─── Back to Scan button ──────────────────────────────────────────────── */}
      <div className="flex justify-center mt-6">
        <Button variant="outline" onClick={() => navigate('/scan-qr')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Scan
        </Button>
      </div>
    </div>
  );
};

export const SeedManagementPage: React.FC = () => (
  <Suspense
    fallback={
      <div className="flex flex-col items-center justify-center min-h-[200px] p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-center">Loading seed management page...</p>
        <p className="mt-1 text-muted-foreground text-center">Please wait a moment.</p>
      </div>
    }
  >
    <SeedManagementContent />
  </Suspense>
);

export default SeedManagementPage;
