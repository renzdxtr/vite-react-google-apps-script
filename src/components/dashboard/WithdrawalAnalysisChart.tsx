"use client"

import * as React from "react"
import { Calendar, Clock, TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Change the component props to accept both withdrawal and inventory data
interface WithdrawalAnalysisChartProps {
  data: any[]
  inventoryData?: any[] // Add this to receive inventory data
}

export default function WithdrawalAnalysisChart({ data, inventoryData = [] }: WithdrawalAnalysisChartProps) {
  const [timeFilter, setTimeFilter] = React.useState("daily")
  const [inventoryFilter, setInventoryFilter] = React.useState("all") // Add inventory filter state
  const [mounted, setMounted] = React.useState(false)

  // Ensure component is mounted before rendering chart
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Color palette for different time periods
  const colors = {
    morning: "#4CAF50",
    afternoon: "#FF9800",
    evening: "#1976D2",
    total: "#9C27B0",
  }

  // Process data to analyze withdrawal patterns by time of day
  const processedData = React.useMemo(() => {
    // Create a lookup map for inventory items by CODE
    const inventoryMap = inventoryData.reduce(
      (map, item) => {
        map[item.CODE] = item
        return map
      },
      {} as Record<string, any>,
    )

    // Filter by inventory type if selected
    let filteredData = data
    if (inventoryFilter !== "all") {
      filteredData = data.filter((item) => {
        const inventoryItem = inventoryMap[item.QR_CODE] || {}
        return inventoryItem.INVENTORY === inventoryFilter
      })
    }
    
    // Parse timestamps and group by date/hour
    const withdrawalsByTime = filteredData.reduce((acc, item) => {
      const timestamp = new Date(item.TIMESTAMP)
      if (isNaN(timestamp.getTime())) return acc

      let groupKey = ""
      let displayKey = ""

      if (timeFilter === "daily") {
        groupKey = timestamp.toISOString().split("T")[0]
        displayKey = timestamp.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      } else if (timeFilter === "weekly") {
        const weekStart = new Date(timestamp)
        weekStart.setDate(timestamp.getDate() - timestamp.getDay())
        groupKey = weekStart.toISOString().split("T")[0]
        displayKey = `Week of ${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      } else if (timeFilter === "monthly") {
        groupKey = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, "0")}`
        displayKey = timestamp.toLocaleDateString("en-US", { year: "numeric", month: "short" })
      } else if (timeFilter === "yearly") {
        groupKey = timestamp.getFullYear().toString()
        displayKey = timestamp.getFullYear().toString()
      }

      const hour = timestamp.getHours()
      const amount = Number.parseFloat(item.AMOUNT) || 0

      // Determine time period
      let period = "morning" // 5-11
      if (hour >= 12 && hour < 17) {
        period = "afternoon" // 12-16
      } else if (hour >= 17 || hour < 5) {
        period = "evening" // 17-4
      }

      // Group by time period
      if (!acc[groupKey]) {
        acc[groupKey] = {
          date: groupKey,
          displayDate: displayKey,
          morning: 0,
          afternoon: 0,
          evening: 0,
          total: 0,
          transactions: 0,
          inventoryType: inventoryFilter !== "all" ? inventoryFilter : "Seed Storage", // Store inventory type for tooltip
        }
      }

      // Add withdrawal amount to appropriate period
      acc[groupKey][period] += amount
      acc[groupKey].total += amount
      acc[groupKey].transactions += 1

      return acc
    }, {})

    // Convert to array and sort by date
    return Object.values(withdrawalsByTime)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-20) // Show last 20 periods for better visualization
  }, [timeFilter, data, inventoryFilter, inventoryData]) // Add inventoryFilter dependency

  // Generate chart config
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      morning: {
        label: "Morning (5am-11am)",
        color: colors.morning,
      },
      afternoon: {
        label: "Afternoon (12pm-4pm)",
        color: colors.afternoon,
      },
      evening: {
        label: "Evening (5pm-4am)",
        color: colors.evening,
      },
      total: {
        label: "Total",
        color: colors.total,
      },
    }
    return config
  }, [])

  // Custom tooltip component
  // Add this helper function
  const getUnitByInventoryType = (inventoryType: string) => {
    return inventoryType === "Planting Materials" ? "pc" : "g";
  }

  // Update the CustomTooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const unit = getUnitByInventoryType(payload[0]?.payload?.inventoryType || inventoryFilter);
      
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg max-w-xs">
          <p className="font-semibold text-sm mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="font-medium">{entry.name}</span>
                <span className="ml-auto">{entry.value.toLocaleString()}{unit}</span>
              </div>
            ))}
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
            <CardTitle className="text-lg">Withdrawal Time Analysis</CardTitle>
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
          <CardTitle className="text-lg">Withdrawal Time Analysis</CardTitle>
          <CardDescription className="text-sm">
            Seed withdrawal patterns by time of day
            {inventoryFilter !== "all" && ` - ${inventoryFilter}`}
          </CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Add inventory filter select */}
          <Select value={inventoryFilter} onValueChange={setInventoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px] rounded-lg" aria-label="Filter by inventory">
              <SelectValue placeholder="Filter by inventory" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="rounded-lg">
                All Inventory
              </SelectItem>
              <SelectItem value="Seed Storage" className="rounded-lg">
                Seed Storage
              </SelectItem>
              <SelectItem value="Planting Materials" className="rounded-lg">
                Planting Materials
              </SelectItem>
            </SelectContent>
          </Select>
          
          {/* Existing time filter select */}
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-full sm:w-[140px] rounded-lg" aria-label="Time view">
              <SelectValue placeholder="View by" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="daily" className="rounded-lg">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  Daily View
                </div>
              </SelectItem>
              <SelectItem value="weekly" className="rounded-lg">
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  Weekly View
                </div>
              </SelectItem>
              <SelectItem value="monthly" className="rounded-lg">
                <div className="flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Monthly View
                </div>
              </SelectItem>
              <SelectItem value="yearly" className="rounded-lg">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  Yearly View
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] sm:h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={processedData}
              margin={{
                top: 10,
                right: 10,
                left: 0,
                bottom: 30,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="displayDate"
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
                tickFormatter={(value) => `${value}${getUnitByInventoryType(inventoryFilter !== "all" ? inventoryFilter : "Seed Storage")}`}
                fontSize={12}
              />
              <ChartTooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="morning"
                stackId="1"
                stroke={colors.morning}
                fill={colors.morning}
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="afternoon"
                stackId="1"
                stroke={colors.afternoon}
                fill={colors.afternoon}
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="evening"
                stackId="1"
                stroke={colors.evening}
                fill={colors.evening}
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-4 flex flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center">
            <div className="mr-2 h-3 w-3 rounded-full" style={{ backgroundColor: colors.morning }}></div>
            <span>Morning (5am-11am)</span>
          </div>
          <div className="flex items-center">
            <div className="mr-2 h-3 w-3 rounded-full" style={{ backgroundColor: colors.afternoon }}></div>
            <span>Afternoon (12pm-4pm)</span>
          </div>
          <div className="flex items-center">
            <div className="mr-2 h-3 w-3 rounded-full" style={{ backgroundColor: colors.evening }}></div>
            <span>Evening (5pm-4am)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
