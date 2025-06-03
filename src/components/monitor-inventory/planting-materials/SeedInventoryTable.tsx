"use client"

import * as React from "react"
import { AlertCircle, ArrowUpDown, Timer, Search, ChevronLeft, ChevronRight } from "lucide-react"
import clsx from "clsx"

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SAMPLE_DATA_INVENTORY } from "@/lib/constants";

// Global thresholds - easily configurable
const LOW_STOCK_THRESHOLD = 10_000 // grams
const AGING_THRESHOLD = 30 // days
const CRITICAL_AGING_THRESHOLD = 90 // days
const VERY_LOW_STOCK_THRESHOLD = 5_000 // grams

// Pagination options
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// Get current date dynamically
const CURRENT_DATE = new Date()

// Process inventory data and calculate days stored
const processInventoryData = () => {
  return SAMPLE_DATA_INVENTORY.map((item) => {
    const storedDate = new Date(item.STORED_DATE)
    const daysDiff = Math.floor((CURRENT_DATE.getTime() - storedDate.getTime()) / (1000 * 60 * 60 * 24))

    return {
      crop: item.CROP,
      variety: item.VARIETY,
      lotNumber: item.LOT_NUMBER,
      dateStored: item.STORED_DATE,
      quantityLeft: item.VOLUME,
      daysStored: daysDiff,
      location: item.LOCATION,
      seedClass: item.SEED_CLASS,
      germinationRate: item.GERMINATION_RATE,
    }
  })
}

