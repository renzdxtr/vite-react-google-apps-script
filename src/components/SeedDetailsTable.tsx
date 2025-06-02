// src/components/SeedDetailsTable.tsx
import React from 'react';
import { NON_EDITABLE_FIELDS, DATE_FIELDS, DETAIL_KEY_ORDER, DROPDOWN_CHOICES } from '@/lib/constants';

export interface SeedDetails {
  [key: string]: any;
}

export interface SeedDetailsTableProps {
  seedDetails: SeedDetails;
  isEditing: boolean;
  editedDetails: Record<string, string>;
  fieldErrors: Record<string, string>;
  handleEditChange: (key: string, newValue: string) => void;
  getDisplayValue: (key: string, originalValue: any) => string;
  getPlaceholder: (key: string) => string;
}

export function SeedDetailsTable({
  seedDetails,
  isEditing,
  editedDetails,
  fieldErrors,
  handleEditChange,
  getDisplayValue,
  getPlaceholder,
}: SeedDetailsTableProps) {
  // Keys that correspond to “URL‐type” fields; we will filter these out entirely
  const urlFields = ['SEED_PHOTO', 'CROP_PHOTO', 'QR_IMAGE', 'QR_DOCUMENT'];

  // 1) Build an array of [key, value] for all fields that should be shown
  const allEntries = Object.entries(seedDetails).filter(
    ([key, value]) =>
      value != null && // skip null/undefined
      value !== '' && // skip empty string
      value !== 'N/A' && // skip literal "N/A"
      !urlFields.includes(key) // skip URL fields
  ) as [string, any][];

  // 2) Pull out the “preferred” entries, in EXACT order listed in DETAIL_KEY_ORDER
  const preferredEntries: [string, any][] = DETAIL_KEY_ORDER
    .filter((key) => seedDetails.hasOwnProperty(key))
    .map((key) => [key, seedDetails[key]] as [string, any]);

  // 3) Build a Set of all keys that have been “claimed” above
  const claimedKeys = new Set(preferredEntries.map(([key]) => key));

  // 4) Collect the “remaining” entries: those keys not in DETAIL_KEY_ORDER
  const remainingEntries = allEntries
    .filter(([key]) => !claimedKeys.has(key))
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB)); // alphabetical

  // 5) Combine preferred + remaining
  const sortedEntries = [...preferredEntries, ...remainingEntries];

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto">
        <thead>
          <tr>
            <th className="w-[200px] text-left text-sm font-medium text-gray-500 uppercase tracking-wider pb-2">
              Attribute
            </th>
            <th className="text-left text-sm font-medium text-gray-500 uppercase tracking-wider pb-2">
              Value
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sortedEntries.map(([key, value]) => (
            <tr key={key}>
              <td className="py-2 pr-4 text-sm font-medium text-gray-900">
                {key}
              </td>
              <td className="py-2 text-sm text-gray-700">
                {isEditing && !NON_EDITABLE_FIELDS.includes(key) ? (
                  <div className="space-y-1">
                    {DATE_FIELDS.includes(key) ? (
                      <div className="relative">
                        <input
                          type="date" 
                          value={(() => {
                            // Convert MM/DD/YYYY to YYYY-MM-DD for the date input
                            const displayValue = getDisplayValue(key, value);
                            if (displayValue && displayValue.includes('/')) {
                              const [month, day, year] = displayValue.split('/');
                              return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                            }
                            return displayValue;
                          })()}
                          onChange={(e) => {
                            // Convert YYYY-MM-DD to MM/DD/YYYY format
                            const dateValue = e.target.value;
                            if (dateValue) {
                              const [year, month, day] = dateValue.split('-');
                              const formattedDate = `${month}/${day}/${year}`;
                              handleEditChange(key, formattedDate);
                            } else {
                              handleEditChange(key, '');
                            }
                          }}
                          placeholder={getPlaceholder(key)}
                          className={`w-full rounded-md border shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                            fieldErrors[key] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        <small className="text-xs text-gray-500 mt-1 block">
                          Current: {(() => {
                            // Format date as MM/DD/YYYY
                            if (value) {
                              if (typeof value === 'string' && value.includes('/')) {
                                return value; // Already in MM/DD/YYYY format
                              }
                              try {
                                const date = new Date(value);
                                if (!isNaN(date.getTime())) {
                                  const month = String(date.getMonth() + 1).padStart(2, '0');
                                  const day = String(date.getDate()).padStart(2, '0');
                                  const year = date.getFullYear();
                                  return `${month}/${day}/${year}`;
                                }
                              } catch (e) {
                                // Fall back to original value if date parsing fails
                              }
                            }
                            return value || 'None';
                          })()} (Format: MM/DD/YYYY)
                        </small>
                      </div>
                    ) : key in DROPDOWN_CHOICES ? (
                      <div className="relative">
                        <select
                          value={getDisplayValue(key, value)}
                          onChange={(e) => handleEditChange(key, e.target.value)}
                          className={`w-full rounded-md border shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                            fieldErrors[key] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">-- Select {key.replace(/_/g, ' ')} --</option>
                          {DROPDOWN_CHOICES[key as keyof typeof DROPDOWN_CHOICES].map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <small className="text-xs text-gray-500 mt-1 block">
                          Current: {value || 'None'}
                        </small>
                      </div>
                    ) : (
                      <input
                        type={
                          key === 'LOT_NUMBER' ||
                          key === 'BAG_NUMBER' ||
                          key === 'GERMINATION_RATE' ||
                          key === 'MOISTURE_CONTENT' ||
                          key === 'VOLUME'
                            ? 'number'
                            : 'text'
                        }
                        value={getDisplayValue(key, value)}
                        onChange={(e) =>
                          handleEditChange(key, e.target.value)
                        }
                        placeholder={getPlaceholder(key)}
                        className={`w-full rounded-md border shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                          fieldErrors[key] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    )}
                    {fieldErrors[key] && (
                      <p className="text-xs text-red-600 mt-1">
                        {fieldErrors[key]}
                      </p>
                    )}
                  </div>
                ) : (
                  String(value)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
