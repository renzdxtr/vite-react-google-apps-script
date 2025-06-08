"use client"

import * as React from "react"
import { Download, FileText, Calendar, Filter, ImageIcon, Table } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface ExportReportingProps {
  joinedData: any[]
  withdrawalData: any[]
  metrics: any
  alerts: any[]
}

export default function ExportReporting({ joinedData, withdrawalData, metrics, alerts }: ExportReportingProps) {
  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")
  const [reportType, setReportType] = React.useState("summary")
  const [selectedCharts, setSelectedCharts] = React.useState({
    stockBySeedClass: true,
    stockByLocation: true,
    withdrawalTrend: true,
    withdrawalAnalysis: true,
    withdrawalByCrop: true,
  })
  const [inventoryFilter, setInventoryFilter] = React.useState("all")
  const [locationFilter, setLocationFilter] = React.useState("all")
  const [isExporting, setIsExporting] = React.useState(false)

  // Get unique locations for filtering
  const availableLocations = React.useMemo(() => {
    return [...new Set(joinedData.map((item) => item.LOCATION))]
  }, [joinedData])

  // Filter data based on user selections
  const filteredData = React.useMemo(() => {
    let filtered = joinedData

    // Filter by inventory type
    if (inventoryFilter !== "all") {
      filtered = filtered.filter((item) => item.INVENTORY === inventoryFilter)
    }

    // Filter by location
    if (locationFilter !== "all") {
      filtered = filtered.filter((item) => item.LOCATION === locationFilter)
    }

    // Filter by date range (using stored date)
    if (dateFrom) {
      const fromDate = new Date(dateFrom)
      filtered = filtered.filter((item) => new Date(item.STORED_DATE) >= fromDate)
    }

    if (dateTo) {
      const toDate = new Date(dateTo)
      filtered = filtered.filter((item) => new Date(item.STORED_DATE) <= toDate)
    }

    return filtered
  }, [joinedData, inventoryFilter, locationFilter, dateFrom, dateTo])

  // Filter withdrawal data based on date range
  const filteredWithdrawals = React.useMemo(() => {
    let filtered = withdrawalData

    if (dateFrom) {
      const fromDate = new Date(dateFrom)
      filtered = filtered.filter((item) => new Date(item.TIMESTAMP) >= fromDate)
    }

    if (dateTo) {
      const toDate = new Date(dateTo)
      filtered = filtered.filter((item) => new Date(item.TIMESTAMP) <= toDate)
    }

    return filtered
  }, [withdrawalData, dateFrom, dateTo])

  // Handle chart selection
  const handleChartSelection = (chartId: string, checked: boolean) => {
    setSelectedCharts((prev) => ({
      ...prev,
      [chartId]: checked,
    }))
  }

  // Generate CSV data
  const generateCSVData = (data: any[], type: "inventory" | "withdrawals") => {
    if (type === "inventory") {
      const headers = [
        "Code",
        "Crop",
        "Variety",
        "Seed Class",
        "Location",
        "Inventory Type",
        "Original Volume (g)",
        "Remaining Volume (g)",
        "Total Withdrawn (g)",
        "Stored Date",
        "Harvest Date",
        "Last Modified",
        "Moisture Content",
        "Germination Rate",
        "Program",
        "Last Withdrawal",
      ]

      const rows = data.map((item) => [
        item.CODE,
        item.CROP,
        item.VARIETY,
        item.SEED_CLASS,
        item.LOCATION,
        item.INVENTORY,
        item.VOLUME,
        item.remainingVolume,
        item.totalWithdrawn,
        item.STORED_DATE,
        item.HARVEST_DATE,
        item.LAST_MODIFIED,
        item.MOISTURE_CONTENT,
        item.GERMINATION_RATE,
        item.PROGRAM,
        item.lastWithdrawal?.TIMESTAMP || "No withdrawals",
      ])

      return [headers, ...rows]
    } else {
      const headers = ["Timestamp", "QR Code", "Amount (g)", "Previous Value", "New Value", "Reason", "User"]

      const rows = filteredWithdrawals.map((item) => [
        item.TIMESTAMP,
        item.QR_CODE,
        item.AMOUNT,
        item.PREVIOUS_VALUE,
        item.NEW_VALUE,
        item.REASON || "Not specified",
        item.USER || "Not specified",
      ])

      return [headers, ...rows]
    }
  }

  // Export CSV
  const exportCSV = (type: "inventory" | "withdrawals") => {
    const data = type === "inventory" ? filteredData : filteredWithdrawals
    const csvData = generateCSVData(data, type)

    const csvContent = csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", `${type}_data_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Capture chart as image
  const captureChart = async (chartId: string): Promise<string | null> => {
    try {
      const html2canvas = (await import("html2canvas")).default
      const chartElement = document.querySelector(`[data-chart-id="${chartId}"]`) as HTMLElement

      if (!chartElement) {
        console.warn(`Chart element with id ${chartId} not found`)
        return null
      }

      const canvas = await html2canvas(chartElement, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      })

      return canvas.toDataURL("image/png")
    } catch (error) {
      console.error(`Error capturing chart ${chartId}:`, error)
      return null
    }
  }

  // Generate PDF Report
  const generatePDFReport = async () => {
    setIsExporting(true)

    try {
      const jsPDF = (await import("jspdf")).default

      const doc = new jsPDF()
      let yPosition = 20

      // Title
      doc.setFontSize(20)
      doc.text("Seed Inventory Report", 20, yPosition)
      yPosition += 15

      // Report metadata
      doc.setFontSize(10)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition)
      yPosition += 5
      if (dateFrom || dateTo) {
        doc.text(`Date Range: ${dateFrom || "Start"} to ${dateTo || "End"}`, 20, yPosition)
        yPosition += 5
      }
      if (inventoryFilter !== "all") {
        doc.text(`Inventory Filter: ${inventoryFilter}`, 20, yPosition)
        yPosition += 5
      }
      if (locationFilter !== "all") {
        doc.text(`Location Filter: ${locationFilter}`, 20, yPosition)
        yPosition += 5
      }
      yPosition += 10

      // Executive Summary
      doc.setFontSize(16)
      doc.text("Executive Summary", 20, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.text(`Total Inventory Items: ${filteredData.length}`, 20, yPosition)
      yPosition += 5
      doc.text(`Seed Storage Stock: ${metrics.currentStock.seedStorage.value}g`, 20, yPosition)
      yPosition += 5
      doc.text(`Planting Materials Stock: ${metrics.currentStock.plantingMaterials.value}g`, 20, yPosition)
      yPosition += 5
      doc.text(
        `Low Stock Alerts: ${metrics.lowStockAlerts.seedStorage.value + metrics.lowStockAlerts.plantingMaterials.value}`,
        20,
        yPosition,
      )
      yPosition += 15

      // Alerts Section
      if (alerts.length > 0) {
        doc.setFontSize(16)
        doc.text("System Alerts", 20, yPosition)
        yPosition += 10

        doc.setFontSize(10)
        alerts.slice(0, 5).forEach((alert) => {
          const lines = doc.splitTextToSize(alert.message, 170)
          doc.text(lines, 20, yPosition)
          yPosition += lines.length * 5 + 2
        })
        yPosition += 10
      }

      // Charts Section
      if (Object.values(selectedCharts).some(Boolean)) {
        doc.setFontSize(16)
        doc.text("Charts and Analysis", 20, yPosition)
        yPosition += 10

        // Capture and add selected charts
        for (const [chartId, isSelected] of Object.entries(selectedCharts)) {
          if (isSelected) {
            const chartImage = await captureChart(chartId)
            if (chartImage) {
              // Add new page if needed
              if (yPosition > 200) {
                doc.addPage()
                yPosition = 20
              }

              doc.setFontSize(12)
              doc.text(getChartTitle(chartId), 20, yPosition)
              yPosition += 10

              // Add chart image
              doc.addImage(chartImage, "PNG", 20, yPosition, 170, 100)
              yPosition += 110

              // Add chart description
              doc.setFontSize(10)
              const description = getChartDescription(chartId, filteredData, filteredWithdrawals)
              const descLines = doc.splitTextToSize(description, 170)
              doc.text(descLines, 20, yPosition)
              yPosition += descLines.length * 5 + 15
            }
          }
        }
      }

      // Detailed Tables (if detailed report)
      if (reportType === "detailed") {
        doc.addPage()
        yPosition = 20

        doc.setFontSize(16)
        doc.text("Detailed Inventory Data", 20, yPosition)
        yPosition += 15

        // Add inventory table (simplified)
        doc.setFontSize(8)
        const tableHeaders = ["Crop", "Variety", "Location", "Remaining (g)", "Withdrawn (g)", "Status"]

        // Table header
        let xPosition = 20
        tableHeaders.forEach((header, index) => {
          doc.text(header, xPosition, yPosition)
          xPosition += 30
        })
        yPosition += 7

        // Table rows
        filteredData.slice(0, 30).forEach((item) => {
          // Limit to 30 items for PDF
          if (yPosition > 270) {
            doc.addPage()
            yPosition = 20
          }

          xPosition = 20
          const rowData = [
            item.CROP.substring(0, 10),
            item.VARIETY.substring(0, 12),
            item.LOCATION.substring(0, 8),
            `${item.remainingVolume}g`,
            `${item.totalWithdrawn}g`,
            getItemStatus(item),
          ]

          rowData.forEach((cell) => {
            doc.text(cell, xPosition, yPosition)
            xPosition += 30
          })
          yPosition += 5
        })
      }

      // Save PDF
      const fileName = `inventory_report_${reportType}_${new Date().toISOString().split("T")[0]}.pdf`
      doc.save(fileName)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Error generating PDF report. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  // Helper functions
  const getChartTitle = (chartId: string) => {
    const titles = {
      stockBySeedClass: "Stock Distribution by Seed Class",
      stockByLocation: "Stock Distribution by Location",
      withdrawalTrend: "Withdrawal Trends Over Time",
      withdrawalAnalysis: "Withdrawal Time Analysis",
      withdrawalByCrop: "Withdrawals by Crop Type",
    }
    return titles[chartId as keyof typeof titles] || chartId
  }

  const getChartDescription = (chartId: string, inventoryData: any[], withdrawalData: any[]) => {
    const descriptions = {
      stockBySeedClass: `This chart shows the distribution of remaining seed stock across different seed classifications. Total items: ${inventoryData.length}`,
      stockByLocation: `This chart displays seed stock levels across different storage locations. Locations tracked: ${availableLocations.length}`,
      withdrawalTrend: `This chart tracks withdrawal patterns over time, showing monthly trends. Total withdrawals tracked: ${withdrawalData.length}`,
      withdrawalAnalysis: `This chart analyzes withdrawal patterns by time of day (morning, afternoon, evening) to identify usage patterns.`,
      withdrawalByCrop: `This chart shows total withdrawals by crop type, helping identify which crops are in highest demand.`,
    }
    return descriptions[chartId as keyof typeof descriptions] || ""
  }

  const getItemStatus = (item: any) => {
    if (item.remainingVolume <= 500) return "Critical"
    if (item.remainingVolume <= 1000) return "Low"
    return "Normal"
  }

  return (
    <div className="space-y-6">
      {/* Export Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Configuration
          </CardTitle>
          <CardDescription>Configure your export settings and filters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">
                  From Date
                </Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dateTo" className="text-xs text-muted-foreground">
                  To Date
                </Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Filters */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Data Filters
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="inventoryFilter" className="text-xs text-muted-foreground">
                  Inventory Type
                </Label>
                <Select value={inventoryFilter} onValueChange={setInventoryFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Seed Storage">Seed Storage</SelectItem>
                    <SelectItem value="Planting Materials">Planting Materials</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="locationFilter" className="text-xs text-muted-foreground">
                  Location
                </Label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {availableLocations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Report Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary Report</SelectItem>
                <SelectItem value="detailed">Detailed Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Chart Selection for PDF */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Charts to Include (PDF Only)
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(selectedCharts).map(([chartId, isSelected]) => (
                <div key={chartId} className="flex items-center space-x-2">
                  <Checkbox
                    id={chartId}
                    checked={isSelected}
                    onCheckedChange={(checked) => handleChartSelection(chartId, checked as boolean)}
                  />
                  <Label htmlFor={chartId} className="text-sm">
                    {getChartTitle(chartId)}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Actions
          </CardTitle>
          <CardDescription>
            Export your data in different formats. Filtered data: {filteredData.length} inventory items,{" "}
            {filteredWithdrawals.length} withdrawal records.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* CSV Exports */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Table className="h-4 w-4" />
              CSV Data Export
            </Label>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => exportCSV("inventory")} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Inventory CSV
                <Badge variant="secondary">{filteredData.length} items</Badge>
              </Button>
              <Button onClick={() => exportCSV("withdrawals")} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Withdrawals CSV
                <Badge variant="secondary">{filteredWithdrawals.length} records</Badge>
              </Button>
            </div>
          </div>

          <Separator />

          {/* PDF Export */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              PDF Report Export
            </Label>
            <Button onClick={generatePDFReport} disabled={isExporting} className="flex items-center gap-2" size="lg">
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating Report...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Generate PDF Report
                  <Badge variant="secondary">{reportType}</Badge>
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              PDF will include executive summary, selected charts, and{" "}
              {reportType === "detailed" ? "detailed data tables" : "key metrics only"}.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Export Preview</CardTitle>
          <CardDescription>Preview of data that will be exported with current filters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-green-600">{filteredData.length}</p>
              <p className="text-xs text-muted-foreground">Inventory Items</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-blue-600">{filteredWithdrawals.length}</p>
              <p className="text-xs text-muted-foreground">Withdrawal Records</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-orange-600">
                {Object.values(selectedCharts).filter(Boolean).length}
              </p>
              <p className="text-xs text-muted-foreground">Charts Selected</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-purple-600">{alerts.length}</p>
              <p className="text-xs text-muted-foreground">Active Alerts</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
