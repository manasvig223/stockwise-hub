import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, FileText, Truck, ArrowRightLeft } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  totalProducts: number;
  lowStock: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  pendingTransfers: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStock: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    pendingTransfers: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Total products
      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      // Low stock items
      const { data: stockData } = await supabase
        .from("stock_locations")
        .select("quantity, products!inner(reorder_level)");

      const lowStockCount = stockData?.filter(
        (item: any) => item.quantity <= item.products.reorder_level
      ).length || 0;

      // Pending receipts
      const { count: receiptsCount } = await supabase
        .from("receipts")
        .select("*", { count: "exact", head: true })
        .in("status", ["draft", "waiting"]);

      // Pending deliveries
      const { count: deliveriesCount } = await supabase
        .from("delivery_orders")
        .select("*", { count: "exact", head: true })
        .in("status", ["draft", "waiting"]);

      // Pending transfers
      const { count: transfersCount } = await supabase
        .from("internal_transfers")
        .select("*", { count: "exact", head: true })
        .in("status", ["draft", "waiting"]);

      setStats({
        totalProducts: productsCount || 0,
        lowStock: lowStockCount,
        pendingReceipts: receiptsCount || 0,
        pendingDeliveries: deliveriesCount || 0,
        pendingTransfers: transfersCount || 0,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading dashboard",
        description: error.message,
      });
    }
  };

  const statCards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      color: "text-primary",
    },
    {
      title: "Low Stock Items",
      value: stats.lowStock,
      icon: AlertTriangle,
      color: "text-warning",
    },
    {
      title: "Pending Receipts",
      value: stats.pendingReceipts,
      icon: FileText,
      color: "text-primary",
    },
    {
      title: "Pending Deliveries",
      value: stats.pendingDeliveries,
      icon: Truck,
      color: "text-primary",
    },
    {
      title: "Pending Transfers",
      value: stats.pendingTransfers,
      icon: ArrowRightLeft,
      color: "text-primary",
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome to StockMaster inventory management</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {statCards.map((card) => (
            <Card key={card.title} className="shadow hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              No recent activity to display
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
