"use client"

import * as React from "react"
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"
import clsx from "clsx"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface SummaryRow {
  id: number
  optionValue: string
  remainingVolume: number
  withdrawnYTD: number
  status: string
}

interface SummaryTableProps {
  data: SummaryRow[]
  title?: string
}

export default function SummaryTable({ data, title = "Summary Table" }: SummaryTableProps) {
  const [sortConfig, setSortConfig] = React.useState<{
    key: keyof SummaryRow
    direction: "ascending" | "descending"
  } | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const pageSize = 10

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data

    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? -1 : 1
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? 1 : -1
      }
      return 0
    })
  }, [data, sortConfig])

  const totalPages = Math.ceil(sortedData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentPageData = sortedData.slice(startIndex, endIndex)

  const requestSort = (key: keyof SummaryRow) => {
    let direction: "ascending" | "descending" = "ascending"

    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }

    setSortConfig({ key, direction })
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => requestSort("optionValue")}
                    className="flex items-center gap-1 p-0 h-auto font-medium text-sm w-full justify-start"
                  >
                    Option Value <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => requestSort("remainingVolume")}
                    className="flex items-center gap-1 p-0 h-auto font-medium text-sm w-full justify-start"
                  >
                    Remaining Volume <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => requestSort("withdrawnYTD")}
                    className="flex items-center gap-1 p-0 h-auto font-medium text-sm w-full justify-start"
                  >
                    Withdrawn YTD <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => requestSort("status")}
                    className="flex items-center gap-1 p-0 h-auto font-medium text-sm w-full justify-start"
                  >
                    Status <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPageData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.optionValue}</TableCell>
                  <TableCell>{row.remainingVolume.toLocaleString()}</TableCell>
                  <TableCell>{row.withdrawnYTD.toLocaleString()}</TableCell>
                  <TableCell>
                    <span
                      className={clsx(
                        "px-2 py-1 rounded text-xs font-medium",
                        row.status === "Low" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800",
                      )}
                    >
                      {row.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, sortedData.length)} of {sortedData.length} items
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
