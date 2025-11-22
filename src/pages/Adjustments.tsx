import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";

interface Adjustment {
  id: string;
  adjustment_number: string;
  status: string;
  reason: string | null;
  created_at: string;
  warehouses: { name: string } | null;
}

export default function Adjustments() {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchAdjustments();
  }, []);

  const fetchAdjustments = async () => {
    const { data, error } = await supabase
      .from("stock_adjustments")
      .select("*, warehouses(name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ variant: "destructive", title: "Error loading adjustments", description: error.message });
    } else {
      setAdjustments(data || []);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Stock Adjustments</h1>
            <p className="text-muted-foreground mt-1">Correct inventory discrepancies</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Adjustment
          </Button>
        </div>

        <Card className="shadow">
          <CardHeader>
            <CardTitle>Adjustment List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Adjustment #</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((adjustment) => (
                  <TableRow key={adjustment.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{adjustment.adjustment_number}</TableCell>
                    <TableCell>{adjustment.warehouses?.name || "—"}</TableCell>
                    <TableCell>{adjustment.reason || "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={adjustment.status as any} />
                    </TableCell>
                    <TableCell>{new Date(adjustment.created_at).toLocaleDateString()}</TableCell>
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
