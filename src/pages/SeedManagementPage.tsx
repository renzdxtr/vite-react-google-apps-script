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
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) {
      return `${key.replace(/_/g, ' ')} must be a valid date (YYYY-MM-DDTHH:MM format)`;
    }
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
    if (DATE_FIELDS.includes(key)) return 'Required (YYYY-MM-DDTHH:MM)';
    return `${key.replace(/_/g, ' ')} is required`;
  };

  const handleEditChange = (key: string, value: string) => {
    setEditedDetails((prev) => ({
      ...prev,
      [key]: value,
    }));

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

    // 2) Validate required original fields that weren’t edited
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

    // 3) Call updateSeedDetails
    try {
      const response = await updateSeedDetails({
        qrCode: (seedDetails as SeedDetailsType)?.CODE,
        oldData: seedDetails as SeedDetailsType,
        newData: editedDetails,
      });

      if (response.success) {
        setIsEditing(false);
        setEditedDetails({});
        setFieldErrors({});
        setHasUnsavedChanges(false);
        await refetch();
        setEditSuccess('Details updated successfully');
      } else {
        setFieldErrors({ _global: response.message || 'Failed to update details' });
      }
    } catch (err: any) {
      setFieldErrors({ _global: err.message || 'Error updating details' });
    }
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
                  <p className="font-semibold">{seedDetails.STORED_DATE}</p>
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
                  <Button variant="ghost" onClick={() => setIsEditing(true)}>
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
