"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import clsx from "clsx"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ReleaseLogItem {
  id: string
  date: string
  timestamp: string
  volume: number
  reason: string
  user: string
  inventoryType: string
  qrCode: string
  previousValue: string
  newValue: string
}

interface ReleaseLogTableProps {
  data: ReleaseLogItem[]
}

// Pagination options
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// Get current date dynamically
const CURRENT_DATE = new Date()

export default function ReleaseLogTable({ data }: ReleaseLogTableProps) {
  // Process release log data
  const processReleaseLogData = React.useCallback(() => {
    return data.map((item) => {
      const releaseDate = new Date(item.date)
      const daysSinceRelease = Math.floor((CURRENT_DATE.getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24))

      return {
        ...item,
        daysSinceRelease,
        formattedDate: releaseDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }),
      }
    })
  }, [data])

  const [releaseLogData, setReleaseLogData] = React.useState(processReleaseLogData())

  React.useEffect(() => {
    setReleaseLogData(processReleaseLogData())
  }, [processReleaseLogData])

  // State
  const [selectedRowIndex, setSelectedRowIndex] = React.useState<number | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [mounted, setMounted] = React.useState(false)

  // Ensure component is mounted before rendering
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate pagination
  const totalItems = releaseLogData.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentPageData = releaseLogData.slice(startIndex, endIndex)

  // Reset to first page when page size changes
  React.useEffect(() => {
    setCurrentPage(1)
    setSelectedRowIndex(null)
  }, [pageSize])

  // Handle row click for navigation highlighting
  const handleRowClick = (index: number) => {
    setSelectedRowIndex(selectedRowIndex === index ? null : index)
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    setSelectedRowIndex(null)
  }

  // Handle page size change
  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(Number(newPageSize))
  }

  // Format volume based on inventory type
  const formatVolume = (volume: number, inventoryType: string) => {
    if (inventoryType === "Seed Storage") {
      return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }).format(volume) + "g"
    } else if (inventoryType === "Planting Materials") {
      return Math.floor(volume) + " pcs"
    } else {
      // Fallback for other inventory types
      return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }).format(volume)
    }
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 3

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      const startPage = Math.max(1, currentPage - 1)
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

      if (startPage > 1) {
        pages.push(1)
        if (startPage > 2) pages.push("...")
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push("...")
        pages.push(totalPages)
      }
    }

    return pages
  }

  // Don't render table until component is mounted
  if (!mounted) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg md:text-xl">Release Log</CardTitle>
          <CardDescription>Loading release log data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col space-y-3">
          <div>
            <CardTitle className="text-xl font-bold">Release Log</CardTitle>
            <CardDescription className="text-sm">
              Complete history of seed withdrawals and releases
            </CardDescription>
          </div>

          {/* Search controls */}
          <div className="flex flex-col space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">

              <div className="flex gap-3">
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="h-10 w-20 sm:w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 sm:px-6">
        <div className="space-y-4">
          {/* Table container */}
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[100px] min-w-[100px]">
                      <div className="font-medium text-sm">Date</div>
                    </TableHead>
                    <TableHead className="text-right w-[120px] min-w-[120px]">
                      <div className="font-medium text-sm ml-auto">Volume</div>
                    </TableHead>
                    <TableHead className="w-[120px] min-w-[120px]">
                      <div className="font-medium text-sm">Reason</div>
                    </TableHead>
                    <TableHead className="w-[100px] min-w-[100px]">
                      <div className="font-medium text-sm">User</div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentPageData.map((item, index) => {
                    const isSelected = selectedRowIndex === index

                    return (
                      <TableRow
                        key={startIndex + index}
                        className={clsx(
                          "cursor-pointer transition-all duration-200",
                          "hover:bg-muted border-l-4 border-l-transparent",
                          isSelected && "ring-1 ring-blue-500 bg-blue-50 hover:bg-blue-100",
                        )}
                        onClick={() => handleRowClick(index)}
                      >
                        <TableCell className="py-3">
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{item.formattedDate}</div>
                            <div className="text-xs text-muted-foreground">{item.daysSinceRelease} days ago</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-3">
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{formatVolume(item.volume, item.inventoryType)}</div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="text-sm">{item.reason || "Not specified"}</div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="text-sm">{item.user || "Unknown"}</div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-xs text-muted-foreground order-2 sm:order-1">
              Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} results
            </div>

            <div className="flex items-center gap-2 order-1 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => (
                  <React.Fragment key={index}>
                    {page === "..." ? (
                      <span className="px-2 text-xs text-muted-foreground">...</span>
                    ) : (
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page as number)}
                        className="h-8 w-8 p-0 text-xs"
                      >
                        {page}
                      </Button>
                    )}
                  </React.Fragment>
                ))}
              </div>

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
        </div>
      </CardContent>
    </Card>
  )
}