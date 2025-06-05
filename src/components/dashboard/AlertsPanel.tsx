import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, AlertTriangle, Info } from "lucide-react"

interface AlertItem {
  type: string
  message: string
}

interface AlertsPanelProps {
  alerts: AlertItem[]
}

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case "low-stock":
        return <AlertCircle className="h-4 w-4" />
      case "inventory-check":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case "low-stock":
        return "text-red-600 border-red-200 bg-red-50"
      case "inventory-check":
        return "text-orange-600 border-orange-200 bg-orange-50"
      default:
        return "text-blue-600 border-blue-200 bg-blue-50"
    }
  }

  return (
    <Card className="w-full mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">System Alerts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert, index) => (
          <Alert key={index} className={`border ${getAlertColor(alert.type)}`}>
            {getAlertIcon(alert.type)}
            <AlertDescription className="ml-2">{alert.message}</AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  )
}
