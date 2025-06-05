import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingDown, Package, AlertTriangle } from "lucide-react"

interface Metric {
  value: number
  unit: string
}

interface KeyMetrics {
  todayWithdrawals: { seedStorage: Metric; plantingMaterials: Metric }
  currentStock: { seedStorage: Metric; plantingMaterials: Metric }
  lowStockAlerts: { seedStorage: Metric; plantingMaterials: Metric }
}

interface KeyMetricsCardsProps {
  metrics: KeyMetrics
}

export default function KeyMetricsCards({ metrics }: KeyMetricsCardsProps) {
  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Withdrawals</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Seed Storage</p>
              <p className="text-lg font-bold text-blue-600">
                {metrics.todayWithdrawals.seedStorage.value.toLocaleString()}{" "}
                {metrics.todayWithdrawals.seedStorage.unit}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Planting Materials</p>
              <p className="text-lg font-bold text-blue-600">
                {metrics.todayWithdrawals.plantingMaterials.value.toLocaleString()}{" "}
                {metrics.todayWithdrawals.plantingMaterials.unit}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Stock</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Seed Storage</p>
              <p className="text-lg font-bold text-green-600">
                {metrics.currentStock.seedStorage.value.toLocaleString()} {metrics.currentStock.seedStorage.unit}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Planting Materials</p>
              <p className="text-lg font-bold text-green-600">
                {metrics.currentStock.plantingMaterials.value.toLocaleString()}{" "}
                {metrics.currentStock.plantingMaterials.unit}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low-Stock Alerts</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Seed Storage</p>
              <p className="text-lg font-bold text-yellow-600">
                {metrics.lowStockAlerts.seedStorage.value} {metrics.lowStockAlerts.seedStorage.unit || "alerts"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Planting Materials</p>
              <p className="text-lg font-bold text-yellow-600">
                {metrics.lowStockAlerts.plantingMaterials.value}{" "}
                {metrics.lowStockAlerts.plantingMaterials.unit || "alerts"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
