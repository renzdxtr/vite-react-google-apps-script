"use client"

import * as React from "react"
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"
import clsx from "clsx"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { AlertCircle, Search, Filter } from "lucide-react"

import { 
  AGING_THRESHOLD, 
  CRITICAL_AGING_THRESHOLD, 
  EXPIRY_WARNING_THRESHOLD, 
  HIGH_WITHDRAWAL_THRESHOLD 
} from "@/lib/constants"

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

// Note: This component assumes shadcn/ui components are available
// If not available, these would need to be replaced with custom components

interface SummaryRow {
  id: number
  optionValue: string
  remainingVolume: number
  withdrawnYTD: number
  status: string
  dateCreated: string
  expiryDate: string
  lastWithdrawal: string
  riskLevel: string
  crop?: string // Add crop field for threshold lookup
}

interface SummaryTableProps {
  data: SummaryRow[]
  title?: string
}

// Global thresholds - easily configurable (keeping for non-volume related checks)
// const AGING_THRESHOLD = 30 // days since last withdrawal
// const CRITICAL_AGING_THRESHOLD = 90 // days since last withdrawal
// const EXPIRY_WARNING_THRESHOLD = 30 // days until expiry
// const HIGH_WITHDRAWAL_THRESHOLD = 100_000 // withdrawn YTD

// Pagination options
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// Get current date dynamically
const CURRENT_DATE = new Date()

