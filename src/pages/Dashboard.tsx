import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllSeedDetails } from "@/hooks/useSeedDetails";

import AlertsPanel from '@/components/dashboard/AlertsPanel';
import KeyMetricsCards from '@/components/dashboard/KeyMetricsCards';
import StockBySeedClassPieChart from '@/components/dashboard/StockBySeedClassPieChart';
import StockByLocationBarChart from '@/components/dashboard/StockByLocationBarChart';
import WithdrawalTrendLineChart from '@/components/dashboard/WithdrawalTrendLineChart';
import SummaryTable from '@/components/dashboard/SummaryTable';

import { SAMPLE_DATA_INVENTORY } from "@/lib/constants";
import { SAMPLE_WITHDRAWAL } from "@/lib/constants";

const mockMetrics = {
    todayWithdrawals: {
        seedStorage: { value: 10000, unit: "g" },
        plantingMaterials: { value: 50, unit: "pcs" },
    },
    currentStock: {
        seedStorage: { value: 35000, unit: "g" },
        plantingMaterials: { value: 900, unit: "pcs" },
    },
    lowStockAlerts: {
        seedStorage: { value: 0, unit: "" },
        plantingMaterials: { value: 0, unit: "" },
    },
}
  
const mockWithdrawalData = [
    { date: "May 2025", volume: 6035 },
    { date: "Jun 2025", volume: 1010 },
]
  
const mockSummaryData = [
    { id: 1, optionValue: "ABC-123", remainingVolume: 500, withdrawnYTD: 100, status: "OK" },
    { id: 2, optionValue: "XYZ-456", remainingVolume: 50, withdrawnYTD: 200, status: "Low" },
    { id: 3, optionValue: "PQR-789", remainingVolume: 1000, withdrawnYTD: 50, status: "OK" },
    { id: 4, optionValue: "LMN-012", remainingVolume: 20, withdrawnYTD: 300, status: "Low" },
]
  
const mockAlerts = [
    { type: "low-stock", message: "Maize Variety A below threshold" },
    { type: "inventory-check", message: "Warehouse B requires inventory check" },
    { type: "sync", message: "Pending sync actions exceeding limit" },
]
  
export default function Dashboard() {

    return (
        <div className="container mx-auto py-4 max-w-3xl">
            <div className="space-y-1 sm:space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Dashboard and Summary Reports</h1>
                <p className="text-sm text-muted-foreground">Overview of seed inventory and system status</p>
            </div>
          <div className="space-y-4">
            <Tabs defaultValue="seed-storage">
              <TabsList>
                <TabsTrigger value="seed-storage">Seed Storage</TabsTrigger>
                <TabsTrigger value="planting-materials">Planting Materials</TabsTrigger>
              </TabsList>
              
              {/* Seed Storage Tab */}
              <TabsContent value="seed-storage">
                <AlertsPanel alerts={mockAlerts} />
                <div className="max-w-full overflow-x-auto">
                    <div className="grid gap-4">
                        <KeyMetricsCards metrics={mockMetrics} />
                        <StockBySeedClassPieChart />
                        <StockByLocationBarChart />
                        <WithdrawalTrendLineChart data={mockWithdrawalData} />
                    </div>
    
                    <div className="mt-4">
                    <SummaryTable data={mockSummaryData} title="Inventory Summary" />
                    </div>
                </div>
              </TabsContent>
              
              {/* Planting Materials Tab */}
              <TabsContent value="planting-materials">

              </TabsContent>
            </Tabs>
          </div>
        </div>
      );
}