"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface WithdrawalTrendLineChartProps {
  data: any[]
}

// Color palette for different withdrawal types
const colors = ["#4CAF50", "#388E3C", "#FF9800", "#F57C00", "#1976D2", "#1565C0"]

// Define the available locations
const AVAILABLE_LOCATIONS = ["Conventional", "Organic", "Plant Nursery"]

export default function WithdrawalTrendLineChart({ data }: WithdrawalTrendLineChartProps) {
  const [locationFilter, setLocationFilter] = React.useState("all")
  const [mounted, setMounted] = React.useState(false)

  // Ensure component is mounted before rendering chart
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Process data to create monthly withdrawal trends
  const processedData = React.useMemo(() => {
    // Filter data based on location if selected
    let filteredData = data

    if (locationFilter !== "all") {
      filteredData = data.filter((item) => {
        // Since the withdrawal data doesn't have location info, we'll simulate it
        // by assigning locations based on QR code patterns
        const qrCode = item.QR_CODE || ""
        if (locationFilter === "Conventional") {
          return qrCode.includes("Sbn11") || qrCode.includes("Sbn14") || qrCode.includes("Sbn16")
        } else if (locationFilter === "Organic") {
          return qrCode.includes("Sbn12") || qrCode.includes("Sbn18") || qrCode.includes("Sbn20")
        } else if (locationFilter === "Plant Nursery") {
          return (
            qrCode.includes("Sbn13") || qrCode.includes("Sbn15") || qrCode.includes("Sbn17") || qrCode.includes("Sbn19")
          )
        }
        return true
      })
    }

    // Create monthly withdrawal data based on timestamps
    const monthlyData = new Map()

    filteredData.forEach((item) => {
      const timestamp = new Date(item.TIMESTAMP)

      if (isNaN(timestamp.getTime())) {
        // Skip invalid dates
        return
      }

      const year = timestamp.getFullYear()
      const month = timestamp.getMonth()

      const monthKey = `${year}-${String(month + 1).padStart(2, "0")}` // YYYY-MM format
      const monthLabel = timestamp.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      })

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: monthLabel,
          monthKey,
          totalWithdrawal: 0,
          seedStorage: 0,
          plantingMaterials: 0,
          locationBreakdown: {},
          cropBreakdown: {},
          details: [],
        })
      }

      const monthData = monthlyData.get(monthKey)

      // Use actual withdrawal amount from data
      const withdrawalAmount = Number.parseFloat(item.AMOUNT) || 0

      monthData.totalWithdrawal += withdrawalAmount

      // Randomly distribute between seed storage and planting materials
      // since we don't have that information in the sample data
      if (Math.random() > 0.5) {
        monthData.seedStorage += withdrawalAmount
      } else {
        monthData.plantingMaterials += withdrawalAmount
      }

      // Assign location based on QR code pattern
      const qrCode = item.QR_CODE || ""
      let location = "Unknown"
      if (qrCode.includes("Sbn11") || qrCode.includes("Sbn14") || qrCode.includes("Sbn16")) {
        location = "Conventional"
      } else if (qrCode.includes("Sbn12") || qrCode.includes("Sbn18") || qrCode.includes("Sbn20")) {
        location = "Organic"
      } else if (
        qrCode.includes("Sbn13") ||
        qrCode.includes("Sbn15") ||
        qrCode.includes("Sbn17") ||
        qrCode.includes("Sbn19")
      ) {
        location = "Plant Nursery"
      }

      if (!monthData.locationBreakdown[location]) {
        monthData.locationBreakdown[location] = 0
      }
      monthData.locationBreakdown[location] += withdrawalAmount

      // Since we don't have crop info in withdrawal data, use QR_CODE to simulate
      const crop = item.QR_CODE.split("-")[0] || "Unknown"
      if (!monthData.cropBreakdown[crop]) {
        monthData.cropBreakdown[crop] = 0
      }
      monthData.cropBreakdown[crop] += withdrawalAmount

      // Store detailed information
      monthData.details.push({
        qrCode: item.QR_CODE,
        location: location,
        withdrawalAmount,
        reason: item.REASON || "Not specified",
      })
    })

    // Convert to array and sort by date
    return Array.from(monthlyData.values())
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .slice(0, 12) // Limit to 12 months for better visualization
  }, [locationFilter, data])

  // Generate chart config
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      totalWithdrawal: {
        label: "Total Withdrawal",
        color: colors[0],
      },
      seedStorage: {
        label: "Seed Storage",
        color: colors[1],
      },
      plantingMaterials: {
        label: "Planting Materials",
        color: colors[2],
      },
    }
    return config
  }, [])

  // Calculate total withdrawals across all months
  const totalWithdrawals = React.useMemo(() => {
    return processedData.reduce((acc, curr) => acc + curr.totalWithdrawal, 0)
  }, [processedData])

  // Custom tooltip component
  // Add this helper function
  const getUnitByInventoryType = (inventoryType: string) => {
  return inventoryType === "Planting Materials" ? "pc" : "g";
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const seedStorageUnit = getUnitByInventoryType("Seed Storage");
      const plantingMaterialsUnit = getUnitByInventoryType("Planting Materials");
      
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg max-w-xs">
          <p className="font-semibold text-sm mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => {
              const unit = entry.name.includes("Planting Materials") ? plantingMaterialsUnit : seedStorageUnit;
              return (
                <div key={index} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="font-medium">{entry.name}</span>
                  <span className="ml-auto">{entry.value.toLocaleString()}{unit}</span>
                </div>
              );
            })}
          </div>
        </div>
      )
    }
    return null
  }

  // Don't render chart until component is mounted
  if (!mounted) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2 border-b py-4">
          <div className="flex-1">
            <CardTitle className="text-lg">Withdrawal Trend Chart</CardTitle>
            <CardDescription className="text-sm">Loading chart...</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-[300px] sm:h-[400px] w-full flex items-center justify-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2 border-b py-4">
        <div className="flex-1">
          <CardTitle className="text-lg">Withdrawal Trend Chart</CardTitle>
          <CardDescription className="text-sm">
            Monthly withdrawal patterns and trends by inventory type
            {locationFilter !== "all" && ` - ${locationFilter} Location`}
          </CardDescription>
        </div>
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-full sm:w-[180px] rounded-lg" aria-label="Filter by location">
            <SelectValue placeholder="Filter by location" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all" className="rounded-lg">
              All Locations
            </SelectItem>
            {AVAILABLE_LOCATIONS.map((location) => (
              <SelectItem key={location} value={location} className="rounded-lg">
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-4">
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] sm:h-[400px] w-full">
          <LineChart
            data={processedData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value}${getUnitByInventoryType("Seed Storage")}`}
              fontSize={12}
            />
            <ChartTooltip content={<CustomTooltip />} />
            <ChartLegend
              content={<ChartLegendContent />}
              wrapperStyle={{
                padding: "8px 0",
                overflow: "hidden",
                width: "100%",
                maxWidth: "100%",
                fontSize: "12px",
              }}
            />
            <Line
              dataKey="totalWithdrawal"
              name="Total Withdrawal"
              type="monotone"
              stroke={colors[0]}
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: colors[0] }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
            <Line
              dataKey="seedStorage"
              name="Seed Storage"
              type="monotone"
              stroke={colors[1]}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 2, fill: colors[1] }}
              activeDot={{ r: 5, strokeWidth: 2 }}
              strokeDasharray="5 5"
            />
            <Line
              dataKey="plantingMaterials"
              name="Planting Materials"
              type="monotone"
              stroke={colors[2]}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 2, fill: colors[2] }}
              activeDot={{ r: 5, strokeWidth: 2 }}
              strokeDasharray="3 3"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
  <div className="flex items-center justify-between">
    <div className="text-sm text-muted-foreground">
      Total Withdrawals: {totalWithdrawals.toLocaleString()}{getUnitByInventoryType("Seed Storage")}
    </div>
  </div>
</CardFooter>
    </Card>
  )
}

