"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import DashboardLayout from "@/components/dashboard/DashboardLayout"
import AlertsPanel from "@/components/dashboard/AlertsPanel"
import KeyMetricsCards from "@/components/dashboard/KeyMetricsCards"
import StockBySeedClassPieChart from "@/components/dashboard/StockBySeedClassPieChart"
import StockByLocationBarChart from "@/components/dashboard/StockByLocationBarChart"
import SummaryTable from "@/components/dashboard/SummaryTable"
// import SeedInventoryTable from "@/components/SeedInventoryTable"
import WithdrawalTrendLineChart from "@/components/dashboard/WithdrawalTrendLineChart"
import WithdrawalAnalysisChart from "@/components/dashboard/WithdrawalAnalysisChart"
import WithdrawalByCropChart from "@/components/dashboard/WithdrawalByCropChart"
import ExportReporting from "@/components/dashboard/ExportReporting"
import ReleaseLogTable from "@/components/dashboard/ReleaseLogTable"

// Import sample data and calculation functions
import { SAMPLE_DATA_INVENTORY, SAMPLE_WITHDRAWAL } from "@/lib/constants"
import {
    joinInventoryWithWithdrawals,
    calculateTodaysWithdrawalsByType,
    calculateCurrentStock,
    calculateLowStockAlerts,
    calculateInventoryStatus,
    generateSystemAlerts,
    processReleaseLogData,
} from "@/lib/data-calculations"

// Process the data
const joinedData = joinInventoryWithWithdrawals(SAMPLE_DATA_INVENTORY, SAMPLE_WITHDRAWAL)
const releaseLogData = processReleaseLogData(SAMPLE_WITHDRAWAL, SAMPLE_DATA_INVENTORY)

// Calculate metrics using actual data
const todaysWithdrawals = calculateTodaysWithdrawalsByType(joinedData)
const currentStock = calculateCurrentStock(joinedData)
const lowStockAlerts = calculateLowStockAlerts(joinedData)

const metrics = {
    todayWithdrawals: todaysWithdrawals,
    currentStock: currentStock,
    lowStockAlerts: lowStockAlerts,
}

// Generate alerts from actual data
const alerts = generateSystemAlerts(joinedData)

// Convert joined data to summary table format
const summaryData = joinedData.map((item, index) => ({
    id: index + 1,
    optionValue: `${item.CROP} - ${item.VARIETY}`,
    remainingVolume: item.remainingVolume,
    withdrawnYTD: item.totalWithdrawn,
    status: calculateInventoryStatus(item),
    dateCreated: item.STORED_DATE,
    expiryDate: item.HARVEST_DATE,
    lastWithdrawal: item.lastWithdrawal?.TIMESTAMP || "No withdrawals",
    riskLevel: item.SEED_CLASS,
}))

export default function DashboardPage() {
    return (
        <DashboardLayout title="Dashboard and Summary Reports" description="Overview of seed inventory and system status">
            <Tabs defaultValue="overview">
                <div className="w-full mt-4 mb-4">
                    <TabsList className="w-full p-1 h-auto grid grid-cols-2 gap-1 md:flex md:overflow-x-auto md:h-10">
                        <TabsTrigger className="text-xs sm:text-sm whitespace-nowrap h-auto py-2" value="overview">
                            Overview
                        </TabsTrigger>
                        <TabsTrigger className="text-xs sm:text-sm whitespace-nowrap h-auto py-2" value="analytics">
                            Analytics
                        </TabsTrigger>
                        <TabsTrigger className="text-xs sm:text-sm whitespace-nowrap h-auto py-2" value="inventory">
                            Inventory
                        </TabsTrigger>
                        <TabsTrigger className="text-xs sm:text-sm whitespace-nowrap h-auto py-2" value="release-log">
                            Release Log
                        </TabsTrigger>
                        <TabsTrigger className="text-xs sm:text-sm whitespace-nowrap h-auto py-2 col-span-2 md:col-span-1" value="export">
                            Export & Reporting
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Overview Tab */}
                <TabsContent value="overview">
                    <AlertsPanel alerts={alerts} />
                    <div className="max-w-full overflow-x-auto">
                        <div className="grid gap-4">
                            <KeyMetricsCards metrics={metrics} />
                            <div data-chart-id="stockBySeedClass" className="min-w-0">
                                <StockBySeedClassPieChart data={joinedData} />
                            </div>
                            <div data-chart-id="withdrawalTrend" className="min-w-0">
                                <WithdrawalTrendLineChart data={SAMPLE_WITHDRAWAL} />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics">
                    <div className="max-w-full overflow-x-auto">
                        <div className="grid gap-4">
                            <div data-chart-id="withdrawalByCrop" className="min-w-0">
                                <WithdrawalByCropChart data={joinedData} />
                            </div>
                            <div data-chart-id="stockByLocation" className="min-w-0">
                                <StockByLocationBarChart data={joinedData} />
                            </div>
                            <div data-chart-id="withdrawalAnalysis" className="min-w-0">
                                <WithdrawalAnalysisChart data={SAMPLE_WITHDRAWAL} />
                            </div>
                            <div data-chart-id="withdrawalTrend" className="min-w-0">
                                <WithdrawalTrendLineChart data={SAMPLE_WITHDRAWAL} />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Inventory Tab */}
                <TabsContent value="inventory">
                    <div className="max-w-full overflow-x-auto space-y-6">
                        {/* Summary Table */}
                        <div className="min-w-0">
                            <SummaryTable data={summaryData} title="Inventory Summary" />
                        </div>
                    </div>
                </TabsContent>

                {/* Release Log Tab */}
                <TabsContent value="release-log">
                    <div className="max-w-full overflow-x-auto">
                        <div className="min-w-0">
                            <ReleaseLogTable data={releaseLogData} />
                        </div>
                    </div>
                </TabsContent>

                {/* Export & Reporting Tab */}
                <TabsContent value="export">
                    <div className="min-w-0">
                        <ExportReporting
                            joinedData={joinedData}
                            withdrawalData={SAMPLE_WITHDRAWAL}
                            metrics={metrics}
                            alerts={alerts}
                        />
                    </div>
                </TabsContent>

            </Tabs>
        </DashboardLayout>
    )
}