"use client"

import * as React from "react"
import { ArrowUpDown, ChevronLeft, ChevronRight, Download, Search, X } from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Generic column definition
export interface ColumnDef<T> {
  id: string
  header: string
  accessorFn: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
  cellClassName?: string | ((row: T) => string)
}

// Generic data table props
export interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  title?: string
  description?: string
  searchPlaceholder?: string
  searchFields?: string[]
  initialPageSize?: number
  pageSizeOptions?: number[]
  onExport?: () => void
  exportLabel?: string
  filterComponent?: React.ReactNode
  summaryComponent?: React.ReactNode
  emptyStateMessage?: string
}

// Generic data table component
export default function DataTable<T extends { id: string | number }>({
  data,
  columns,
  title = "Data Table",
  description,
  searchPlaceholder = "Search...",
  searchFields = [],
  initialPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  onExport,
  exportLabel = "Export CSV",
  filterComponent,
  summaryComponent,
  emptyStateMessage = "No data found",
}: DataTableProps<T>) {
  // State
  const [searchQuery, setSearchQuery] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(initialPageSize)
  const [sortConfig, setSortConfig] = React.useState<{
    key: string
    direction: "ascending" | "descending"
  } | null>(null)
  const [mounted, setMounted] = React.useState(false)

  // Ensure component is mounted before rendering
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Filter data based on search query
  const filteredData = React.useMemo(() => {
    if (!searchQuery || searchFields.length === 0) return data

    const lowerCaseQuery = searchQuery.toLowerCase()
    return data.filter((item) => {
      return searchFields.some((field) => {
        const value = (item as any)[field]
        if (value === null || value === undefined) return false
        return String(value).toLowerCase().includes(lowerCaseQuery)
      })
    })
  }, [data, searchQuery, searchFields])

  // Sort data when sort config changes
  const sortedData = React.useMemo(() => {
    if (!sortConfig) return filteredData

    return [...filteredData].sort((a: any, b: any) => {
      const aValue = sortConfig.key.split(".").reduce((obj, key) => obj && obj[key], a)
      const bValue = sortConfig.key.split(".").reduce((obj, key) => obj && obj[key], b)

      if (aValue < bValue) {
        return sortConfig.direction === "ascending" ? -1 : 1
      }
      if (aValue > bValue) {
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
  }, [searchQuery, sortConfig])

  // Reset to first page when page size changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [pageSize])

  // Handle sorting
  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"

    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }

    setSortConfig({ key, direction })
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle page size change
  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(Number(newPageSize))
  }

  // Clear search
  const clearSearch = () => {
    setSearchQuery("")
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
          {description && <CardDescription>{description}</CardDescription>}
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-lg md:text-xl">{title}</CardTitle>
              {description && <CardDescription className="text-sm">{description}</CardDescription>}
            </div>
            {onExport && (
              <Button onClick={onExport} variant="outline" size="sm" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                {exportLabel}
              </Button>
            )}
          </div>

          {/* Filter controls */}
          <div className="flex flex-col space-y-3">
            {/* Search - only show if searchFields has items */}
            {searchFields.length > 0 && (
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 text-sm pr-10"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {/* Custom filter component */}
            {filterComponent}

            {/* Summary component */}
            {summaryComponent}
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
                    {columns.map((column) => (
                      <TableHead key={column.id} className={column.className}>
                        {column.sortable ? (
                          <Button
                            variant="ghost"
                            onClick={() => requestSort(column.id)}
                            className="flex items-center gap-1 p-0 h-auto font-medium text-sm hover:bg-transparent"
                          >
                            {column.header} <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        ) : (
                          column.header
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentPageData.length > 0 ? (
                    currentPageData.map((row) => (
                      <TableRow key={row.id}>
                        {columns.map((column) => (
                          <TableCell
                            key={`${row.id}-${column.id}`}
                            className={
                              typeof column.cellClassName === "function"
                                ? column.cellClassName(row)
                                : column.cellClassName
                            }
                          >
                            {column.accessorFn(row)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        {emptyStateMessage}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              {/* Results info */}
              <div className="text-xs text-muted-foreground order-2 sm:order-1">
                Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} results
              </div>

              {/* Pagination controls */}
              <div className="flex items-center gap-2 order-1 sm:order-2">
                {/* Page size */}
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

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
          )}
        </div>
      </CardContent>
    </Card>
  )
}
