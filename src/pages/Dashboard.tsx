import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import KeyMetricsCards from '@/components/dashboard/KeyMetricsCards';
import StockBySeedClassPieChart from '@/components/dashboard/StockBySeedClassPieChart';
import StockByLocationBarChart from '@/components/dashboard/StockByLocationBarChart';
import WithdrawalTrendLineChart from '@/components/dashboard/WithdrawalTrendLineChart';
import SummaryTable from '@/components/dashboard/SummaryTable';

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
      <div className="space-y-4 sm:space-y-6">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Dashboard and Summary Reports</h1>
          <p className="text-sm text-muted-foreground">Overview of seed inventory and system status</p>
        </div>
  
        <AlertsPanel alerts={mockAlerts} />
  
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <KeyMetricsCards metrics={mockMetrics} />
        </div>
  
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <StockBySeedClassPieChart />
          <StockByLocationBarChart />
        </div>
  
        <WithdrawalTrendLineChart data={mockWithdrawalData} />
  
        <SummaryTable data={mockSummaryData} title="Inventory Summary" />
      </div>
    )
  }