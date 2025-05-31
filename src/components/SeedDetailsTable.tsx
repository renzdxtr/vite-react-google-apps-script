// src/components/SeedDetailsTable.tsx
import React from 'react';
import { NON_EDITABLE_FIELDS, DATE_FIELDS, DETAIL_KEY_ORDER } from '@/lib/constants';

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
                      <input
                        type="datetime-local"
                        value={getDisplayValue(key, value)}
                        onChange={(e) =>
                          handleEditChange(key, e.target.value)
                        }
                        placeholder={getPlaceholder(key)}
                        className={`w-full rounded-md border shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                          fieldErrors[key] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    ) : (
                      <input
                        type={
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
