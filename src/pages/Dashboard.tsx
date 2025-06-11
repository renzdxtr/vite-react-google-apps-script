"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAllSeedDetails } from "@/hooks/useSeedDetails"
import { useAllWithdrawalDetails } from "@/hooks/useWithdrawalDetails"

import DashboardLayout from "@/components/dashboard/DashboardLayout"
import AlertsPanel from "@/components/dashboard/AlertsPanel"
import KeyMetricsCards from "@/components/dashboard/KeyMetricsCards"
import StockBySeedClassPieChart from "@/components/dashboard/StockBySeedClassPieChart"
import StockByLocationBarChart from "@/components/dashboard/StockByLocationBarChart"
import SummaryTable from "@/components/dashboard/SummaryTable"
import WithdrawalTrendLineChart from "@/components/dashboard/WithdrawalTrendLineChart"
import WithdrawalAnalysisChart from "@/components/dashboard/WithdrawalAnalysisChart"
import WithdrawalByCropChart from "@/components/dashboard/WithdrawalByCropChart"
import ExportReporting from "@/components/dashboard/ExportReporting"
import ReleaseLogTable from "@/components/dashboard/ReleaseLogTable"

// Import sample data and calculation functions
//import { SAMPLE_DATA_INVENTORY, SAMPLE_WITHDRAWAL } from "@/lib/constants"
import {
    joinInventoryWithWithdrawals,
    calculateTodaysWithdrawalsByType,
    calculateCurrentStock,
    calculateLowStockAlerts,
    calculateInventoryStatus,
    generateSystemAlerts,
    processReleaseLogData,
} from "@/lib/data-calculations"

export default function DashboardPage() {
    // Use the hooks to fetch data
    const { seedDetails: inventoryData, isLoading: isLoadingInventory } = useAllSeedDetails();
    const { withdrawalDetails: withdrawalData, isLoading: isLoadingWithdrawals } = useAllWithdrawalDetails();

    // Only process data when both are loaded
    const isLoading = isLoadingInventory || isLoadingWithdrawals;

    // Process the data when available
    const joinedData = isLoading ? [] : joinInventoryWithWithdrawals(inventoryData, withdrawalData);
    const releaseLogData = isLoading ? [] : processReleaseLogData(withdrawalData, inventoryData);

    // Calculate metrics using actual data
    const todaysWithdrawals = isLoading ? { total: 0, seedStorage: 0, plantingMaterials: 0 } :
        calculateTodaysWithdrawalsByType(joinedData);
    const currentStock = isLoading ? 0 : calculateCurrentStock(joinedData);
    const lowStockAlerts = isLoading ? 0 : calculateLowStockAlerts(joinedData);

    const metrics = {
        todayWithdrawals: todaysWithdrawals,
        currentStock: currentStock,
        lowStockAlerts: lowStockAlerts,
    }

    // Generate alerts from actual data
    const alerts = isLoading ? [] : generateSystemAlerts(joinedData);

    // Convert joined data to summary table format
    const summaryData = isLoading ? [] : joinedData.map((item, index) => ({
        id: index + 1,
        optionValue: `${item.CROP} - ${item.VARIETY}`,
        remainingVolume: item.remainingVolume,
        withdrawnYTD: item.totalWithdrawn,
        status: calculateInventoryStatus(item),
        storedDate: item.STORED_DATE,
        harvestDate: item.HARVEST_DATE,
        lastWithdrawal: item.lastWithdrawal?.TIMESTAMP || "No withdrawals",
        seedClass: item.SEED_CLASS,
        crop: item.CROP,
        INVENTORY: item.INVENTORY
    }));

    return (
        <DashboardLayout title="Dashboard and Summary Reports" description="Overview of seed inventory and system status">
            {/* Show loading state if data is still loading */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <p>Loading dashboard data...</p>
                </div>
            ) : (
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
                                <div data-chart-id="stockByLocation" className="min-w-0">
                                    <StockByLocationBarChart data={joinedData} />
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
                                <div data-chart-id="withdrawalAnalysis" className="min-w-0">
                                    <WithdrawalAnalysisChart data={withdrawalData} />
                                </div>
                                <div data-chart-id="withdrawalTrend" className="min-w-0">
                                    <WithdrawalTrendLineChart data={withdrawalData} />
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
                                withdrawalData={withdrawalData}
                                metrics={metrics}
                                alerts={alerts}
                            />
                        </div>
                    </TabsContent>

                </Tabs>
            )}
        </DashboardLayout>
    )
}