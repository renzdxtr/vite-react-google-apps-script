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

import { jsPDF } from "jspdf";

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

// Define the dimensions for the canvas - increase height for better visibility
const cardStyleDimension = { 'WIDTH': '1800px', 'HEIGHT': '500px' }
const canvasDimension = { 'WIDTH': 1800, 'HEIGHT': 500 }

export default function ExportReporting({ joinedData, withdrawalData, metrics, alerts }: ExportReportingProps) {
  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")
  const [reportType, setReportType] = React.useState("summary")
  // Update the selectedCharts state to include inventory-specific charts
  const [selectedCharts, setSelectedCharts] = React.useState({
    stockBySeedClass_SeedStorage: true,
    stockBySeedClass_PlantingMaterials: true,
    stockByLocation_SeedStorage: true,
    stockByLocation_PlantingMaterials: true,
    withdrawalTrend: true,
    withdrawalAnalysis: true,
    withdrawalByCrop: true,
    releaseLog: false,
  })
  
  // Update the getChartTitle function
  const getChartTitle = (chartId: string) => {
    const titles = {
      stockBySeedClass_SeedStorage: "Stock Distribution by Seed Class - Seed Storage",
      stockBySeedClass_PlantingMaterials: "Stock Distribution by Seed Class - Planting Materials",
      stockByLocation_SeedStorage: "Stock Distribution by Location - Seed Storage",
      stockByLocation_PlantingMaterials: "Stock Distribution by Location - Planting Materials",
      withdrawalTrend: "Withdrawal Trends Over Time",
      withdrawalAnalysis: "Withdrawal Time Analysis",
      withdrawalByCrop: "Withdrawals by Crop Type",
      releaseLog: "Recent Release Log Data",
    }
    return titles[chartId as keyof typeof titles] || chartId
  }
  
  // Update the getChartDescription function
  const getChartDescription = (chartId: string, inventoryData: any[], withdrawalData: any[]) => {
    // Filter data by inventory type for specific chart descriptions
    const seedStorageData = inventoryData.filter(item => item.INVENTORY === "Seed Storage" || !item.INVENTORY);
    const plantingMaterialsData = inventoryData.filter(item => item.INVENTORY === "Planting Materials");
    
    const descriptions = {
      stockBySeedClass_SeedStorage: `This pie chart illustrates the distribution of remaining seed stock across different seed classifications for Seed Storage inventory. The visualization helps identify which seed classes dominate the inventory and assists in maintaining balanced stock levels. Total items analyzed: ${seedStorageData.length}`,
      stockBySeedClass_PlantingMaterials: `This pie chart illustrates the distribution of remaining planting materials across different seed classifications. The visualization helps identify which seed classes dominate the inventory and assists in maintaining balanced stock levels. Total items analyzed: ${plantingMaterialsData.length}`,
      stockByLocation_SeedStorage: `This bar chart displays seed stock levels across different storage locations within the facility for Seed Storage inventory. It enables quick identification of storage capacity utilization and helps optimize inventory distribution. Storage locations tracked: ${[...new Set(seedStorageData.map(item => item.LOCATION))].length}`,
      stockByLocation_PlantingMaterials: `This bar chart displays planting materials stock levels across different storage locations within the facility. It enables quick identification of storage capacity utilization and helps optimize inventory distribution. Storage locations tracked: ${[...new Set(plantingMaterialsData.map(item => item.LOCATION))].length}`,
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
      

      const doc = new jsPDF()
      let yPosition = 20
      
      // Add bookmarks for navigation
      let bookmarks = {
        "Executive Summary": { pageNumber: 1, yPosition: 20 },
      }

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
      // Add bookmark for Executive Summary
      bookmarks["Executive Summary"] = { pageNumber: doc.getCurrentPageInfo().pageNumber, yPosition }
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
        // Add bookmark for System Alerts
        bookmarks["System Alerts"] = { pageNumber: doc.getCurrentPageInfo().pageNumber, yPosition }
        yPosition += 10

        doc.setFontSize(10)
        alerts.slice(0, 5).forEach((alert) => {
          const lines = doc.splitTextToSize(alert.message, 170)
          doc.text(lines, 20, yPosition)
          yPosition += lines.length * 5 + 2
        })
        yPosition += 10
      }
      doc.addPage()
      // Charts Section - Enhanced Layout with 1 chart per page
      if (Object.values(selectedCharts).some(Boolean)) {
        // Add new page for charts section
        doc.addPage()
        yPosition = 20
      
        doc.setFontSize(18)
        doc.text("Data Visualization and Analysis", 20, yPosition)
        // Add bookmark for Data Visualization
        bookmarks["Data Visualization"] = { pageNumber: doc.getCurrentPageInfo().pageNumber, yPosition }
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
          const availableHeight = pageHeight - 30 // Reduced top/bottom margins
          const chartHeight = availableHeight - 60 // Increased space for tabular data
          const chartWidth = 190 // Almost full page width
      
          // Process chart
          const chartId = selectedChartIds[i]
          const chartTitle = getChartTitle(chartId)
          
          // Add bookmark for each chart
          bookmarks[chartTitle] = { pageNumber: doc.getCurrentPageInfo().pageNumber, yPosition }
          
          await renderChartToPDF(doc, chartId, 10, yPosition, chartWidth, chartHeight)
          
          // Add tabular data for the chart if it's not the releaseLog
          if (chartId !== "releaseLog") {
            await addTabularDataForChart(doc, chartId, 10, yPosition + chartHeight + 10, chartWidth)
          }
        }
      }

      // Helper function to render individual chart to PDF with enhanced legend visibility
      async function renderChartToPDF(
        doc: any,
        chartId: string,
        x: number,
        y: number,
        width: number,
        height: number
      ) {
        // Add chart title
        doc.setFontSize(16)
        doc.setTextColor(0, 0, 0)
        const chartTitle = getChartTitle(chartId)
        doc.text(chartTitle, x, y + 10)

        const titleHeight = 15
        const chartY = y + titleHeight

        // Capture and add chart image
        const chartImage = await captureChart(chartId)
        if (chartImage) {
          // Calculate chart image dimensions (maintain aspect ratio within bounds)
          const imageHeight = height - titleHeight - 20 // Space for description
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
          const descriptionY = chartY + imgHeight + 10
          doc.setFontSize(10)
          doc.setTextColor(80, 80, 80) // Gray color for description

          const description = getChartDescription(chartId, filteredData, filteredWithdrawals)
          const maxDescriptionWidth = width
          const descriptionLines = doc.splitTextToSize(description, maxDescriptionWidth)

          // Limit description to fit remaining space
          const remainingHeight = height - (descriptionY - y)
          const maxLines = Math.floor(remainingHeight / 4)
          const limitedLines = descriptionLines.slice(0, maxLines)

          limitedLines.forEach((line: string, index: number) => {
            doc.text(line, x, descriptionY + (index * 4))
          })
        }
      }
      
      // Helper function to add tabular data for charts
      async function addTabularDataForChart(
        doc: any,
        chartId: string,
        x: number,
        y: number,
        width: number
      ) {
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text("Tabular Data", x, y);
        y += 8;
        
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        
        // Different tabular data based on chart type
        if (chartId.startsWith("stockBySeedClass")) {
          // Determine which inventory type to filter by
          const inventoryType = chartId.includes("PlantingMaterials") ? "Planting Materials" : "Seed Storage";
          const filteredByInventory = filteredData.filter(item => 
            inventoryType === "Seed Storage" ? 
              (item.INVENTORY === "Seed Storage" || !item.INVENTORY) : 
              item.INVENTORY === inventoryType
          );
          
          // Group by seed class
          const seedClassData: Record<string, {volume: number, count: number}> = {};
          filteredByInventory.forEach(item => {
            if (!seedClassData[item.SEED_CLASS]) {
              seedClassData[item.SEED_CLASS] = {volume: 0, count: 0};
            }
            seedClassData[item.SEED_CLASS].volume += item.remainingVolume || item.VOLUME;
            seedClassData[item.SEED_CLASS].count += 1;
          });
          
          // Create table
          const unit = inventoryType === "Planting Materials" ? "pcs" : "g";
          const headers = ["Seed Class", `Volume (${unit})`, "Item Count", "Percentage"];
          const totalVolume = Object.values(seedClassData).reduce((sum, data) => sum + data.volume, 0);
          
          // Draw table headers
          const colWidths = [50, 40, 40, 40];
          let xPos = x;
          headers.forEach((header, i) => {
            doc.text(header, xPos, y);
            xPos += colWidths[i];
          });
          y += 5;
          
          // Draw table rows
          Object.entries(seedClassData).forEach(([seedClass, data]) => {
            const percentage = totalVolume > 0 ? ((data.volume / totalVolume) * 100).toFixed(1) : "0.0";
            const rowData = [seedClass, data.volume.toString(), data.count.toString(), `${percentage}%`];
            
            xPos = x;
            rowData.forEach((cell, i) => {
              doc.text(cell, xPos, y);
              xPos += colWidths[i];
            });
            y += 4;
          });
        } else if (chartId.startsWith("stockByLocation")) {
          // Implementation for location-based charts
          const inventoryType = chartId.includes("PlantingMaterials") ? "Planting Materials" : "Seed Storage";
          const filteredByInventory = filteredData.filter(item => 
            inventoryType === "Seed Storage" ? 
              (item.INVENTORY === "Seed Storage" || !item.INVENTORY) : 
              item.INVENTORY === inventoryType
          );
          
          // Group by location
          const locationData: Record<string, {volume: number, count: number}> = {};
          filteredByInventory.forEach(item => {
            if (!locationData[item.LOCATION]) {
              locationData[item.LOCATION] = {volume: 0, count: 0};
            }
            locationData[item.LOCATION].volume += item.remainingVolume || item.VOLUME;
            locationData[item.LOCATION].count += 1;
          });
          
          // Create table
          const unit = inventoryType === "Planting Materials" ? "pcs" : "g";
          const headers = ["Location", `Volume (${unit})`, "Item Count", "Percentage"];
          const totalVolume = Object.values(locationData).reduce((sum, data) => sum + data.volume, 0);
          
          // Draw table headers
          const colWidths = [50, 40, 40, 40];
          let xPos = x;
          headers.forEach((header, i) => {
            doc.text(header, xPos, y);
            xPos += colWidths[i];
          });
          y += 5;
          
          // Draw table rows
          Object.entries(locationData).forEach(([location, data]) => {
            const percentage = totalVolume > 0 ? ((data.volume / totalVolume) * 100).toFixed(1) : "0.0";
            const rowData = [location, data.volume.toString(), data.count.toString(), `${percentage}%`];
            
            xPos = x;
            rowData.forEach((cell, i) => {
              doc.text(cell, xPos, y);
              xPos += colWidths[i];
            });
            y += 4;
          });
        } else if (chartId === "withdrawalTrend") {
          // Tabular data for withdrawal trends
          // Group withdrawals by month
          const monthlyData: Record<string, number> = {};
          
          filteredWithdrawals.forEach(item => {
            const date = new Date(item.TIMESTAMP);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
            
            if (!monthlyData[monthYear]) {
              monthlyData[monthYear] = 0;
            }
            monthlyData[monthYear] += Number(item.AMOUNT) || 0;
          });
          
          // Create table
          const headers = ["Month/Year", "Total Withdrawal Volume"];
          
          // Draw table headers
          const colWidths = [50, 60];
          let xPos = x;
          headers.forEach((header, i) => {
            doc.text(header, xPos, y);
            xPos += colWidths[i];
          });
          y += 5;
          
          // Draw table rows
          Object.entries(monthlyData)
            .sort((a, b) => {
              const [aMonth, aYear] = a[0].split('/');
              const [bMonth, bYear] = b[0].split('/');
              return new Date(Number(aYear), Number(aMonth) - 1).getTime() - 
                     new Date(Number(bYear), Number(bMonth) - 1).getTime();
            })
            .forEach(([monthYear, volume]) => {
              const rowData = [monthYear, volume.toString()];
              
              xPos = x;
              rowData.forEach((cell, i) => {
                doc.text(cell, xPos, y);
                xPos += colWidths[i];
              });
              y += 4;
            });
        } else if (chartId === "withdrawalAnalysis") {
          // Tabular data for withdrawal time analysis
          // Group withdrawals by time of day
          const timeData = {
            morning: 0,   // 6:00 AM - 11:59 AM
            afternoon: 0, // 12:00 PM - 5:59 PM
            evening: 0    // 6:00 PM - 5:59 AM
          };
          
          filteredWithdrawals.forEach(item => {
            const date = new Date(item.TIMESTAMP);
            const hour = date.getHours();
            
            if (hour >= 6 && hour < 12) {
              timeData.morning += Number(item.AMOUNT) || 0;
            } else if (hour >= 12 && hour < 18) {
              timeData.afternoon += Number(item.AMOUNT) || 0;
            } else {
              timeData.evening += Number(item.AMOUNT) || 0;
            }
          });
          
          // Create table
          const headers = ["Time Period", "Total Withdrawal Volume", "Percentage"];
          const totalVolume = Object.values(timeData).reduce((sum, volume) => sum + volume, 0);
          
          // Draw table headers
          const colWidths = [50, 60, 40];
          let xPos = x;
          headers.forEach((header, i) => {
            doc.text(header, xPos, y);
            xPos += colWidths[i];
          });
          y += 5;
          
          // Draw table rows
          const timePeriods = {
            morning: "Morning (6AM-12PM)",
            afternoon: "Afternoon (12PM-6PM)",
            evening: "Evening (6PM-6AM)"
          };
          
          Object.entries(timeData).forEach(([period, volume]) => {
            const percentage = totalVolume > 0 ? ((volume / totalVolume) * 100).toFixed(1) : "0.0";
            const rowData = [timePeriods[period as keyof typeof timePeriods], volume.toString(), `${percentage}%`];
            
            xPos = x;
            rowData.forEach((cell, i) => {
              doc.text(cell, xPos, y);
              xPos += colWidths[i];
            });
            y += 4;
          });
        } else if (chartId === "withdrawalByCrop") {
          // Tabular data for withdrawals by crop
          // Group withdrawals by crop
          const cropData: Record<string, number> = {};
          
          filteredWithdrawals.forEach(item => {
            // Find the inventory item to get the crop
            const inventoryItem = joinedData.find(inv => inv.CODE === item.QR_CODE);
            if (inventoryItem && inventoryItem.CROP) {
              if (!cropData[inventoryItem.CROP]) {
                cropData[inventoryItem.CROP] = 0;
              }
              cropData[inventoryItem.CROP] += Number(item.AMOUNT) || 0;
            }
          });
          
          // Create table
          const headers = ["Crop", "Total Withdrawal Volume", "Percentage"];
          const totalVolume = Object.values(cropData).reduce((sum, volume) => sum + volume, 0);
          
          // Draw table headers
          const colWidths = [50, 60, 40];
          let xPos = x;
          headers.forEach((header, i) => {
            doc.text(header, xPos, y);
            xPos += colWidths[i];
          });
          y += 5;
          
          // Draw table rows
          Object.entries(cropData)
            .sort((a, b) => b[1] - a[1]) // Sort by volume, descending
            .forEach(([crop, volume]) => {
              const percentage = totalVolume > 0 ? ((volume / totalVolume) * 100).toFixed(1) : "0.0";
              const rowData = [crop, volume.toString(), `${percentage}%`];
              
              xPos = x;
              rowData.forEach((cell, i) => {
                doc.text(cell, xPos, y);
                xPos += colWidths[i];
              });
              y += 4;
            });
        }
      }

      // Detailed Tables (if detailed report)
      if (reportType === "detailed") {
        doc.addPage()
        yPosition = 20

        doc.setFontSize(16)
        doc.text("Detailed Inventory Data", 20, yPosition)
        // Add bookmark for Detailed Data
        bookmarks["Detailed Data"] = { pageNumber: doc.getCurrentPageInfo().pageNumber, yPosition }
        yPosition += 15

        // Create detailed inventory table
        doc.setFontSize(10)
        doc.text(`Showing ${Math.min(filteredData.length, 50)} of ${filteredData.length} items`, 20, yPosition)
        yPosition += 10
        
        // Table headers
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        
        const headers = ["Code", "Crop", "Variety", "Seed Class", "Location", "Inventory", "Remaining", "Status"];
        const colWidths = [25, 25, 25, 25, 25, 25, 25, 20];
        
        let xPos = 20;
        headers.forEach((header, i) => {
          doc.text(header, xPos, yPosition);
          xPos += colWidths[i];
        });
        yPosition += 5;
        
        // Table rows - limit to 50 items to avoid excessive pages
        doc.setTextColor(0, 0, 0);
        const itemsToShow = filteredData.slice(0, 50);
        
        itemsToShow.forEach((item, index) => {
          // Add page break if needed
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
            
            // Repeat headers on new page
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            xPos = 20;
            headers.forEach((header, i) => {
              doc.text(header, xPos, yPosition);
              xPos += colWidths[i];
            });
            yPosition += 5;
            doc.setTextColor(0, 0, 0);
          }
          
          // Alternate row colors
          if (index % 2 === 1) {
            doc.setFillColor(240, 240, 240);
            doc.rect(20, yPosition - 3, 195, 4, 'F');
          }
          
          const status = getItemStatus(item);
          const statusColor = status === "Critical" ? "#ff0000" : status === "Low" ? "#ffa500" : "#008000";
          
          const unit = item.INVENTORY === "Planting Materials" ? "pcs" : "g";
          const rowData = [
            item.CODE.substring(0, 10),
            item.CROP,
            item.VARIETY.substring(0, 10),
            item.SEED_CLASS,
            item.LOCATION,
            item.INVENTORY || "Seed Storage",
            `${item.remainingVolume || item.VOLUME}${unit}`,
            status
          ];
          
          xPos = 20;
          rowData.forEach((cell, i) => {
            // Use color for status column
            if (i === 7) {
              const originalTextColor = doc.getTextColor();
              doc.setTextColor(statusColor);
              doc.text(cell, xPos, yPosition);
              doc.setTextColor(originalTextColor);
            } else {
              doc.text(cell, xPos, yPosition);
            }
            xPos += colWidths[i];
          });
          yPosition += 4;
        });
        
        // Add withdrawal data table if there are withdrawals
        if (filteredWithdrawals.length > 0) {
          doc.addPage();
          yPosition = 20;
          
          doc.setFontSize(16);
          doc.text("Recent Withdrawals", 20, yPosition);
          yPosition += 15;
          
          doc.setFontSize(10);
          doc.text(`Showing ${Math.min(filteredWithdrawals.length, 50)} of ${filteredWithdrawals.length} withdrawals`, 20, yPosition);
          yPosition += 10;
          
          // Table headers
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          
          const wHeaders = ["Date", "QR Code", "Amount", "Previous", "New Value", "Reason", "User"];
          const wColWidths = [30, 30, 25, 25, 25, 40, 25];
          
          xPos = 20;
          wHeaders.forEach((header, i) => {
            doc.text(header, xPos, yPosition);
            xPos += wColWidths[i];
          });
          yPosition += 5;
          
          // Table rows - limit to 50 items
          doc.setTextColor(0, 0, 0);
          const withdrawalsToShow = filteredWithdrawals.slice(0, 50);
          
          withdrawalsToShow.forEach((item, index) => {
            // Add page break if needed
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 20;
              
              // Repeat headers on new page
              doc.setFontSize(8);
              doc.setTextColor(100, 100, 100);
              xPos = 20;
              wHeaders.forEach((header, i) => {
                doc.text(header, xPos, yPosition);
                xPos += wColWidths[i];
              });
              yPosition += 5;
              doc.setTextColor(0, 0, 0);
            }
            
            // Alternate row colors
            if (index % 2 === 1) {
              doc.setFillColor(240, 240, 240);
              doc.rect(20, yPosition - 3, 195, 4, 'F');
            }
            
            // Find the inventory item to determine the unit
            const inventoryItem = joinedData.find(inv => inv.CODE === item.QR_CODE);
            const unit = inventoryItem && inventoryItem.INVENTORY === "Planting Materials" ? "pcs" : "g";
            
            const date = new Date(item.TIMESTAMP).toLocaleDateString();
            const rowData = [
              date,
              item.QR_CODE.substring(0, 10),
              `${item.AMOUNT}${unit}`,
              `${item.PREVIOUS_VALUE}${unit}`,
              `${item.NEW_VALUE}${unit}`,
              (item.REASON || "Not specified").substring(0, 20),
              (item.USER || "Not specified").substring(0, 10)
            ];
            
            xPos = 20;
            rowData.forEach((cell, i) => {
              doc.text(cell, xPos, yPosition);
              xPos += wColWidths[i];
            });
            yPosition += 4;
          });
        }
      }
      
      // Instead, add a table of contents page
      doc.addPage();
      doc.setPage(2); // Move to the first page
      
      // Add table of contents
      let tocY = 20;
      doc.setFontSize(18);
      doc.text("Table of Contents", 20, tocY);
      tocY += 15;
      
      doc.setFontSize(12);
      Object.entries(bookmarks).forEach(([title, { pageNumber }]) => {
        doc.text(`${title} ........................... Page ${pageNumber}`, 20, tocY);
        tocY += 10;
      });
      
      // Move back to the last page to continue
      doc.setPage(doc.getNumberOfPages());

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
          width: cardStyleDimension.WIDTH,
          height: cardStyleDimension.HEIGHT,
          pointerEvents: 'none',
          zIndex: -1,
          backgroundColor: 'white'
        }}
      >
        {/* Seed Storage - Stock By Seed Class */}
        <div
          data-chart-id="stockBySeedClass_SeedStorage-export"
          style={{
            width: cardStyleDimension.WIDTH,
            height: cardStyleDimension.HEIGHT,
            padding: '40px',
            backgroundColor: 'white',
            border: 'none',
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <StockBySeedClassPieChart data={filteredData.filter(item => item.INVENTORY === "Seed Storage" || !item.INVENTORY)} />
        </div>

        {/* Planting Materials - Stock By Seed Class */}
        <div
          data-chart-id="stockBySeedClass_PlantingMaterials-export"
          style={{
            width: cardStyleDimension.WIDTH,
            height: cardStyleDimension.HEIGHT,
            padding: '40px',
            backgroundColor: 'white',
            border: 'none',
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <StockBySeedClassPieChart data={filteredData.filter(item => item.INVENTORY === "Planting Materials")} />
        </div>

        {/* Seed Storage - Stock By Location */}
        <div
          data-chart-id="stockByLocation_SeedStorage-export"
          style={{
            width: cardStyleDimension.WIDTH,
            height: cardStyleDimension.HEIGHT,
            padding: '40px',
            backgroundColor: 'white',
            border: 'none',
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <StockByLocationBarChart data={filteredData.filter(item => item.INVENTORY === "Seed Storage" || !item.INVENTORY)} />
        </div>

        {/* Planting Materials - Stock By Location */}
        <div
          data-chart-id="stockByLocation_PlantingMaterials-export"
          style={{
            width: cardStyleDimension.WIDTH,
            height: cardStyleDimension.HEIGHT,
            padding: '40px',
            backgroundColor: 'white',
            border: 'none',
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <StockByLocationBarChart data={filteredData.filter(item => item.INVENTORY === "Planting Materials")} />
        </div>

        {/* Keep existing charts */}
        <div
          data-chart-id="withdrawalByCrop-export"
          style={{
            width: cardStyleDimension.WIDTH,
            height: cardStyleDimension.HEIGHT,
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

        {/* Other existing charts... */}
        
        {/* Add the missing releaseLog chart component */}
        <div
          data-chart-id="releaseLog-export"
          style={{
            width: cardStyleDimension.WIDTH,
            height: cardStyleDimension.HEIGHT,
            padding: '40px',
            backgroundColor: 'white',
            border: 'none',
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div className="w-full overflow-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Date</th>
                  <th className="border p-2 text-left">QR Code</th>
                  <th className="border p-2 text-left">Crop</th>
                  <th className="border p-2 text-left">Variety</th>
                  <th className="border p-2 text-left">Amount</th>
                  <th className="border p-2 text-left">Reason</th>
                </tr>
              </thead>
              <tbody>
                {filteredWithdrawals.slice(0, 10).map((item, index) => {
                  // Find the inventory item to get crop and variety
                  const inventoryItem = joinedData.find(inv => inv.CODE === item.QR_CODE) || {}
                  const unit = inventoryItem.INVENTORY ? getVolumeUnit(inventoryItem.INVENTORY) : 'g'
                  
                  return (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border p-2">{new Date(item.TIMESTAMP).toLocaleDateString()}</td>
                      <td className="border p-2">{item.QR_CODE}</td>
                      <td className="border p-2">{inventoryItem.CROP || 'N/A'}</td>
                      <td className="border p-2">{inventoryItem.VARIETY || 'N/A'}</td>
                      <td className="border p-2">{item.AMOUNT}{unit}</td>
                      <td className="border p-2">{item.REASON || 'Not specified'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      {/* Add the missing withdrawalTrend chart */}
      <div
        data-chart-id="withdrawalTrend-export"
        style={{
          width: cardStyleDimension.WIDTH,
          height: cardStyleDimension.HEIGHT,
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
      {/* Add the missing withdrawalAnalysis chart */}
      <div
        data-chart-id="withdrawalAnalysis-export"
        style={{
          width: cardStyleDimension.WIDTH,
          height: cardStyleDimension.HEIGHT,
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
      </div>
    </div>
  )
}