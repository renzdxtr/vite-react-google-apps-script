"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Color palette for different crops
const colors = ["#4CAF50", "#388E3C", "#FF9800", "#F57C00", "#1976D2", "#1565C0", "#9C27B0", "#7B1FA2"]

interface WithdrawalByCropChartProps {
  data: any[] // Joined data
}

export default function WithdrawalByCropChart({ data }: WithdrawalByCropChartProps) {
  const [inventoryFilter, setInventoryFilter] = React.useState("all")
  const [mounted, setMounted] = React.useState(false)

  // Ensure component is mounted before rendering chart
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Process data to group by crop and calculate withdrawals
  const processedData = React.useMemo(() => {
    // Filter by inventory type if selected
    let filteredData = data
    if (inventoryFilter !== "all") {
      filteredData = data.filter((item) => item.INVENTORY === inventoryFilter)
    }

    // Group by crop
    const cropData = filteredData.reduce((acc: any, item) => {
      const crop = item.CROP

      if (!acc[crop]) {
        acc[crop] = {
          crop,
          totalWithdrawn: 0,
          remainingVolume: 0,
          originalVolume: 0,
          withdrawalCount: 0,
          varieties: {},
        }
      }

      // Add to crop totals
      acc[crop].totalWithdrawn += item.totalWithdrawn || 0
      acc[crop].remainingVolume += item.remainingVolume || 0
      acc[crop].originalVolume += item.VOLUME || 0
      acc[crop].withdrawalCount += item.withdrawals?.length || 0

      // Track by variety
      const variety = item.VARIETY
      if (!acc[crop].varieties[variety]) {
        acc[crop].varieties[variety] = {
          variety,
          totalWithdrawn: 0,
          remainingVolume: 0,
          originalVolume: 0,
          withdrawalCount: 0,
          withdrawals: [],
        }
      }

      acc[crop].varieties[variety].totalWithdrawn += item.totalWithdrawn || 0
      acc[crop].varieties[variety].remainingVolume += item.remainingVolume || 0
      acc[crop].varieties[variety].originalVolume += item.VOLUME || 0
      acc[crop].varieties[variety].withdrawalCount += item.withdrawals?.length || 0
      acc[crop].varieties[variety].withdrawals.push(...(item.withdrawals || []))

      return acc
    }, {})

    // Convert to array and sort by total withdrawn (descending)
    return Object.values(cropData)
      .map((item: any, index: number) => ({
        ...item,
        fill: colors[index % colors.length],
      }))
      .sort((a: any, b: any) => b.totalWithdrawn - a.totalWithdrawn)
  }, [data, inventoryFilter])

  // Generate chart config
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      totalWithdrawn: {
        label: "Total Withdrawn",
        color: "#4CAF50",
      },
      remainingVolume: {
        label: "Remaining Volume",
        color: "#1976D2",
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
      // Replace selectedInventory with inventoryFilter
      const unit = getUnitByInventoryType(inventoryFilter);
      // const unit = getUnitByInventoryType(inventoryFilter); (this commented line was correct)
      
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
            <CardTitle className="text-lg">Withdrawal by Crop</CardTitle>
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
          <CardTitle className="text-lg">Withdrawal by Crop</CardTitle>
          <CardDescription className="text-sm">
            Total withdrawals by crop type
            {inventoryFilter !== "all" && ` - ${inventoryFilter}`}
          </CardDescription>
        </div>
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
      </CardHeader>
      <CardContent className="p-4">
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] sm:h-[400px] w-full">
          <BarChart
            data={processedData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 70,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="crop"
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={70}
              interval={0}
              fontSize={12}
            />
            // Update the YAxis tickFormatter
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              // Replace selectedInventory with inventoryFilter
              tickFormatter={(value) => `${value}${getUnitByInventoryType(inventoryFilter)}`}
              fontSize={12}
            />
            <ChartTooltip content={<CustomTooltip />} />
            <Bar dataKey="totalWithdrawn" name="Total Withdrawn" fill="#4CAF50" radius={[4, 4, 0, 0]} barSize={30} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
