import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface LedgerEntry {
  id: string;
  operation_type: string;
  reference_number: string | null;
  quantity_change: number;
  balance_after: number | null;
  created_at: string;
  products: { name: string; sku: string } | null;
  warehouses: { name: string } | null;
}

export default function History() {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    const { data, error } = await supabase
      .from("stock_ledger")
      .select("*, products(name, sku), warehouses(name)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      toast({ variant: "destructive", title: "Error loading history", description: error.message });
    } else {
      setLedger(data || []);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Move History</h1>
          <p className="text-muted-foreground mt-1">Complete stock movement ledger</p>
        </div>

        <Card className="shadow">
          <CardHeader>
            <CardTitle>Stock Movements</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Operation</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{new Date(entry.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{entry.products?.name || "—"}</div>
                        <div className="text-sm text-muted-foreground">{entry.products?.sku}</div>
                      </div>
                    </TableCell>
                    <TableCell>{entry.warehouses?.name || "—"}</TableCell>
                    <TableCell className="capitalize">{entry.operation_type.replace("_", " ")}</TableCell>
                    <TableCell className="font-mono text-sm">{entry.reference_number || "—"}</TableCell>
                    <TableCell className={`text-right font-medium ${entry.quantity_change > 0 ? "text-success" : "text-destructive"}`}>
                      {entry.quantity_change > 0 ? "+" : ""}{entry.quantity_change}
                    </TableCell>
                    <TableCell className="text-right font-medium">{entry.balance_after}</TableCell>
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
