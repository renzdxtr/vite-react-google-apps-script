"use client"

import * as React from "react"
import { ArrowUpDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react"
import clsx from "clsx"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DROPDOWN_CHOICES } from "@/lib/constants"

interface ReleaseLogItem {
  id: string
  crop: string
  variety: string
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

// Pagination options - same as SummaryTable
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// Get current date dynamically - same as SummaryTable
const CURRENT_DATE = new Date()

export default function ReleaseLogTable({ data }: ReleaseLogTableProps) {
  // Process release log data - same pattern as SummaryTable
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

  // State - exact same as SummaryTable
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedRowIndex, setSelectedRowIndex] = React.useState<number | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [mounted, setMounted] = React.useState(false)
  const [sortConfig, setSortConfig] = React.useState<{
    key: string
    direction: "ascending" | "descending"
  } | null>(null)

  // New state for filters
  const [cropFilter, setCropFilter] = React.useState<string>("all") 
  const [inventoryTypeFilter, setInventoryTypeFilter] = React.useState<string>("all") 

  // Get unique crop values from data
  const uniqueCrops = React.useMemo(() => {
    const crops = [...new Set(releaseLogData.map(item => item.crop))].filter(Boolean)
    return crops.sort()
  }, [releaseLogData])

  // Ensure component is mounted before rendering - same as SummaryTable
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Filter data based on search query and filters - updated to include new filters
  const filteredData = React.useMemo(() => {
    let filtered = releaseLogData

    // Apply text search filter
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.crop.toLowerCase().includes(lowerCaseQuery) ||
          item.variety.toLowerCase().includes(lowerCaseQuery) ||
          item.reason.toLowerCase().includes(lowerCaseQuery) ||
          item.user.toLowerCase().includes(lowerCaseQuery) ||
          item.id.toString().includes(lowerCaseQuery),
      )
    }

    // Apply crop filter
    if (cropFilter && cropFilter !== "all") {
      filtered = filtered.filter(item => item.crop === cropFilter)
    }

    // Apply inventory type filter
    if (inventoryTypeFilter && inventoryTypeFilter !== "all") {
      filtered = filtered.filter(item => item.inventoryType === inventoryTypeFilter)
    }

    return filtered
  }, [releaseLogData, searchQuery, cropFilter, inventoryTypeFilter])

  // Sort data when sort config changes - same as SummaryTable
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

  // Calculate pagination - same as SummaryTable
  const totalItems = sortedData.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentPageData = sortedData.slice(startIndex, endIndex)

  // Reset to first page when search or sort or filters change
  React.useEffect(() => {
    setCurrentPage(1)
    setSelectedRowIndex(null)
  }, [searchQuery, sortConfig, cropFilter, inventoryTypeFilter])

  // Reset to first page when page size changes - same as SummaryTable
  React.useEffect(() => {
    setCurrentPage(1)
    setSelectedRowIndex(null)
  }, [pageSize])

  // Handle sorting - same as SummaryTable
  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"

    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }

    setSortConfig({ key, direction })
  }

  // Handle row click for navigation highlighting - same as SummaryTable
  const handleRowClick = (index: number) => {
    setSelectedRowIndex(selectedRowIndex === index ? null : index)
  }

  // Handle page change - same as SummaryTable
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    setSelectedRowIndex(null)
  }

  // Handle page size change - same as SummaryTable
  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(Number(newPageSize))
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("")
    setCropFilter("all")
    setInventoryTypeFilter("all")
  }

  // Format weight based on inventory type
  const formatWeight = (weight: number, inventoryType: string) => {
    const unit = inventoryType === "Planting Materials" ? "pc" : "g"
    return (
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }).format(weight) + unit
    )
  }

  // Generate page numbers for pagination - same as SummaryTable
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

  // Don't render table until component is mounted - same as SummaryTable
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

  // Check if any filters are active
  const hasActiveFilters = searchQuery || cropFilter !== "all" || inventoryTypeFilter !== "all"

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col space-y-3">
          <div>
            <CardTitle className="text-lg md:text-xl">Release Log</CardTitle>
            <CardDescription className="text-sm">
              Complete history of seed withdrawals and releases
              {hasActiveFilters && (
                <span>
                  {searchQuery && ` - Search: "${searchQuery}"`}
                  {cropFilter !== "all" && ` - Crop: ${cropFilter}`}
                  {inventoryTypeFilter !== "all" && ` - Inventory: ${inventoryTypeFilter}`}
                </span>
              )}
            </CardDescription>
          </div>

          {/* Search controls with new filters */}
          <div className="flex flex-col space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search releases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 text-sm"
                />
              </div>

              <div className="flex gap-3 flex-wrap">
                {/* Crop Filter */}
                <Select value={cropFilter} onValueChange={setCropFilter}>
                  <SelectTrigger className="h-10 w-32 sm:w-36">
                    <SelectValue placeholder="Crop" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Crops</SelectItem>
                    {uniqueCrops.map((crop) => (
                      <SelectItem key={crop} value={crop}>
                        {crop}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Inventory Type Filter */}
                <Select value={inventoryTypeFilter} onValueChange={setInventoryTypeFilter}>
                  <SelectTrigger className="h-10 w-32 sm:w-36">
                    <SelectValue placeholder="Inventory" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Inventory</SelectItem>
                    {DROPDOWN_CHOICES.INVENTORY.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Page Size */}
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

                {/* Clear Filters Button - only show when filters are active */}
                {hasActiveFilters && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearFilters}
                    className="h-10 px-3 flex items-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    <span>Clear</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 sm:px-6">
        <div className="space-y-4">
          {/* Table container - same as SummaryTable */}
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[140px] min-w-[140px]">
                      <Button
                        variant="ghost"
                        onClick={() => requestSort("crop")}
                        className="flex items-center gap-1 p-0 h-auto font-medium text-sm w-full justify-start hover:bg-transparent"
                      >
                        Crop <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[100px] min-w-[100px]">
                      <Button
                        variant="ghost"
                        onClick={() => requestSort("formattedDate")}
                        className="flex items-center gap-1 p-0 h-auto font-medium text-sm w-full justify-start hover:bg-transparent"
                      >
                        Date <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right w-[120px] min-w-[120px]">
                      <Button
                        variant="ghost"
                        onClick={() => requestSort("volume")}
                        className="flex items-center gap-1 p-0 h-auto font-medium ml-auto text-sm hover:bg-transparent"
                      >
                        Volume (g) <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[120px] min-w-[120px]">
                      <Button
                        variant="ghost"
                        onClick={() => requestSort("reason")}
                        className="flex items-center gap-1 p-0 h-auto font-medium text-sm w-full justify-start hover:bg-transparent"
                      >
                        Reason <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[100px] min-w-[100px]">
                      <Button
                        variant="ghost"
                        onClick={() => requestSort("inventoryType")}
                        className="flex items-center gap-1 p-0 h-auto font-medium text-sm w-full justify-start hover:bg-transparent"
                      >
                        Inventory <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[100px] min-w-[100px]">User</TableHead>
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
                            <div className="font-medium text-sm leading-tight">{item.crop}</div>
                            <div className="text-xs text-muted-foreground">{item.variety}</div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{item.formattedDate}</div>
                            <div className="text-xs text-muted-foreground">{item.daysSinceRelease} days ago</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-3">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-green-600">{formatWeight(item.volume, item.inventoryType)}</div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="text-sm">{item.reason || "Not specified"}</div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="text-sm">{item.inventoryType || "Unknown"}</div>
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

          {/* Pagination - same as SummaryTable */}
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
