import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";

interface Transfer {
  id: string;
  transfer_number: string;
  status: string;
  created_at: string;
  from_warehouse: { name: string } | null;
  to_warehouse: { name: string } | null;
}

export default function Transfers() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    const { data, error } = await supabase
      .from("internal_transfers")
      .select(`
        *,
        from_warehouse:warehouses!from_warehouse_id(name),
        to_warehouse:warehouses!to_warehouse_id(name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ variant: "destructive", title: "Error loading transfers", description: error.message });
    } else {
      setTransfers(data || []);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Internal Transfers</h1>
            <p className="text-muted-foreground mt-1">Move stock between warehouses</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Transfer
          </Button>
        </div>

        <Card className="shadow">
          <CardHeader>
            <CardTitle>Transfer List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transfer #</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((transfer) => (
                  <TableRow key={transfer.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{transfer.transfer_number}</TableCell>
                    <TableCell>{transfer.from_warehouse?.name || "—"}</TableCell>
                    <TableCell>{transfer.to_warehouse?.name || "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={transfer.status as any} />
                    </TableCell>
                    <TableCell>{new Date(transfer.created_at).toLocaleDateString()}</TableCell>
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
