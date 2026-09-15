import { Plus, Trash2 } from 'lucide-react'

import { btnSecondary, thCell } from '@/components/admin/styles'
import { Button } from '@/components/ui/button'

import type { CapitationTierFormRow } from '../utils'

interface CapitationTierEditorProps {
  rows: CapitationTierFormRow[]
  error: string | null
  onChange: (rows: CapitationTierFormRow[]) => void
}

function updateRow(
  rows: CapitationTierFormRow[],
  index: number,
  field: keyof CapitationTierFormRow,
  value: string,
): CapitationTierFormRow[] {
  return rows.map((row, rowIndex) =>
    rowIndex === index ? { ...row, [field]: value } : row,
  )
}

export function CapitationTierEditor({ rows, error, onChange }: CapitationTierEditorProps) {
  function addRow() {
    const last = rows[rows.length - 1]
    const lastMin = Number(last.minEnrollees) || 1
    const closedMax =
      last.maxEnrollees.trim() !== '' ? Number(last.maxEnrollees) : lastMin + 4998
    onChange([
      ...rows.slice(0, -1),
      { ...last, maxEnrollees: String(closedMax) },
      {
        minEnrollees: String(closedMax + 1),
        maxEnrollees: '',
        amount: last.amount,
      },
    ])
  }

  function removeRow(index: number) {
    if (rows.length <= 1) return
    const next = rows.filter((_, rowIndex) => rowIndex !== index)
    next[next.length - 1] = { ...next[next.length - 1], maxEnrollees: '' }
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Min enrollees', 'Max enrollees', 'Monthly amount (NGN)', ''].map((heading) => (
                  <th className={thCell} key={heading || 'actions'}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const isLast = index === rows.length - 1
                return (
                  <tr key={index}>
                    <td className="px-4 py-3">
                      <input
                        aria-label={`Band ${index + 1} minimum enrollees`}
                        className="h-10 w-full min-w-28 rounded-lg border border-border bg-card px-3 text-sm"
                        inputMode="numeric"
                        onChange={(event) =>
                          onChange(updateRow(rows, index, 'minEnrollees', event.target.value))
                        }
                        value={row.minEnrollees}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        aria-label={`Band ${index + 1} maximum enrollees`}
                        className="h-10 w-full min-w-28 rounded-lg border border-border bg-card px-3 text-sm"
                        disabled={isLast}
                        inputMode="numeric"
                        onChange={(event) =>
                          onChange(updateRow(rows, index, 'maxEnrollees', event.target.value))
                        }
                        placeholder={isLast ? 'No max' : ''}
                        value={row.maxEnrollees}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        aria-label={`Band ${index + 1} monthly amount`}
                        className="h-10 w-full min-w-36 rounded-lg border border-border bg-card px-3 text-sm"
                        inputMode="numeric"
                        onChange={(event) =>
                          onChange(updateRow(rows, index, 'amount', event.target.value))
                        }
                        value={row.amount}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        aria-label={`Remove band ${index + 1}`}
                        disabled={rows.length <= 1}
                        onClick={() => removeRow(index)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Button className={btnSecondary} onClick={addRow} type="button" variant="outline">
        <Plus aria-hidden="true" /> Add band
      </Button>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
