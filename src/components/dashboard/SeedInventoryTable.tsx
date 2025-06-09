"use client"

import * as React from "react"
import { AlertCircle, ArrowUpDown, Timer, Search, ChevronLeft, ChevronRight } from "lucide-react"
import clsx from "clsx"

import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { AGING_THRESHOLD, CRITICAL_AGING_THRESHOLD } from "@/lib/constants"

interface SeedStorageTableProps {
  data: any[]
}

// Commercial‐scale crop volume thresholds: [low_volume_threshold, very_low_volume_threshold] in grams
const CROP_VOLUME_THRESHOLDS = {
  Tomato: [40.0, 20.0],
  Eggplant: [60.0, 30.0],
  "Hot Pepper": [20.0, 10.0],
  Corn: [60.0, 30.0],
  Peanut: [80.0, 40.0],
  "Bottle Gourd": [200.0, 100.0],
  "Sponge Gourd": [200.0, 100.0],
  Okra: [70.0, 35.0],
  Cowpea: [100.0, 50.0],
  Mungbean: [70.0, 35.0],
  Soybean: [70.0, 35.0],
  "Bush Sitao": [100.0, 50.0],
  "Pole Sitao": [100.0, 50.0],
  "Winged Bean": [100.0, 50.0],
} as const

// Default thresholds for crops not in the list
const DEFAULT_THRESHOLDS = [100.0, 50.0] // [low_volume_threshold, very_low_volume_threshold]

// Global thresholds for aging - easily configurable
// const AGING_THRESHOLD = 365 // days
// const CRITICAL_AGING_THRESHOLD = 1095 // days

// Pagination options
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// Get current date dynamically
const CURRENT_DATE = new Date()

