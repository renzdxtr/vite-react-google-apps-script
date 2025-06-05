"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SeedStorageChartProps {
  data: any[];
}

// Color palette for different crops with distinct colors
const cropColors = {
  "Tomato": "#FF6B6B", // Red
  "Hot Pepper": "#FF8E53", // Orange
  "Mungbean": "#4ECDC4", // Teal
  "Okra": "#45B7D1", // Blue
  "Bush Sitao": "#96CEB4", // Light Green
  "Cowpea": "#FFEAA7", // Yellow
  "Eggplant": "#DDA0DD", // Plum
  "Sponge Gourd": "#98D8C8", // Mint
  "Pole Sitao": "#F7DC6F", // Light Yellow
  "Peanut": "#BB8FCE", // Light Purple
  "Soybean": "#85C1E9", // Light Blue
  "Winged Bean": "#F8C471", // Peach
  "Bottle Gourd": "#82E0AA", // Light Green
  "Corn": "#F1948A", // Light Red
}

export default function GerminationRateChart({ data } : SeedStorageChartProps) {
    const [lotFilter, setLotFilter] = React.useState("all")
    const [mounted, setMounted] = React.useState(false)
  
    // Ensure component is mounted before rendering chart
    React.useEffect(() => {
      setMounted(true)
    }, [])

    const data2 = data

    let filteredData = data2
  
    // Process data to create the chart structure with LOT_NUMBER on x-axis and CROP as series
    const { chartData, chartConfig } = React.useMemo(() => {
      // Filter data based on lot number if selected
  
      if (lotFilter !== "all") {
        filteredData = data2.filter((item) => item.LOT_NUMBER.toString() === lotFilter)
      }
  
      // Get unique crops and lot numbers from filtered data
      const crops = [...new Set(filteredData.map((item) => item.CROP))].sort()
      const lotNumbers = [...new Set(filteredData.map((item) => item.LOT_NUMBER))].sort()
  
      // Create chart data structure grouped by lot number
      const data = lotNumbers.map((lotNumber) => {
        const lotData: any = { lotNumber }
  
        // For each crop, find the germination rate for this lot number
        crops.forEach((crop) => {
          const item = filteredData.find((inv) => inv.CROP === crop && inv.LOT_NUMBER === lotNumber)
          if (item) {
            lotData[crop] = item.GERMINATION_RATE
          }
        })
  
        return lotData
      })
  
      // Create chart config with crops as series
      const config: ChartConfig = {}
      crops.forEach((crop) => {
        config[crop] = {
          label: crop,
          color: cropColors[crop] || "#8884d8",
        }
      })
  
      return { chartData: data, chartConfig: config }
    }, [lotFilter])
  
    // Get crop keys for rendering lines
    const cropKeys = React.useMemo(() => {
      return Object.keys(chartConfig)
    }, [chartConfig])
  
    // Get unique lot numbers for filter options
    const availableLots = React.useMemo(() => {
      const lots = [...new Set(data.map((item) => item.LOT_NUMBER))].sort()
      return lots
    }, [])
  
    // Custom tooltip component
    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white p-3 border rounded-lg shadow-lg max-w-xs">
            <p className="font-semibold text-sm mb-2">Lot {label}</p>
            <div className="space-y-1">
              {payload
                .filter((entry: any) => entry.value !== null)
                .sort((a: any, b: any) => (b.value as number) - (a.value as number))
                .map((entry: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-3 h-3 rounded-full border-2 border-white"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="font-medium">{entry.name}</span>
                    <span className="text-gray-600 ml-auto">{entry.value}%</span>
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
          <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
            <div className="grid flex-1 gap-1 text-center sm:text-left">
              <CardTitle>Germination Rate - Multiple Line Chart</CardTitle>
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
            <CardTitle>Germination Health</CardTitle>
            <CardDescription>
              Germination Rate by Lot Number and Crop
              {lotFilter !== "all" && ` - Lot ${lotFilter}`}
            </CardDescription>
          </div>
          <Select value={lotFilter} onValueChange={setLotFilter}>
            <SelectTrigger className="w-[180px] rounded-lg sm:ml-auto" aria-label="Filter by lot number">
              <SelectValue placeholder="Filter by lot" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="rounded-lg">
                All Lots
              </SelectItem>
              {availableLots.map((lot) => (
                <SelectItem key={lot} value={lot.toString()} className="rounded-lg">
                  Lot {lot}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer config={chartConfig} className="aspect-auto h-[400px] w-full">
            <LineChart data={chartData} margin={{ left: 12, right: 24, top: 12, bottom: 12 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="lotNumber"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `Lot ${value}`}
              />
              <YAxis
                domain={[60, 100]}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `${value}%`}
              />
              <ChartTooltip content={<CustomTooltip />} />
              <ChartLegend
                content={<ChartLegendContent className="flex flex-wrap justify-center gap-2" />}
                wrapperStyle={{
                  padding: "8px 15px",
                  overflow: "hidden",
                  width: "100%",
                  maxWidth: "100%",
                }}
              />
              {cropKeys.map((crop) => (
                <Line
                  key={crop}
                  dataKey={crop}
                  name={crop}
                  type="monotone"
                  stroke={cropColors[crop] || "#8884d8"}
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 2, fill: cropColors[crop] || "#8884d8" }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    )
}
