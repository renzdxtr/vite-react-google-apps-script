"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Label, Pie, PieChart } from "recharts"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart"

// Color palette for different seed classes
const colors = ["#4CAF50", "#388E3C", "#FF9800", "#F57C00", "#1976D2", "#1565C0"]

interface StockBySeedClassPieChartProps {
  data: any[]
}

export default function StockBySeedClassPieChart({ data }: StockBySeedClassPieChartProps) {
  const [mounted, setMounted] = React.useState(false)
  const [selectedInventoryType, setSelectedInventoryType] = React.useState<string | null>(null)

  // Ensure component is mounted before rendering chart
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Add this helper function
  const getUnitByInventoryType = (inventoryType: string) => {
    return inventoryType === "Planting Materials" ? "pcs" : "g";
  }
  
  // Get unique inventory types from data
  const inventoryTypes = React.useMemo(() => {
    const types = [...new Set(data.map(item => item.INVENTORY || "Seed Storage"))];
    // If we have multiple types and no selection yet, select the first one
    if (types.length > 0 && !selectedInventoryType) {
      setSelectedInventoryType(types[0]);
    }
    return types;
  }, [data, selectedInventoryType]);
  
  // Filter data by selected inventory type
  const filteredData = React.useMemo(() => {
    if (!selectedInventoryType) return data;
    return data.filter(item => (item.INVENTORY || "Seed Storage") === selectedInventoryType);
  }, [data, selectedInventoryType]);
  
  const unit = selectedInventoryType ? getUnitByInventoryType(selectedInventoryType) : "g";

  // Process data to group by seed class and sum volumes
  const chartData = React.useMemo(() => {
    const seedClassData = filteredData.reduce(
      (acc, item) => {
        const seedClass = item.SEED_CLASS
        if (!acc[seedClass]) {
          acc[seedClass] = {
            seedClass,
            volume: 0,
            count: 0,
            varieties: [],
          }
        }
        acc[seedClass].volume += item.VOLUME
        acc[seedClass].count += 1
        acc[seedClass].varieties.push({
          variety: item.VARIETY,
          crop: item.CROP,
          volume: item.VOLUME,
        })
        return acc
      },
      {} as Record<string, any>,
    )

    return Object.values(seedClassData)
      .map((item: any, index) => ({
        seedClass: item.seedClass,
        volume: item.volume,
        count: item.count,
        varieties: item.varieties,
        fill: colors[index % colors.length],
      }))
      .sort((a, b) => b.volume - a.volume)
  }, [filteredData])

  // Calculate total volume
  const totalVolume = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.volume, 0)
  }, [chartData])

  // Update the chartConfig
  const chartConfig = React.useMemo(() => {
    return {
      seedClass: {
        label: `Volume (${unit})`,
        color: "#0ea5e9",
      },
    }
  }, [unit])

  // Update the CustomTooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = ((data.volume / totalVolume) * 100).toFixed(1)

      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg max-w-xs">
          <p className="font-semibold text-sm mb-1">{data.seedClass}</p>
          <p className="text-sm text-blue-600 mb-1">Volume: {data.volume.toLocaleString()}{unit}</p>
          <p className="text-sm text-gray-600 mb-2">Percentage: {percentage}%</p>
          <p className="text-xs text-gray-600 mb-1">Items: {data.count}</p>
          <div className="mt-2">
            <p className="text-xs font-medium text-gray-700 mb-1">Top Varieties:</p>
            {data.varieties.slice(0, 3).map((variety: any, idx: number) => (
              <p key={idx} className="text-xs text-gray-600">
                • {variety.variety} ({variety.volume.toLocaleString()}{unit})
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
      <Card className="w-full">
        <CardHeader className="items-center pb-0">
          <CardTitle className="text-lg">Stock by Seed Class</CardTitle>
          <CardDescription className="text-sm">Loading chart...</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0 p-4">
          <div className="mx-auto aspect-square max-h-[200px] sm:max-h-[250px] flex items-center justify-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-lg">Stock by Seed Class</CardTitle>
        <CardDescription className="text-sm">
          Seed volume distribution by classification
          {inventoryTypes.length > 1 && (
            <div className="mt-2 flex justify-center gap-2">
              {inventoryTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedInventoryType(type)}
                  className={`px-2 py-1 text-xs rounded ${
                    selectedInventoryType === type 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {type} ({getUnitByInventoryType(type)})
                </button>
              ))}
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0 p-4">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[200px] sm:max-h-[250px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<CustomTooltip />} />
            <Pie data={chartData} dataKey="volume" nameKey="seedClass" innerRadius={50} strokeWidth={5}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    const cx = viewBox.cx;
                    const cy = viewBox.cy;
                    return (
                      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={cx} y={cy} className="fill-foreground text-2xl sm:text-3xl font-bold">
                          {totalVolume.toLocaleString()}
                        </tspan>
                        <tspan x={cx} y={(cy || 0) + 20} className="fill-muted-foreground text-sm">
                          Total {unit === "pcs" ? "Pieces" : "Grams"}
                        </tspan>
                      </text>
                    )
                  }
                  return null;
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm p-4">
        <div className="flex items-center gap-2 font-medium leading-none">
          {chartData.length} seed classes active <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground text-center">
          Showing total seed volume across all seed classifications
        </div>
      </CardFooter>
    </Card>
  )
}
