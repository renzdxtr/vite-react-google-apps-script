"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SAMPLE_DATA_INVENTORY } from "@/lib/constants";

// Color palette for different crops
const colors = ["#4CAF50", "#388E3C", "#FF9800", "#F57C00", "#1976D2", "#1565C0"]

export default function StockByLocationBarChart() {
  const [dateFilter, setDateFilter] = React.useState("all")
  const [mounted, setMounted] = React.useState(false)

  // Ensure component is mounted before rendering chart
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Get unique crops for chart config
  const allCrops = React.useMemo(() => {
    return [...new Set(SAMPLE_DATA_INVENTORY.map((item) => item.CROP))]
  }, [])

  // Process data to group by location and stack by crop
  const processedData = React.useMemo(() => {
    // Filter data based on stored date (monthly)
    let filteredData = SAMPLE_DATA_INVENTORY

    if (dateFilter !== "all") {
      const [year, month] = dateFilter.split("-")
      filteredData = SAMPLE_DATA_INVENTORY.filter((item) => {
        const storedDate = new Date(item.STORED_DATE)
        const itemYear = storedDate.getFullYear().toString()
        const itemMonth = (storedDate.getMonth() + 1).toString().padStart(2, "0")
        return itemYear === year && itemMonth === month
      })
    }

    // Group by location and organize by crop
    const locationData = filteredData.reduce(
      (acc, item) => {
        const location = item.LOCATION
        if (!acc[location]) {
          acc[location] = {
            location,
            totalVolume: 0,
            cropDetails: {},
          }
          // Initialize all crops to 0
          allCrops.forEach((crop) => {
            acc[location][crop] = 0
          })
        }
        acc[location][item.CROP] = (acc[location][item.CROP] || 0) + item.VOLUME
        acc[location].totalVolume += item.VOLUME
        if (!acc[location].cropDetails[item.CROP]) {
          acc[location].cropDetails[item.CROP] = []
        }
        acc[location].cropDetails[item.CROP].push({
          variety: item.VARIETY,
          volume: item.VOLUME,
          storedDate: item.STORED_DATE,
          seedClass: item.SEED_CLASS,
        })
        return acc
      },
      {} as Record<string, any>,
    )

    return Object.values(locationData).sort((a: any, b: any) => b.totalVolume - a.totalVolume)
  }, [dateFilter, allCrops])

  // Generate chart config
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {}
    allCrops.forEach((crop, index) => {
      config[crop] = {
        label: crop,
        color: colors[index % colors.length],
      }
    })
    return config
  }, [allCrops])

  // Get unique months for filter options
  const availableMonths = React.useMemo(() => {
    const months = new Set<string>()
    SAMPLE_DATA_INVENTORY.forEach((item) => {
      const date = new Date(item.STORED_DATE)
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      months.add(`${year}-${month}`)
    })
    return Array.from(months).sort()
  }, [])

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const activeCrops = payload.filter((p: any) => p.value > 0)

      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg max-w-xs">
          <p className="font-semibold text-sm mb-2">{label}</p>
          <p className="text-xs text-gray-600 mb-2">Total Volume: {data.totalVolume}g</p>
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-700">Crops:</p>
            {activeCrops.map((crop: any, index: number) => {
              const cropDetails = data.cropDetails[crop.dataKey] || []
              return (
                <div key={index} className="text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: crop.color }} />
                    <span className="font-medium">{crop.dataKey}</span>
                  </div>
                  <div className="ml-3 text-gray-600">
                    <p>Volume: {crop.value}g</p>
                    {cropDetails.length > 0 && (
                      <>
                        <p className="font-medium mt-1">Varieties:</p>
                        {cropDetails.slice(0, 2).map((detail: any, idx: number) => (
                          <p key={idx}>
                            • {detail.variety} ({detail.volume}g)
                          </p>
                        ))}
                        {cropDetails.length > 2 && (
                          <p className="text-gray-400">...and {cropDetails.length - 2} more</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }
    return null
  }

  // Format month for display
  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split("-")
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" })
  }

  // Don't render chart until component is mounted
  if (!mounted) {
    return (
      <Card className="w-full">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1 text-center sm:text-left">
            <CardTitle>Stock by Location</CardTitle>
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
          <CardTitle>Stock by Location</CardTitle>
          <CardDescription>
            Stacked seed volume by storage location and crop type
            {dateFilter !== "all" && ` - ${formatMonth(dateFilter)}`}
          </CardDescription>
        </div>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[180px] rounded-lg sm:ml-auto" aria-label="Filter by month">
            <SelectValue placeholder="Filter by month" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all" className="rounded-lg">
              All Months
            </SelectItem>
            {availableMonths.map((month) => (
              <SelectItem key={month} value={month} className="rounded-lg">
                {formatMonth(month)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[400px] w-full">
          <BarChart
            data={processedData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="location"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value}g`} />
            <ChartTooltip content={<CustomTooltip />} />
            <ChartLegend content={<ChartLegendContent />} />
            {allCrops.map((crop, index) => (
              <Bar
                key={crop}
                dataKey={crop}
                stackId="a"
                fill={colors[index % colors.length]}
                radius={index === allCrops.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
