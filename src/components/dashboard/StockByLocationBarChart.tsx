"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Color palette for different crops
const colors = ["#4CAF50", "#388E3C", "#FF9800", "#F57C00", "#1976D2", "#1565C0"]

interface StockByLocationBarChartProps {
  data: any[]
}

export default function StockByLocationBarChart({ data }: StockByLocationBarChartProps) {
  const [dateFilter, setDateFilter] = React.useState("all")
  const [mounted, setMounted] = React.useState(false)
  const [selectedInventoryType, setSelectedInventoryType] = React.useState<string | null>(null)

  // Ensure component is mounted before rendering chart
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Add this helper function
  const getUnitByInventoryType = (inventoryType: string) => {
    return inventoryType === "Planting Materials" ? "pc" : "g";
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
    
    // First filter by inventory type
    const inventoryFiltered = data.filter(item => (item.INVENTORY || "Seed Storage") === selectedInventoryType);
    
    // Then filter by location based on inventory type
    if (selectedInventoryType === "Planting Materials") {
      // For Planting Materials, only show Plant Nursery location
      return inventoryFiltered.filter(item => item.LOCATION === "Plant Nursery");
    } else if (selectedInventoryType === "Seed Storage") {
      // For Seed Storage, only show Organic and Conventional locations
      return inventoryFiltered.filter(item => 
        item.LOCATION === "Organic" || item.LOCATION === "Conventional"
      );
    }
    
    return inventoryFiltered;
  }, [data, selectedInventoryType]);
  
  const unit = selectedInventoryType ? getUnitByInventoryType(selectedInventoryType) : "g";

  // Get unique crops for chart config
  const allCrops = React.useMemo(() => {
    return [...new Set(filteredData.map((item) => item.CROP))]
  }, [filteredData])

  // Process data to group by location and stack by crop
  const processedData = React.useMemo(() => {
    // Filter data based on stored date (monthly)
    let dateFilteredData = filteredData

    if (dateFilter !== "all") {
      const [year, month] = dateFilter.split("-")
      dateFilteredData = filteredData.filter((item) => {
        const storedDate = new Date(item.STORED_DATE)
        const itemYear = storedDate.getFullYear().toString()
        const itemMonth = (storedDate.getMonth() + 1).toString().padStart(2, "0")
        return itemYear === year && itemMonth === month
      })
    }

    // Group by location and organize by crop
    const locationData = dateFilteredData.reduce(
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
  }, [dateFilter, allCrops, filteredData])

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
    filteredData.forEach((item) => {
      const date = new Date(item.STORED_DATE)
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      months.add(`${year}-${month}`)
    })
    return Array.from(months).sort()
  }, [filteredData])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const activeCrops = payload.filter((p: any) => p.value > 0)

      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg max-w-xs">
          <p className="font-semibold text-sm mb-2">{label}</p>
          <p className="text-xs text-gray-600 mb-2">Total Volume: {data.totalVolume}{unit}</p>
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
                    <p>Volume: {crop.value}{unit}</p>
                    {cropDetails.length > 0 && (
                      <>
                        <p className="font-medium mt-1">Varieties:</p>
                        {cropDetails.slice(0, 2).map((detail: any, idx: number) => (
                          <p key={idx}>
                            • {detail.variety} ({detail.volume}{unit})
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
        <CardHeader className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2 border-b py-4">
          <div className="flex-1">
            <CardTitle className="text-lg">Stock by Location</CardTitle>
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
          <CardTitle className="text-lg">Stock by Location</CardTitle>
          <CardDescription className="text-sm">
            Stacked seed volume by storage location and crop type
            {dateFilter !== "all" && ` - ${formatMonth(dateFilter)}`}
            {inventoryTypes.length > 1 && (
              <div className="mt-2 flex flex-wrap gap-2">
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
        </div>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-full sm:w-[180px] rounded-lg" aria-label="Filter by month">
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
      <CardContent className="p-4">
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] sm:h-[400px] w-full">
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
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value}${unit}`}
              fontSize={12}
            />
            <ChartTooltip content={<CustomTooltip />} />
            <ChartLegend 
              content={<ChartLegendContent className="flex flex-wrap justify-center gap-2" />} 
              wrapperStyle={{
                padding: "0px 15px",
                overflow: "hidden",
                width: "100%",
                maxWidth: "100%",
                fontSize: "10px"
              }}
            />
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
