"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Label, Pie, PieChart } from "recharts"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { PLANTING_MATERIALS } from "@/lib/constants";

// Color palette for different locations
const colors = ["#4CAF50", "#388E3C", "#FF9800", "#F57C00", "#1976D2", "#1565C0"]

export default function PM_InventoryLocationChart() {
  const [mounted, setMounted] = React.useState(false)

  // Ensure component is mounted before rendering chart
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Process data to group by location and sum volumes
  const chartData = React.useMemo(() => {
    const locationData = PLANTING_MATERIALS.reduce(
      (acc, item) => {
        const location = item.LOCATION
        if (!acc[location]) {
          acc[location] = {
            location,
            volume: 0,
            count: 0,
            varieties: [],
          }
        }
        acc[location].volume += item.VOLUME
        acc[location].count += 1
        acc[location].varieties.push({
          variety: item.VARIETY,
          crop: item.CROP,
          volume: item.VOLUME,
        })
        return acc
      },
      {} as Record<string, any>,
    )

    return Object.values(locationData)
      .map((item: any, index) => ({
        location: item.location,
        volume: item.volume,
        count: item.count,
        varieties: item.varieties,
        fill: colors[index % colors.length],
      }))
      .sort((a, b) => b.volume - a.volume)
  }, [])

  // Generate chart config
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      volume: {
        label: "Pieces (pcs)",
      },
    }

    chartData.forEach((item, index) => {
      config[item.location.toLowerCase().replace(/\s+/g, "")] = {
        label: item.location,
        color: colors[index % colors.length],
      }
    })

    return config
  }, [chartData])

  // Calculate total volume
  const totalVolume = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.volume, 0)
  }, [chartData])

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = ((data.volume / totalVolume) * 100).toFixed(1)

      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg max-w-xs">
          <p className="font-semibold text-sm mb-1">{data.location}</p>
          <p className="text-sm text-blue-600 mb-1">Quantity: {data.volume.toLocaleString()}pcs</p>
          <p className="text-sm text-gray-600 mb-2">Percentage: {percentage}%</p>
          <p className="text-xs text-gray-600 mb-1">Items: {data.count}</p>
          <div className="mt-2">
            <p className="text-xs font-medium text-gray-700">Top Varieties:</p>
            {data.varieties.slice(0, 3).map((variety: any, index: number) => (
              <p key={index} className="text-xs text-gray-500">
                • {variety.crop} - {variety.variety} ({variety.volume}pcs)
              </p>
            ))}
            {data.varieties.length > 3 && (
              <p className="text-xs text-gray-400">...and {data.varieties.length - 3} more</p>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  // Don't render chart until component is mounted
  if (!mounted) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Inventory by Location</CardTitle>
          <CardDescription>Loading chart...</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="mx-auto aspect-square max-h-[250px] flex items-center justify-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Inventory by Location</CardTitle>
        <CardDescription>Planting Materials' quantity distribution by location</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<CustomTooltip />} />
            <Pie data={chartData} dataKey="volume" nameKey="location" innerRadius={60} strokeWidth={5}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                          {totalVolume.toLocaleString()}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
                          Total Quantity
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          {chartData.length} storage locations active <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">Showing total materials' quantity across all storage locations</div>
      </CardFooter>
    </Card>
  )
}
