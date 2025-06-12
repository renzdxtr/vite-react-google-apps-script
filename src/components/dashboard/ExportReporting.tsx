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

import StockBySeedClassPieChart from "@/components/dashboard/StockBySeedClassPieChart"
import StockByLocationBarChart from "@/components/dashboard/StockByLocationBarChart"
import WithdrawalTrendLineChart from "@/components/dashboard/WithdrawalTrendLineChart"
import WithdrawalAnalysisChart from "@/components/dashboard/WithdrawalAnalysisChart"
import WithdrawalByCropChart from "@/components/dashboard/WithdrawalByCropChart"

// Import the necessary constants at the top of the file
import {
  CROP_VOLUME_THRESHOLDS,
  DEFAULT_THRESHOLDS
} from "@/lib/constants"

interface ExportReportingProps {
  joinedData: any[]
  withdrawalData: any[]
  metrics: any
  alerts: any[]
}

// Define the dimensions for the canvas
const cardStyleDimension = { 'WIDTH': '2000px', 'HEIGHT': '500px' }
const canvasDimension = { 'WIDTH': 2000, 'HEIGHT': 500 }

export default function ExportReporting({ joinedData, withdrawalData, metrics, alerts }: ExportReportingProps) {
  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")
  const [reportType, setReportType] = React.useState("summary")
  // Update the selectedCharts state to include releaseLog
  const [selectedCharts, setSelectedCharts] = React.useState({
  stockBySeedClass: true,
  stockByLocation: true,
  withdrawalTrend: true,
  withdrawalAnalysis: true,
  withdrawalByCrop: true,
  releaseLog: false, // New option for Release Log data
  })
  
  // Update the getChartTitle function
  const getChartTitle = (chartId: string) => {
  const titles = {
  stockBySeedClass: "Stock Distribution by Seed Class",
  stockByLocation: "Stock Distribution by Location",
  withdrawalTrend: "Withdrawal Trends Over Time",
  withdrawalAnalysis: "Withdrawal Time Analysis",
  withdrawalByCrop: "Withdrawals by Crop Type",
  releaseLog: "Recent Release Log Data",
  }
  return titles[chartId as keyof typeof titles] || chartId
  }
  
  // Update the getChartDescription function
  const getChartDescription = (chartId: string, inventoryData: any[], withdrawalData: any[]) => {
  const descriptions = {
  stockBySeedClass: `This pie chart illustrates the distribution of remaining seed stock across different seed classifications (Foundation, Registered, Certified, etc.). The visualization helps identify which seed classes dominate the inventory and assists in maintaining balanced stock levels. Total items analyzed: ${inventoryData.length}`,
  stockByLocation: `This bar chart displays seed stock levels across different storage locations within the facility. It enables quick identification of storage capacity utilization and helps optimize inventory distribution. Storage locations tracked: ${availableLocations.length}`,
  withdrawalTrend: `This line chart tracks seed withdrawal patterns over time, showing monthly trends and seasonal variations. The trend analysis helps predict future seed demand and optimize ordering schedules. Total withdrawal transactions: ${withdrawalData.length}`,
  withdrawalAnalysis: `This chart analyzes withdrawal patterns by time periods (morning, afternoon, evening), revealing operational patterns and peak usage times. This information helps optimize staff scheduling and resource allocation for inventory management.`,
  withdrawalByCrop: `This horizontal bar chart shows total withdrawal volumes by crop type, highlighting which crops are in highest demand. This data supports procurement planning and helps prioritize seed varieties for future inventory expansion.`,
  releaseLog: `This table shows recent release log data, including crop, date, volume, reason, and inventory type. It provides a detailed record of all withdrawals from inventory. Total records shown: ${Math.min(withdrawalData.length, 10)}`,
  }
  return descriptions[chartId as keyof typeof descriptions] || ""
  }
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

  // Helper function to get the appropriate unit based on inventory type
  const getVolumeUnit = (inventoryType: string): string => {
    return inventoryType === "Planting Materials" ? "pc" : "g"
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
        "Original Volume",
        "Remaining Volume",
        "Total Withdrawn",
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
        `${item.VOLUME}${getVolumeUnit(item.INVENTORY)}`,
        `${item.remainingVolume}${getVolumeUnit(item.INVENTORY)}`,
        `${item.totalWithdrawn}${getVolumeUnit(item.INVENTORY)}`,
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
      const headers = ["Timestamp", "QR Code", "Amount", "Previous Value", "New Value", "Reason", "User"]

      const rows = filteredWithdrawals.map((item) => {
        // Find the inventory item to determine the unit
        const inventoryItem = joinedData.find(inv => inv.CODE === item.QR_CODE)
        const unit = inventoryItem ? getVolumeUnit(inventoryItem.INVENTORY) : "g"
        
        return [
          item.TIMESTAMP,
          item.QR_CODE,
          `${item.AMOUNT}${unit}`,
          `${item.PREVIOUS_VALUE}${unit}`,
          `${item.NEW_VALUE}${unit}`,
          item.REASON || "Not specified",
          item.USER || "Not specified",
        ]
      })

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
      doc.text(`Planting Materials Stock: ${metrics.currentStock.plantingMaterials.value}pcs`, 20, yPosition)
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

      // Charts Section - Enhanced Layout with 2 charts per page
      if (Object.values(selectedCharts).some(Boolean)) {
        // Add new page for charts section
        doc.addPage()
        yPosition = 20
      
        doc.setFontSize(18)
        doc.text("Data Visualization and Analysis", 20, yPosition)
        yPosition += 15
      
        // Get selected charts
        const selectedChartIds = Object.entries(selectedCharts)
          .filter(([_, isSelected]) => isSelected)
          .map(([chartId, _]) => chartId)
      
        // Process charts one per page for maximum visibility
        for (let i = 0; i < selectedChartIds.length; i++) {
          // Add a new page for each chart (except the first one)
          if (i > 0) {
            doc.addPage()
          }
          yPosition = 20
      
          // Calculate dimensions for full-page chart
          const pageHeight = 297 // A4 height in mm
          const availableHeight = pageHeight - 30 // Reduced top/bottom margins from 40 to 30
          const chartHeight = availableHeight - 20 // Reduced reserved space from 30 to 20
          const chartWidth = 190 // Almost full page width
      
          // Process chart
          const chartId = selectedChartIds[i]
          await renderChartToPDF(doc, chartId, 10, yPosition, chartWidth, chartHeight)
        }
      }

      // Helper function to render individual chart to PDF
      async function renderChartToPDF(
        doc: any,
        chartId: string,
        x: number,
        y: number,
        width: number,
        height: number
      ) {
        // Add chart title
        doc.setFontSize(14)
        doc.setTextColor(0, 0, 0)
        const chartTitle = getChartTitle(chartId)
        doc.text(chartTitle, x, y + 10) // Added 10mm to y position to avoid overlap

        const titleHeight = 12 // Increased from 8 to 12 to provide more space
        const chartY = y + titleHeight

        // Capture and add chart image
        const chartImage = await captureChart(chartId)
        if (chartImage) {
          // Calculate chart image dimensions (maintain aspect ratio within bounds)
          const imageHeight = height - titleHeight - 10 // Reduced from 15 to 10
          const aspectRatio = 4 / 3 // 4:3 aspect ratio

          let imgWidth = width
          let imgHeight = width / aspectRatio

          // If calculated height exceeds available space, adjust based on height
          if (imgHeight > imageHeight) {
            imgHeight = imageHeight
            imgWidth = imageHeight * aspectRatio
          }

          // Center the chart horizontally if it's smaller than available width
          const xOffset = x + (width - imgWidth) / 2

          doc.addImage(chartImage, "PNG", xOffset, chartY, imgWidth, imgHeight)

          // Add chart description below the image
          const descriptionY = chartY + imgHeight + 5 // 5mm space below the image
          doc.setFontSize(8)
          doc.setTextColor(80, 80, 80) // Gray color for description

          const description = getChartDescription(chartId, filteredData, filteredWithdrawals)
          const maxDescriptionWidth = width
          const descriptionLines = doc.splitTextToSize(description, maxDescriptionWidth)

          // Limit description to fit remaining space
          const remainingHeight = height - (descriptionY - y)
          const maxLines = Math.floor(remainingHeight / 3) // 3mm per line
          const limitedLines = descriptionLines.slice(0, maxLines)

          limitedLines.forEach((line: string, index: number) => {
            doc.text(line, x, descriptionY + (index * 3))
          })
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

        // Define column widths (total should be around 170 for A4 page)
        const columnWidths = [40, 40, 30, 25, 25, 20]

        // Table header
        let xPosition = 20
        tableHeaders.forEach((header, index) => {
          doc.text(header, xPosition, yPosition)
          xPosition += columnWidths[index]
        })
        yPosition += 7

        // Table rows
        filteredData.slice(0, 30).forEach((item) => {
          if (yPosition > 270) {
            doc.addPage()
            yPosition = 20
          }

          xPosition = 20
          const rowData = [
            item.CROP,
            item.VARIETY,
            item.LOCATION,
            `${item.remainingVolume}g`,
            `${item.totalWithdrawn}g`,
            getItemStatus(item),
          ]

          rowData.forEach((cell, index) => {
            const maxWidth = columnWidths[index] - 2
            const lines = doc.splitTextToSize(cell, maxWidth)
            const lineHeight = doc.getTextDimensions('Text').h * 1.2

            lines.forEach((line: string, lineIndex: number) => {
              doc.text(line, xPosition, yPosition + (lineIndex * lineHeight))
            })

            xPosition += columnWidths[index]
          })

          const maxLines = Math.max(...rowData.map((cell, index) => {
            return doc.splitTextToSize(cell, columnWidths[index] - 2).length
          }))

          yPosition += Math.max(5, maxLines * doc.getTextDimensions('Text').h * 1.2 + 2)
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

  // Get crop-specific thresholds
  const getCropThresholds = (cropName: string): [number, number] => {
    return CROP_VOLUME_THRESHOLDS[cropName as keyof typeof CROP_VOLUME_THRESHOLDS] || DEFAULT_THRESHOLDS
  }

  // Update the getItemStatus function
  const getItemStatus = (item: any) => {
    const cropName = item.CROP
    const [lowVolumeThreshold, veryLowVolumeThreshold] = getCropThresholds(cropName)

    if (item.remainingVolume <= veryLowVolumeThreshold) return "Critical"
    if (item.remainingVolume <= lowVolumeThreshold) return "Low"
    return "Normal"
  }

  // Capture chart as image - Enhanced for clean chart rendering
  const captureChart = async (chartId: string): Promise<string | null> => {
    try {
      const html2canvas = (await import("html2canvas")).default
      const chartElement = document.querySelector(`[data-chart-id="${chartId}-export"]`) as HTMLElement
  
      if (!chartElement) {
        console.error(`Chart element with id ${chartId}-export not found`)
        return null
      }
  
      // Wait for chart to fully render
      await new Promise(resolve => setTimeout(resolve, 1500)) // Increased wait time
  
      const canvas = await html2canvas(chartElement, {
        backgroundColor: "#ffffff",
        scale: 2, // REDUCED from 4 to 2 for more reasonable file size
        useCORS: true,
        allowTaint: true,
        width: canvasDimension.WIDTH,
        height: canvasDimension.HEIGHT,
        scrollX: 0,
        scrollY: 0,
        removeContainer: true,
        logging: false,
        onclone: (clonedDoc) => {
          // Ensure charts are visible in the cloned document
          const clonedElement = clonedDoc.querySelector(`[data-chart-id="${chartId}-export"]`) as HTMLElement
          if (clonedElement) {
            clonedElement.style.position = 'static'
            clonedElement.style.left = '0'
            clonedElement.style.top = '0'
          }
        }
      })
  
      return canvas.toDataURL("image/png", 0.8) // REDUCED quality from 1.0 to 0.8
    } catch (error) {
      console.error(`Error capturing chart ${chartId}:`, error)
      return null
    }
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
              PDF will include executive summary, selected charts with detailed descriptions, and{" "}
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

      {/* Hidden charts for PDF export - Clean rendering without card styling */}
      <div
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: cardStyleDimension.WIDTH, // Increased width for better quality
          height: cardStyleDimension.HEIGHT,  // Increased height for better quality
          pointerEvents: 'none',
          zIndex: -1,
          backgroundColor: 'white'
        }}
      >
        {/* Each chart rendered cleanly without card wrapper */}
        <div
          data-chart-id="stockBySeedClass-export"
          style={{
            width: cardStyleDimension.WIDTH, // Increased width for better quality
            height: cardStyleDimension.HEIGHT,  // Increased height for better quality
            padding: '40px',
            backgroundColor: 'white',
            border: 'none',
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <StockBySeedClassPieChart data={filteredData} />
        </div>

        <div
          data-chart-id="stockByLocation-export"
          style={{
            width: cardStyleDimension.WIDTH, // Increased width for better quality
            height: cardStyleDimension.HEIGHT,  // Increased height for better quality
            padding: '40px',
            backgroundColor: 'white',
            border: 'none',
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <StockByLocationBarChart data={filteredData} />
        </div>

        <div
          data-chart-id="withdrawalByCrop-export"
          style={{
            width: cardStyleDimension.WIDTH, // Increased width for better quality
            height: cardStyleDimension.HEIGHT,  // Increased height for better quality
            padding: '40px',
            backgroundColor: 'white',
            border: 'none',
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <WithdrawalByCropChart data={filteredData} />
        </div>

        <div
          data-chart-id="withdrawalAnalysis-export"
          style={{
            width: cardStyleDimension.WIDTH, // Increased width for better quality
            height: cardStyleDimension.HEIGHT,  // Increased height for better quality
            padding: '40px',
            backgroundColor: 'white',
            border: 'none',
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <WithdrawalAnalysisChart data={filteredWithdrawals} />
        </div>

        <div
          data-chart-id="withdrawalTrend-export"
          style={{
            width: cardStyleDimension.WIDTH, // Increased width for better quality
            height: cardStyleDimension.HEIGHT,  // Increased height for better quality
            padding: '40px',
            backgroundColor: 'white',
            border: 'none',
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <WithdrawalTrendLineChart data={filteredWithdrawals} />
        </div>
      </div>
    </div>
  )
}