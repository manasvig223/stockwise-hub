import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";

interface Delivery {
  id: string;
  delivery_number: string;
  customer_name: string | null;
  status: string;
  created_at: string;
  warehouses: { name: string } | null;
}

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    const { data, error } = await supabase
      .from("delivery_orders")
      .select("*, warehouses(name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ variant: "destructive", title: "Error loading deliveries", description: error.message });
    } else {
      setDeliveries(data || []);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Delivery Orders</h1>
            <p className="text-muted-foreground mt-1">Manage outgoing stock</p>
          </div>
          <Button onClick={() => navigate("/deliveries/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Delivery
          </Button>
        </div>

        <Card className="shadow">
          <CardHeader>
            <CardTitle>Delivery List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Delivery #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((delivery) => (
                  <TableRow
                    key={delivery.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/deliveries/${delivery.id}`)}
                  >
                    <TableCell className="font-medium">{delivery.delivery_number}</TableCell>
                    <TableCell>{delivery.customer_name || "—"}</TableCell>
                    <TableCell>{delivery.warehouses?.name || "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={delivery.status as any} />
                    </TableCell>
                    <TableCell>{new Date(delivery.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