export default function EnhancedSummaryTable({ data, title = "Enhanced Summary Table" }: SummaryTableProps) {
  // Process summary data and calculate days and status
  const processSummaryData = React.useCallback(() => {
    return data.map((item) => {
      const createdDate = new Date(item.dateCreated)
      const expiryDate = new Date(item.expiryDate)
      const lastWithdrawalDate = new Date(item.lastWithdrawal)

      const daysSinceCreated = Math.floor((CURRENT_DATE.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - CURRENT_DATE.getTime()) / (1000 * 60 * 60 * 24))
      const daysSinceLastWithdrawal = Math.floor(
        (CURRENT_DATE.getTime() - lastWithdrawalDate.getTime()) / (1000 * 60 * 60 * 24),
      )

      // Extract crop name from optionValue (format: "Crop - Variety")
      const cropName = item.optionValue.split(" - ")[0] || "Unknown"

      return {
        ...item,
        crop: cropName,
        daysSinceCreated,
        daysUntilExpiry,
        daysSinceLastWithdrawal,
        withdrawalRate: (item.withdrawnYTD / Math.max(daysSinceCreated, 1)) * 365, // annualized rate
      }
    })
  }, [data])

  const [summaryData, setSummaryData] = React.useState(processSummaryData())

  React.useEffect(() => {
    setSummaryData(processSummaryData())
  }, [processSummaryData])

  const [searchQuery, setSearchQuery] = React.useState("")
  const [dateFromFilter, setDateFromFilter] = React.useState("")
  const [dateToFilter, setDateToFilter] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [selectedRowIndex, setSelectedRowIndex] = React.useState<number | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [mounted, setMounted] = React.useState(false)
  const [showFilters, setShowFilters] = React.useState(false)
  const [sortConfig, setSortConfig] = React.useState<{
    key: string
    direction: "ascending" | "descending"
  } | null>(null)

  // Ensure component is mounted before rendering
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Get crop-specific thresholds
  const getCropThresholds = (cropName: string): [number, number] => {
    return CROP_VOLUME_THRESHOLDS[cropName as keyof typeof CROP_VOLUME_THRESHOLDS] || DEFAULT_THRESHOLDS
  }

  // Determine item status based on crop-specific volume thresholds
  const getItemStatus = (
    volume: number,
    daysSinceWithdrawal: number,
    daysUntilExpiry: number,
    withdrawnYTD: number,
    cropName: string,
  ) => {
    const [lowVolumeThreshold, veryLowVolumeThreshold] = getCropThresholds(cropName)

    const isVeryLowVolume = volume < veryLowVolumeThreshold
    const isLowVolume = volume < lowVolumeThreshold
    const isAging = daysSinceWithdrawal > AGING_THRESHOLD
    const isCriticalAging = daysSinceWithdrawal > CRITICAL_AGING_THRESHOLD
    const isNearExpiry = daysUntilExpiry < EXPIRY_WARNING_THRESHOLD
    const isHighWithdrawal = withdrawnYTD > HIGH_WITHDRAWAL_THRESHOLD

    const isCritical = isVeryLowVolume || isCriticalAging || (daysUntilExpiry < 7 && daysUntilExpiry > 0)
    const isWarning = isLowVolume || isAging || isNearExpiry || isHighWithdrawal

    return {
      isVeryLowVolume,
      isLowVolume,
      isAging,
      isCriticalAging,
      isNearExpiry,
      isHighWithdrawal,
      isCritical,
      isWarning,
      lowVolumeThreshold,
      veryLowVolumeThreshold,
    }
  }

  // Calculate withdrawn amount based on date range or default to YTD
  const getWithdrawnAmount = React.useCallback(
    (item: any) => {
      // If date filters are set, calculate withdrawn amount within that range
      if (dateFromFilter || dateToFilter) {
        const fromDate = dateFromFilter ? new Date(dateFromFilter) : new Date(item.dateCreated)
        const toDate = dateToFilter ? new Date(dateToFilter) : CURRENT_DATE
        const lastWithdrawalDate = new Date(item.lastWithdrawal)

        // If last withdrawal is within the date range, return the withdrawn amount
        // Otherwise return 0 (simplified logic - in real app you'd need more detailed withdrawal history)
        if (lastWithdrawalDate >= fromDate && lastWithdrawalDate <= toDate) {
          return item.withdrawnYTD
        }
        return 0
      }

      // Default to YTD withdrawn
      return item.withdrawnYTD
    },
    [dateFromFilter, dateToFilter],
  )

  // Filter data based on search query and date range
  const filteredData = React.useMemo(() => {
    let filtered = summaryData

    // Text search filter
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.optionValue.toLowerCase().includes(lowerCaseQuery) ||
          item.status.toLowerCase().includes(lowerCaseQuery) ||
          item.riskLevel.toLowerCase().includes(lowerCaseQuery) ||
          item.id.toString().includes(lowerCaseQuery) ||
          (item.crop && item.crop.toLowerCase().includes(lowerCaseQuery)),
      )
    }

    // Date range filter
    if (dateFromFilter) {
      const fromDate = new Date(dateFromFilter)
      filtered = filtered.filter((item) => new Date(item.dateCreated) >= fromDate)
    }
    if (dateToFilter) {
      const toDate = new Date(dateToFilter)
      filtered = filtered.filter((item) => new Date(item.dateCreated) <= toDate)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => {
        const status = getItemStatus(
          item.remainingVolume,
          item.daysSinceLastWithdrawal,
          item.daysUntilExpiry,
          item.withdrawnYTD,
          item.crop || "Unknown",
        )
        switch (statusFilter) {
          case "critical":
            return status.isCritical
          case "warning":
            return status.isWarning && !status.isCritical
          case "normal":
            return !status.isWarning && !status.isCritical
          default:
            return true
        }
      })
    }

    return filtered
  }, [summaryData, searchQuery, dateFromFilter, dateToFilter, statusFilter])

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
  }, [searchQuery, sortConfig, dateFromFilter, dateToFilter, statusFilter])

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

  // Format weight in grams
  const formatWeight = (weight: number) => {
    return (
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }).format(weight) + "g"
    )
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 3 // Reduced for mobile

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
          <CardTitle className="text-lg md:text-xl">{title}</CardTitle>
          <CardDescription>Loading summary data...</CardDescription>
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
            <CardTitle className="text-lg md:text-xl">{title}</CardTitle>
            <CardDescription className="text-sm">
              Monitor crop seed inventory and usage with crop-specific thresholds
              {searchQuery && ` - Filtered by "${searchQuery}"`}
              {(dateFromFilter || dateToFilter) && ` - Date filtered`}
            </CardDescription>
          </div>

          {/* Mobile-first filter controls */}
          <div className="flex flex-col space-y-3">
            {/* Primary controls row */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search crops..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 text-sm"
                />
              </div>

              {/* Filter toggle for mobile */}
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="sm:hidden h-10 px-3">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Secondary controls - always visible on desktop, toggleable on mobile */}
            <div
              className={clsx(
                "flex flex-col sm:flex-row gap-3 transition-all duration-200",
                showFilters ? "block" : "hidden sm:flex",
              )}
            >
              {/* Date filters */}
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  placeholder="From date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                  className="h-10 text-sm w-full sm:w-40"
                />
                <span className="text-muted-foreground text-sm">-</span>
                <Input
                  type="date"
                  placeholder="To date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                  className="h-10 text-sm w-full sm:w-40"
                />
              </div>

              {/* Status and page size */}
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 w-full sm:w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                  </SelectContent>
                </Select>

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

              {/* Clear filters button */}
              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("")
                    setDateFromFilter("")
                    setDateToFilter("")
                    setStatusFilter("all")
                  }}
                  className="h-9 text-sm w-full sm:w-auto"
                  disabled={!searchQuery && !dateFromFilter && !dateToFilter && statusFilter === "all"}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 sm:px-6">
        <div className="space-y-4">
          {/* Table container with responsive design */}
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[140px] min-w-[140px]">
                      <Button
                        variant="ghost"
                        onClick={() => requestSort("optionValue")}
                        className="flex items-center gap-1 p-0 h-auto font-medium text-sm w-full justify-start hover:bg-transparent"
                      >
                        Crop <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right w-[120px] min-w-[120px]">
                      <Button
                        variant="ghost"
                        onClick={() => requestSort("remainingVolume")}
                        className="flex items-center gap-1 p-0 h-auto font-medium ml-auto text-sm hover:bg-transparent"
                      >
                        Remaining (g) <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right w-[120px] min-w-[120px]">
                      <Button
                        variant="ghost"
                        onClick={() => requestSort("withdrawnYTD")}
                        className="flex items-center gap-1 p-0 h-auto font-medium ml-auto text-sm hover:bg-transparent"
                      >
                        Withdrawn (g) <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[110px] min-w-[110px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentPageData.map((item, index) => {
                    const status = getItemStatus(
                      item.remainingVolume,
                      item.daysSinceLastWithdrawal,
                      item.daysUntilExpiry,
                      item.withdrawnYTD,
                      item.crop || "Unknown",
                    )
                    const isSelected = selectedRowIndex === index
                    const withdrawnAmount = getWithdrawnAmount(item)

                    return (
                      <TableRow
                        key={startIndex + index}
                        className={clsx(
                          "cursor-pointer transition-all duration-200",
                          // Status-based background colors
                          status.isCritical && "bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500",
                          status.isWarning &&
                            !status.isCritical &&
                            "bg-yellow-50 hover:bg-yellow-100 border-l-4 border-l-yellow-500",
                          // Default hover state for normal items
                          !status.isWarning && !status.isCritical && "hover:bg-muted border-l-4 border-l-transparent",
                          // Selected state for navigation highlighting
                          isSelected && "ring-1 ring-blue-500 bg-blue-50 hover:bg-blue-100",
                        )}
                        onClick={() => handleRowClick(index)}
                      >
                        <TableCell className="py-3">
                          <div className="space-y-1">
                            <div className="font-medium text-sm leading-tight">{item.optionValue}</div>
                            <div className="text-xs text-muted-foreground">
                              Seed Class: {item.riskLevel} Thresholds: {status.veryLowVolumeThreshold}g /{" "}
                              {status.lowVolumeThreshold}g
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-3">
                          <div className="space-y-1">
                            <div
                              className={clsx(
                                "text-sm font-medium",
                                status.isVeryLowVolume && "text-red-600",
                                status.isLowVolume && !status.isVeryLowVolume && "text-orange-600",
                              )}
                            >
                              {formatWeight(item.remainingVolume)}
                            </div>
                            {status.isLowVolume && (
                              <div className="text-xs text-muted-foreground">
                                {status.isVeryLowVolume ? "Very low" : "Low volume"}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-3">
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{formatWeight(withdrawnAmount)}</div>
                            <div className="text-xs text-muted-foreground">
                              {dateFromFilter || dateToFilter ? "Period" : "YTD"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={clsx(
                                "px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap",
                                status.isCritical
                                  ? "bg-red-100 text-red-800"
                                  : status.isWarning
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800",
                              )}
                            >
                              {status.isCritical ? "Critical" : status.isWarning ? "Warning" : "Normal"}
                            </span>
                            {status.isCritical && <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Enhanced Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            {/* Results info */}
            <div className="text-xs text-muted-foreground order-2 sm:order-1">
              Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} results
            </div>

            {/* Pagination controls */}
            <div className="flex items-center gap-2 order-1 sm:order-2">
              {/* Previous button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Page numbers */}
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

              {/* Next button */}
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
