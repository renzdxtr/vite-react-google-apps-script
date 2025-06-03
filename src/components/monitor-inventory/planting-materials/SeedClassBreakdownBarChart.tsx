"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { TrendingUp } from "lucide-react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip } from "@/components/ui/chart"
import { PLANTING_MATERIALS } from "@/lib/constants";

// Color palette for different locations
const locationColors = {
  Conventional: "#4f46e5", // Indigo
  Organic: "#10b981", // Emerald
  "Plant Nursery": "#f59e0b", // Amber
}

export default function PM_SeedClassBreakdownChart() {
  const [mounted, setMounted] = React.useState(false)

  // Ensure component is mounted before rendering chart
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Process data to group by seed class and location
  const chartData = React.useMemo(() => {
    // Get unique locations and seed classes
    const locations = [...new Set(PLANTING_MATERIALS.map((item) => item.LOCATION))]
    const seedClasses = [...new Set(PLANTING_MATERIALS.map((item) => item.SEED_CLASS))]

    // Create data structure for chart
    const processedData = seedClasses.map((seedClass) => {
      const classData: any = {
        seedClass,
        totalVolume: 0,
        details: {},
      }

      // Initialize all locations to 0
      locations.forEach((location) => {
        classData[location] = 0
        classData.details[location] = []
      })

      // Sum volumes by location for this seed class
      PLANTING_MATERIALS.forEach((item) => {
        if (item.SEED_CLASS === seedClass) {
          classData[item.LOCATION] += item.VOLUME
          classData.totalVolume += item.VOLUME
          classData.details[item.LOCATION].push({
            crop: item.CROP,
            variety: item.VARIETY,
            volume: item.VOLUME,
            storedDate: item.STORED_DATE,
          })
        }
      })

      return classData
    })

    // Sort by total volume descending
    return processedData.sort((a, b) => b.totalVolume - a.totalVolume)
  }, [])

  // Get unique locations for chart config
  const locations = React.useMemo(() => {
    return [...new Set(PLANTING_MATERIALS.map((item) => item.LOCATION))]
  }, [])

  // Generate chart config
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {}
    locations.forEach((location) => {
      config[location] = {
        label: location,
        color: locationColors[location as keyof typeof locationColors] || "#6b7280",
      }
    })
    return config
  }, [locations])

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const activeLocations = payload.filter((p: any) => p.value > 0)

      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg max-w-sm">
          <p className="font-semibold text-sm mb-2">{label}</p>
          <p className="text-xs text-gray-600 mb-2">Total Quantity: {data.totalVolume}pcs</p>
          <div className="space-y-2">
            {activeLocations.map((location: any, index: number) => {
              const locationDetails = data.details[location.dataKey] || []
              return (
                <div key={index} className="text-xs">
                  <div className="flex items-center gap-1 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: location.color }} />
                    <span className="font-medium">{location.dataKey}</span>
                    <span className="text-gray-600">({location.value}pcs)</span>
                  </div>
                  {locationDetails.length > 0 && (
                    <div className="ml-3 text-gray-600">
                      <p className="font-medium">Varieties:</p>
                      {locationDetails.slice(0, 3).map((detail: any, idx: number) => (
                        <p key={idx}>
                          • {detail.crop} - {detail.variety} ({detail.volume}pcs)
                        </p>
                      ))}
                      {locationDetails.length > 3 && (
                        <p className="text-gray-400">...and {locationDetails.length - 3} more</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )
    }
    return null
  }

  // Calculate total volume across all seed classes
  const totalVolume = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.totalVolume, 0)
  }, [chartData])

  // Don't render chart until component is mounted
  if (!mounted) {
    return (
      <Card className="w-full">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1 text-center sm:text-left">
            <CardTitle>Materials' Class Breakdown by Location</CardTitle>
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
          <CardTitle>Materials' Class Breakdown by Location</CardTitle>
          <CardDescription>Quantity stored by materials' class across different storage locations</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[400px] w-full">
          <BarChart
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="seedClass"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value}pcs`} />
            <ChartTooltip content={<CustomTooltip />} />
            <ChartLegend
              content={<ChartLegendContent className="flex flex-wrap justify-center gap-2" />}
              wrapperStyle={{
                padding: "8px 0",
                overflow: "hidden",
                width: "100%",
                maxWidth: "100%",
              }}
            />
            {locations.map((location, index) => (
              <Bar
                key={location}
                dataKey={location}
                fill={locationColors[location as keyof typeof locationColors] || "#6b7280"}
                stackId="a"
                radius={index === locations.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Total quantity: {totalVolume.toLocaleString()}pcs across {chartData.length} material classes{" "}
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Based on current materials' storage records from {locations.length} locations
        </div>
      </CardFooter>
    </Card>
  )
}