export default function SeedInventoryTable({ data }: SeedStorageTableProps) {
  // Get crop-specific thresholds
  const getCropThresholds = (cropName: string): [number, number] => {
    return CROP_VOLUME_THRESHOLDS[cropName as keyof typeof CROP_VOLUME_THRESHOLDS] || DEFAULT_THRESHOLDS
  }

  // Process inventory data and calculate days stored
  const processInventoryData = React.useCallback(() => {
    return data.map((item) => {
      const storedDate = new Date(item.STORED_DATE)
      const daysDiff = Math.floor((CURRENT_DATE.getTime() - storedDate.getTime()) / (1000 * 60 * 60 * 24))
      return {
        crop: item.CROP,
        variety: item.VARIETY,
        lotNumber: item.LOT_NUMBER,
        dateStored: item.STORED_DATE,
        quantityLeft: item.remainingVolume || item.VOLUME, // Use remaining volume if available
        daysStored: daysDiff,
        location: item.LOCATION,
        seedClass: item.SEED_CLASS,
        germinationRate: item.GERMINATION_RATE,
        originalVolume: item.VOLUME,
        totalWithdrawn: item.totalWithdrawn || 0,
      }
    })
  }, [data])

  const [inventoryData, setInventoryData] = React.useState(processInventoryData())

  React.useEffect(() => {
    setInventoryData(processInventoryData())
  }, [processInventoryData])

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
        item.location.toLowerCase().includes(lowerCaseQuery) ||
        item.seedClass.toLowerCase().includes(lowerCaseQuery),
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

  // Determine item status using crop-specific thresholds
  const getItemStatus = (quantity: number, days: number, cropName: string) => {
    const [lowVolumeThreshold, veryLowVolumeThreshold] = getCropThresholds(cropName)

    const isVeryLowStock = quantity < veryLowVolumeThreshold
    const isLowStock = quantity < lowVolumeThreshold
    const isAging = days > AGING_THRESHOLD
    const isCriticalAging = days > CRITICAL_AGING_THRESHOLD

    return {
      isVeryLowStock,
      isLowStock,
      isAging,
      isCriticalAging,
      lowVolumeThreshold,
      veryLowVolumeThreshold,
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

  // Calculate summary statistics
  const summaryStats = React.useMemo(() => {
    const totalQuantity = sortedData.reduce((sum, item) => sum + item.quantityLeft, 0)
    const totalOriginal = sortedData.reduce((sum, item) => sum + item.originalVolume, 0)
    const totalWithdrawn = sortedData.reduce((sum, item) => sum + item.totalWithdrawn, 0)

    const lowStockItems = sortedData.filter((item) => {
      const [lowVolumeThreshold] = getCropThresholds(item.crop)
      return item.quantityLeft < lowVolumeThreshold
    }).length

    const criticalStockItems = sortedData.filter((item) => {
      const [, veryLowVolumeThreshold] = getCropThresholds(item.crop)
      return item.quantityLeft < veryLowVolumeThreshold
    }).length

    const agingItems = sortedData.filter((item) => item.daysStored > AGING_THRESHOLD).length

    return {
      totalQuantity,
      totalOriginal,
      totalWithdrawn,
      lowStockItems,
      criticalStockItems,
      agingItems,
      totalItems: sortedData.length,
    }
  }, [sortedData])

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
    <div className="space-y-4">
      {/* Summary Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{summaryStats.totalQuantity.toLocaleString()}g</p>
              <p className="text-xs text-muted-foreground">Total Remaining</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{summaryStats.totalItems}</p>
              <p className="text-xs text-muted-foreground">Total Items</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{summaryStats.lowStockItems}</p>
              <p className="text-xs text-muted-foreground">Low Stock</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{summaryStats.criticalStockItems}</p>
              <p className="text-xs text-muted-foreground">Critical Stock</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Inventory Table */}
      <Card className="w-full">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1 text-center sm:text-left">
            <CardTitle>Seed Storage - Inventory</CardTitle>
            <CardDescription>
              Track seed storage with crop-specific thresholds, aging inventory, and stock levels
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
                    const status = getItemStatus(item.quantityLeft, item.daysStored, item.crop)
                    const isSelected = selectedRowIndex === index

                    return (
                      <TableRow
                        key={startIndex + index}
                        className={clsx(
                          "cursor-pointer transition-all duration-200 touch-manipulation",
                          // Status-based background colors using crop-specific thresholds
                          status.isVeryLowStock && status.isCriticalAging && "bg-red-50 hover:bg-red-100",
                          status.isLowStock &&
                            status.isAging &&
                            !status.isVeryLowStock &&
                            "bg-orange-50 hover:bg-orange-100",
                          !status.isLowStock && status.isAging && "bg-yellow-50 hover:bg-yellow-100",
                          status.isLowStock && !status.isAging && "bg-rose-50 hover:bg-rose-100",
                          status.isVeryLowStock && !status.isAging && "bg-red-50 hover:bg-red-100",
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
                          <div className="text-[9px] sm:text-[10px] text-muted-foreground">
                            Thresholds: {status.veryLowVolumeThreshold}g / {status.lowVolumeThreshold}g
                          </div>
                        </TableCell>
                        <TableCell className="py-2 sm:py-3 text-xs sm:text-sm font-medium">{item.lotNumber}</TableCell>
                        <TableCell className="py-2 sm:py-3 text-xs sm:text-sm">{formatDate(item.dateStored)}</TableCell>
                        <TableCell className="text-right py-2 sm:py-3">
                          <span
                            className={clsx(
                              "text-xs sm:text-sm font-medium",
                              status.isVeryLowStock && "text-red-600",
                              status.isLowStock && !status.isVeryLowStock && "text-orange-600",
                            )}
                          >
                            {item.quantityLeft}g
                          </span>
                          {item.totalWithdrawn > 0 && (
                            <div className="text-[10px] text-muted-foreground">-{item.totalWithdrawn}g withdrawn</div>
                          )}
                        </TableCell>
                        <TableCell className="py-2 sm:py-3">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <span
                              className={clsx(
                                "text-xs sm:text-sm font-medium",
                                status.isCriticalAging && "text-red-600",
                                status.isAging && !status.isCriticalAging && "text-yellow-600",
                              )}
                            >
                              {item.daysStored}d
                            </span>
                            {status.isCriticalAging && <Timer className="h-3 w-3 text-red-600 flex-shrink-0" />}
                            {status.isAging && !status.isCriticalAging && (
                              <Timer className="h-3 w-3 text-yellow-600 flex-shrink-0" />
                            )}
                            {status.isVeryLowStock && <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />}
                            {status.isLowStock && !status.isVeryLowStock && (
                              <AlertCircle className="h-3 w-3 text-orange-500 flex-shrink-0" />
                            )}
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
                          Grand Total: <strong>{summaryStats.totalQuantity.toLocaleString()}g</strong>
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
    </div>
  )
}
