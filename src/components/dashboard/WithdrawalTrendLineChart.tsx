"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SAMPLE_DATA_INVENTORY } from "@/lib/constants";

// Color palette for different withdrawal types
const colors = ["#4CAF50", "#388E3C", "#FF9800", "#F57C00", "#1976D2", "#1565C0"]

export default function WithdrawalTrendLineChart() {
  const [locationFilter, setLocationFilter] = React.useState("all")
  const [mounted, setMounted] = React.useState(false)

  // Ensure component is mounted before rendering chart
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Get unique locations for filtering
  const allLocations = React.useMemo(() => {
    return [...new Set(SAMPLE_DATA_INVENTORY.map((item) => item.LOCATION))]
  }, [])

  // Process data to simulate monthly withdrawal trends
  const processedData = React.useMemo(() => {
    // Filter data based on location if selected
    let filteredData = SAMPLE_DATA_INVENTORY

    if (locationFilter !== "all") {
      filteredData = SAMPLE_DATA_INVENTORY.filter((item) => item.LOCATION === locationFilter)
    }

    // Create monthly withdrawal data based on stored dates
    // Simulate withdrawals as a percentage of stored volume over time
    const monthlyData = new Map()

    filteredData.forEach((item) => {
      const storedDate = new Date(item.STORED_DATE)
      const year = storedDate.getFullYear()
      const month = storedDate.getMonth()

      // Create monthly entries for the next few months after storage
      for (let i = 0; i < 3; i++) {
        const withdrawalDate = new Date(year, month + i + 1, 1)
        const monthKey = withdrawalDate.toISOString().slice(0, 7) // YYYY-MM format
        const monthLabel = withdrawalDate.toLocaleDateString("en-US", {
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

        // Simulate withdrawal amounts (decreasing over time)
        const withdrawalPercentage = Math.max(0.1, 0.4 - i * 0.1)
        const withdrawalAmount = Math.floor(item.VOLUME * withdrawalPercentage * (0.8 + Math.random() * 0.4))

        monthData.totalWithdrawal += withdrawalAmount

        // Categorize by inventory type
        if (item.INVENTORY === "Seed Storage") {
          monthData.seedStorage += withdrawalAmount
        } else {
          monthData.plantingMaterials += withdrawalAmount
        }

        // Track by location
        if (!monthData.locationBreakdown[item.LOCATION]) {
          monthData.locationBreakdown[item.LOCATION] = 0
        }
        monthData.locationBreakdown[item.LOCATION] += withdrawalAmount

        // Track by crop
        if (!monthData.cropBreakdown[item.CROP]) {
          monthData.cropBreakdown[item.CROP] = 0
        }
        monthData.cropBreakdown[item.CROP] += withdrawalAmount

        // Store detailed information
        monthData.details.push({
          crop: item.CROP,
          variety: item.VARIETY,
          location: item.LOCATION,
          seedClass: item.SEED_CLASS,
          withdrawalAmount,
          originalVolume: item.VOLUME,
        })
      }
    })

    // Convert to array and sort by date
    return Array.from(monthlyData.values())
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .slice(0, 12) // Limit to 12 months for better visualization
  }, [locationFilter])

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
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload

      // Get top locations and crops for this month
      const topLocations = Object.entries(data.locationBreakdown)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3)

      const topCrops = Object.entries(data.cropBreakdown)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3)

      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg max-w-sm">
          <p className="font-semibold text-sm mb-2">{label}</p>
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium text-blue-600">
                Total Withdrawal: {data.totalWithdrawal.toLocaleString()}g
              </p>
              <div className="text-xs text-gray-600 mt-1">
                <p>Seed Storage: {data.seedStorage.toLocaleString()}g</p>
                <p>Planting Materials: {data.plantingMaterials.toLocaleString()}g</p>
              </div>
            </div>

            {topLocations.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-700">Top Locations:</p>
                {topLocations.map(([location, amount], index) => (
                  <p key={index} className="text-xs text-gray-600">
                    • {location}: {(amount as number).toLocaleString()}g
                  </p>
                ))}
              </div>
            )}

            {topCrops.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-700">Top Crops:</p>
                {topCrops.map(([crop, amount], index) => (
                  <p key={index} className="text-xs text-gray-600">
                    • {crop}: {(amount as number).toLocaleString()}g
                  </p>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-500">{data.details.length} withdrawal transactions</p>
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
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1 text-center sm:text-left">
            <CardTitle>Withdrawal Trend Chart</CardTitle>
            <CardDescription>Loading chart...</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="h-[400px] w-full flex items-center justify-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Withdrawal Trend Chart</CardTitle>
          <CardDescription>
            Monthly withdrawal patterns and trends by inventory type
            {locationFilter !== "all" && ` - ${locationFilter} Location`}
          </CardDescription>
        </div>
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-[180px] rounded-lg sm:ml-auto" aria-label="Filter by location">
            <SelectValue placeholder="Filter by location" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all" className="rounded-lg">
              All Locations
            </SelectItem>
            {allLocations.map((location) => (
              <SelectItem key={location} value={location} className="rounded-lg">
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[400px] w-full">
          <LineChart
            data={processedData}
            margin={{
              left: 12,
              right: 30,
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
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value}g`} />
            <ChartTooltip content={<CustomTooltip />} />
            <ChartLegend
              content={<ChartLegendContent />}
              wrapperStyle={{
                padding: "8px 0",
                overflow: "hidden",
                width: "100%",
                maxWidth: "100%",
              }}
            />
            <Line
              dataKey="totalWithdrawal"
              name="Total Withdrawal"
              type="monotone"
              stroke={colors[0]}
              strokeWidth={3}
              dot={{ r: 5, strokeWidth: 2, fill: colors[0] }}
              activeDot={{ r: 7, strokeWidth: 2 }}
            />
            <Line
              dataKey="seedStorage"
              name="Seed Storage"
              type="monotone"
              stroke={colors[1]}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2, fill: colors[1] }}
              activeDot={{ r: 6, strokeWidth: 2 }}
              strokeDasharray="5 5"
            />
            <Line
              dataKey="plantingMaterials"
              name="Planting Materials"
              type="monotone"
              stroke={colors[2]}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2, fill: colors[2] }}
              activeDot={{ r: 6, strokeWidth: 2 }}
              strokeDasharray="3 3"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Total withdrawals: {totalWithdrawals.toLocaleString()}g across all months <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing withdrawal trends over {processedData.length} months with breakdown by inventory type
        </div>
      </CardFooter>
    </Card>
  )
}
