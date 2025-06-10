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
              // Add new page for each chart to ensure proper spacing
              if (yPosition > 50) {
                doc.addPage()
                yPosition = 20
              }

              // Add chart image - larger size to capture full card
              // Calculate dimensions to fit on page while maintaining aspect ratio
              const maxWidth = 170
              const maxHeight = 120
              const aspectRatio = 800 / 600 // width / height of our chart cards

              let imgWidth = maxWidth
              let imgHeight = maxWidth / aspectRatio

              if (imgHeight > maxHeight) {
                imgHeight = maxHeight
                imgWidth = maxHeight * aspectRatio
              }

              doc.addImage(chartImage, "PNG", 20, yPosition, imgWidth, imgHeight)
              yPosition += imgHeight + 15
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

        // In the exportPDF function, replace the table generation code with this:

        // Define column widths (total should be around 170 for A4 page)
        const columnWidths = [40, 40, 30, 25, 25, 20] // Wider columns for text fields

        // Table header
        let xPosition = 20
        tableHeaders.forEach((header, index) => {
          doc.text(header, xPosition, yPosition)
          xPosition += columnWidths[index]
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
            item.CROP,
            item.VARIETY,
            item.LOCATION,
            `${item.remainingVolume}g`,
            `${item.totalWithdrawn}g`,
            getItemStatus(item),
          ]

          // Apply text wrapping for each cell
          rowData.forEach((cell, index) => {
            // Split text to fit column width (subtract 2 for margin)
            const maxWidth = columnWidths[index] - 2
            const lines = doc.splitTextToSize(cell, maxWidth)

            // Calculate line height based on font size
            const lineHeight = doc.getTextDimensions('Text').h * 1.2

            // Draw each line of text
            lines.forEach((line: string, lineIndex: number) => {
              doc.text(line, xPosition, yPosition + (lineIndex * lineHeight))
            })

            // Move to next column
            xPosition += columnWidths[index]
          })

          // Calculate the maximum number of lines in this row to determine row height
          const maxLines = Math.max(...rowData.map((cell, index) => {
            return doc.splitTextToSize(cell, columnWidths[index] - 2).length
          }))

          // Move to next row (adjust based on number of lines)
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

  const HiddenChartRenderers = () => {
    // Only render these when exporting to avoid unnecessary rendering
    if (!isExporting) return null;

    return (
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', visibility: 'hidden' }}>
        <div data-chart-id="stockBySeedClass" className="min-w-0" style={{ width: '600px', height: '400px' }}>
          <StockBySeedClassPieChart data={filteredData} />
        </div>
        <div data-chart-id="stockByLocation" className="min-w-0" style={{ width: '600px', height: '400px' }}>
          <StockByLocationBarChart data={filteredData} />
        </div>
        <div data-chart-id="withdrawalTrend" className="min-w-0" style={{ width: '600px', height: '400px' }}>
          <WithdrawalTrendLineChart data={filteredWithdrawals} />
        </div>
        <div data-chart-id="withdrawalAnalysis" className="min-w-0" style={{ width: '600px', height: '400px' }}>
          <WithdrawalAnalysisChart data={filteredWithdrawals} />
        </div>
        <div data-chart-id="withdrawalByCrop" className="min-w-0" style={{ width: '600px', height: '400px' }}>
          <WithdrawalByCropChart data={filteredData} />
        </div>
      </div>
    );
  };

  // Capture chart as image
  // const captureChart = async (chartId: string): Promise<string | null> => {
  //   try {
  //     const html2canvas = (await import("html2canvas")).default
  //     let chartElement = document.querySelector(`[data-chart-id="${chartId}-export"]`) as HTMLElement

  //     if (!chartElement) {
  //       console.error(`Chart element with id ${chartId}-export not found`)
  //       return null
  //     }

  //     const canvas = await html2canvas(chartElement, {
  //       backgroundColor: "#ffffff",
  //       scale: 2,
  //       useCORS: true,
  //     })

  //     return canvas.toDataURL("image/png")
  //   } catch (error) {
  //     console.error(`Error capturing chart ${chartId}:`, error)
  //     return null
  //   }
  // }

  // Capture chart as image
  const captureChart = async (chartId: string): Promise<string | null> => {
    try {
      const html2canvas = (await import("html2canvas")).default
      const chartElement = document.querySelector(`[data-chart-id="${chartId}-export"]`) as HTMLElement

      if (!chartElement) {
        console.error(`Chart element with id ${chartId}-export not found`)
        return null
      }

      // Wait a moment to ensure chart is fully rendered
      await new Promise(resolve => setTimeout(resolve, 500))

      const canvas = await html2canvas(chartElement, {
        backgroundColor: "#ffffff",
        scale: 1.5, // Increased scale for better quality
        useCORS: true,
        allowTaint: true,
        width: 800, // Match the container width
        height: 600, // Match the container height
        scrollX: 0,
        scrollY: 0,
      })

      return canvas.toDataURL("image/png", 0.9) // High quality PNG
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



      {/* Hidden charts for PDF export - positioned off-screen but fully rendered */}
      <div
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '100%',  // Wider to accommodate full chart cards
          pointerEvents: 'none',
          zIndex: -1
        }}
      >
        {/* Each chart wrapped in a Card component to match the visible charts */}
        <div data-chart-id="stockBySeedClass-export" style={{ width: '100%', height: '100%' }}>
          <StockBySeedClassPieChart data={filteredData} />
        </div>

        <div data-chart-id="stockByLocation-export" style={{ width: '100%', height: '100%' }}>
          <StockByLocationBarChart data={filteredData} />
        </div>

        <div data-chart-id="withdrawalByCrop-export" style={{ width: '100%', height: '100%' }}>
          <WithdrawalByCropChart data={filteredData} />
        </div>


        <div data-chart-id="withdrawalAnalysis-export" style={{ width: '100%', height: '100%' }}>
          <WithdrawalAnalysisChart data={filteredWithdrawals} />
        </div>


        <div data-chart-id="withdrawalTrend-export" style={{ width: '100%', height: '100%' }}>
          <WithdrawalTrendLineChart data={filteredWithdrawals} />
        </div>
      </div>
    </div>
  )
}
