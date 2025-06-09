import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAllSeedDetails } from "@/hooks/useSeedDetails";

import SeedStorageBarChart from "@/components/monitor-inventory/seed-storage/SeedStorageBarChart";
import InventoryLocationChart from "@/components/monitor-inventory/seed-storage/InventoryByLocationPieChart";
import InventoryProgramChart from "@/components/monitor-inventory/seed-storage/InventoryByProgramPieChart";
import SeedClassBreakdownChart from "@/components/monitor-inventory/seed-storage/SeedClassBreakdownBarChart";
import GerminationRateChart from "@/components/monitor-inventory/seed-storage/CropGerminationRateByLotMultipleLineChart";

import SeedInventoryTable from "@/components/dashboard/SeedInventoryTable";

import PM_SeedStorageBarChart from "@/components/monitor-inventory/planting-materials/SeedStorageBarChart";
import PM_InventoryLocationChart from "@/components/monitor-inventory/planting-materials/InventoryByLocationPieChart";
import PM_InventoryProgramChart from "@/components/monitor-inventory/planting-materials/InventoryByProgramPieChart";
import PM_SeedClassBreakdownChart from "@/components/monitor-inventory/planting-materials/SeedClassBreakdownBarChart";
import PM_SeedInventoryTable from "@/components/monitor-inventory/planting-materials/SeedInventoryTable";


export default function MonitorInventoryPage() {
  const { seedDetails, isLoading, error } = useAllSeedDetails();

  // Filter data for each inventory type
  const seedStorageData = seedDetails.filter(item => item.INVENTORY === "Seed Storage");
  const plantingMaterialsData = seedDetails.filter(item => item.INVENTORY === "Planting Materials");

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">
    <p>Loading inventory data...</p>
  </div>
  }

  if (error) {
    return <div className="container mx-auto py-4 text-red-500">Error loading data: {error}</div>;
  }

  return (
    <div className="container mx-auto py-4 max-w-3xl">
      <div className="space-y-4">
        <Tabs defaultValue="seed-storage">
          <TabsList>
            <TabsTrigger value="seed-storage">Seed Storage</TabsTrigger>
            <TabsTrigger value="planting-materials">Planting Materials</TabsTrigger>
          </TabsList>
          
          {/* Seed Storage Tab */}
          <TabsContent value="seed-storage">
            <div className="max-w-full overflow-x-auto">
                <div className="grid gap-4">
                    <SeedStorageBarChart data={seedStorageData} />
                    <InventoryLocationChart data={seedStorageData} />
                    <InventoryProgramChart data={seedStorageData} />
                    <SeedClassBreakdownChart data={seedStorageData} />
                    <GerminationRateChart data={seedStorageData} />
                </div>

                <div className="mt-4">
                    <SeedInventoryTable data={seedStorageData} />
                </div>
            </div>
          </TabsContent>
          
          {/* Planting Materials Tab */}
          <TabsContent value="planting-materials">
            <div className="max-w-full overflow-x-auto">
                <div className="grid gap-4">
                    <PM_SeedStorageBarChart data={plantingMaterialsData} />
                    <PM_InventoryLocationChart data={plantingMaterialsData} />
                    <PM_InventoryProgramChart data={plantingMaterialsData} />
                    <PM_SeedClassBreakdownChart data={plantingMaterialsData} />
                </div>

                <div className="mt-4">
                    <SeedInventoryTable data={plantingMaterialsData} />
                </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}