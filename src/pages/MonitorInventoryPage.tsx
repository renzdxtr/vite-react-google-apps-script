import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import SeedStorageBarChart from "@/components/monitor-inventory/seed-storage/SeedStorageBarChart";
import InventoryLocationChart from "@/components/monitor-inventory/seed-storage/InventoryByLocationPieChart";
import InventoryProgramChart from "@/components/monitor-inventory/seed-storage/InventoryByProgramPieChart";
import SeedClassBreakdownChart from "@/components/monitor-inventory/seed-storage/SeedClassBreakdownBarChart";

export default function MonitorInventoryPage() {
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
            <div className="grid gap-4">
              <SeedStorageBarChart />
              <InventoryLocationChart />
              <InventoryProgramChart />
              <SeedClassBreakdownChart />
              {/* Additional charts will be added here */}
            </div>
          </TabsContent>
          
          {/* Planting Materials Tab */}
          <TabsContent value="planting-materials">
            <div className="grid gap-4">
              <Card className="shadow-md p-4 space-y-4">
                <CardHeader className="p-0">
                  <CardTitle>Planting Materials Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Skeleton className="h-[400px] w-full" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}