export default function SeedInventoryTable() {
  const [inventoryData, setInventoryData] = React.useState(processInventoryData())
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedRowIndex, setSelectedRowIndex] = React.useState<number | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [mounted, setMounted] = React.useState(false)
  const [sortConfig, setSortConfig] = React.useState<{
    key: string
    direction: "ascending" | "descending"
  } | null>(null)

  // Ensure component is mounted before rendering
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Filter data based on search query
  const filteredData = React.useMemo(() => {
    if (!searchQuery) return inventoryData

    const lowerCaseQuery = searchQuery.toLowerCase()
    return inventoryData.filter(
      (item) =>
        item.crop.toLowerCase().includes(lowerCaseQuery) ||
        item.variety.toLowerCase().includes(lowerCaseQuery) ||
        item.lotNumber.toString().includes(lowerCaseQuery) ||
        item.location.toLowerCase().includes(lowerCaseQuery),
    )
  }, [inventoryData, searchQuery])

  // Sort data when sort config changes
  const sortedData = React.useMemo(() => {
    if (!sortConfig) return filteredData

    return [...filteredData].sort((a: any, b: any) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? -1 : 1
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? 1 : -1
      }
      return 0
    })
  }, [filteredData, sortConfig])

  // Calculate pagination
  const totalItems = sortedData.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentPageData = sortedData.slice(startIndex, endIndex)

  // Reset to first page when search or sort changes
  React.useEffect(() => {
    setCurrentPage(1)
    setSelectedRowIndex(null)
  }, [searchQuery, sortConfig])

  // Reset to first page when page size changes
  React.useEffect(() => {
    setCurrentPage(1)
    setSelectedRowIndex(null)
  }, [pageSize])

  // Handle sorting
  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"

    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }

    setSortConfig({ key, direction })
  }

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

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    })
  }

  // Determine item status
  const getItemStatus = (quantity: number, days: number) => {
    const isVeryLowStock = quantity < VERY_LOW_STOCK_THRESHOLD
    const isLowStock = quantity < LOW_STOCK_THRESHOLD
    const isAging = days > AGING_THRESHOLD
    const isCriticalAging = days > CRITICAL_AGING_THRESHOLD

    return {
      isVeryLowStock,
      isLowStock,
      isAging,
      isCriticalAging,
    }
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      const startPage = Math.max(1, currentPage - 2)
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
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1 text-center sm:text-left">
            <CardTitle>Seed Storage - Inventory</CardTitle>
            <CardDescription>Loading inventory data...</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="aspect-auto h-[400px] w-full flex items-center justify-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Seed Storage - Inventory</CardTitle>
          <CardDescription>
            Track seed storage, aging inventory, and stock levels
            {searchQuery && ` - Filtered by "${searchQuery}"`}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 w-[120px] sm:w-[180px] text-sm rounded-lg"
            />
          </div>
          <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-[70px] h-9 rounded-lg" aria-label="Items per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={size.toString()} className="rounded-lg">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div className="aspect-auto h-[400px] w-full flex flex-col">
          {/* Responsive table with horizontal scroll on mobile */}
          <div className="rounded-md border overflow-x-auto flex-1">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[120px] sm:w-[140px] min-w-[120px]">
                    <Button
                      variant="ghost"
                      onClick={() => requestSort("crop")}
                      className="flex items-center gap-1 p-0 h-auto font-medium text-xs sm:text-sm w-full justify-start"
                    >
                      Crop <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[60px] sm:w-[80px] min-w-[60px]">
                    <Button
                      variant="ghost"
                      onClick={() => requestSort("lotNumber")}
                      className="flex items-center gap-1 p-0 h-auto font-medium text-xs sm:text-sm w-full justify-start"
                    >
                      Lot <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[80px] sm:w-[100px] min-w-[80px]">
                    <Button
                      variant="ghost"
                      onClick={() => requestSort("dateStored")}
                      className="flex items-center gap-1 p-0 h-auto font-medium text-xs sm:text-sm w-full justify-start"
                    >
                      Stored <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right w-[80px] sm:w-[90px] min-w-[80px]">
                    <Button
                      variant="ghost"
                      onClick={() => requestSort("quantityLeft")}
                      className="flex items-center gap-1 p-0 h-auto font-medium ml-auto text-xs sm:text-sm"
                    >
                      Qty <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[90px] sm:w-[100px] min-w-[90px]">
                    <Button
                      variant="ghost"
                      onClick={() => requestSort("daysStored")}
                      className="flex items-center gap-1 p-0 h-auto font-medium text-xs sm:text-sm w-full justify-start"
                    >
                      Days <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPageData.map((item, index) => {
                  const status = getItemStatus(item.quantityLeft, item.daysStored)
                  const isSelected = selectedRowIndex === index

                  return (
                    <TableRow
                      key={startIndex + index}
                      className={clsx(
                        "cursor-pointer transition-all duration-200 touch-manipulation",
                        // Status-based background colors
                        status.isVeryLowStock && status.isCriticalAging && "bg-red-50 hover:bg-red-100",
                        status.isLowStock &&
                          status.isAging &&
                          !status.isVeryLowStock &&
                          "bg-orange-50 hover:bg-orange-100",
                        !status.isLowStock && status.isAging && "bg-yellow-50 hover:bg-yellow-100",
                        status.isLowStock && !status.isAging && "bg-rose-50 hover:bg-rose-100",
                        // Default hover state for items without status
                        !status.isLowStock && !status.isAging && "hover:bg-muted",
                        // Selected state for navigation highlighting
                        isSelected && "ring-2 ring-blue-500 bg-blue-50 hover:bg-blue-100",
                        // Active state for touch feedback
                        "active:bg-muted/80",
                      )}
                      onClick={() => handleRowClick(index)}
                    >
                      <TableCell className="py-2 sm:py-3">
                        <div className="font-medium text-xs sm:text-sm leading-tight">{item.crop}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[100px] sm:max-w-[120px]">
                          {item.variety}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 sm:py-3 text-xs sm:text-sm font-medium">{item.lotNumber}</TableCell>
                      <TableCell className="py-2 sm:py-3 text-xs sm:text-sm">{formatDate(item.dateStored)}</TableCell>
                      <TableCell className="text-right py-2 sm:py-3">
                        <span className={clsx("text-xs sm:text-sm font-medium", status.isLowStock && "text-rose-600")}>
                          {item.quantityLeft}g
                        </span>
                      </TableCell>
                      <TableCell className="py-2 sm:py-3">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className={clsx("text-xs sm:text-sm font-medium", status.isAging && "text-yellow-600")}>
                            {item.daysStored}d
                          </span>
                          {status.isAging && <Timer className="h-3 w-3 text-yellow-600 flex-shrink-0" />}
                          {status.isLowStock && <AlertCircle className="h-3 w-3 text-rose-500 flex-shrink-0" />}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={5} className="text-xs sm:text-sm py-2 sm:py-3">
                    <div className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-2">
                      <span>
                        Page Total:{" "}
                        <strong>
                          {currentPageData.reduce((sum, item) => sum + item.quantityLeft, 0).toLocaleString()}g
                        </strong>
                      </span>
                      <span>
                        Grand Total:{" "}
                        <strong>
                          {sortedData.reduce((sum, item) => sum + item.quantityLeft, 0).toLocaleString()}g
                        </strong>
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-row items-center justify-between gap-2 mt-3">
            {/* Page info */}
            <div className="text-xs text-muted-foreground">
              {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems}
            </div>

            {/* Pagination buttons */}
            <div className="flex items-center gap-1">
              {/* Previous button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => (
                  <React.Fragment key={index}>
                    {page === "..." ? (
                      <span className="px-1 text-xs text-muted-foreground">...</span>
                    ) : (
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page as number)}
                        className="h-7 w-7 p-0 text-xs"
                      >
                        {page}
                      </Button>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Next button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
