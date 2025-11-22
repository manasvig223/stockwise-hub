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

interface Receipt {
  id: string;
  receipt_number: string;
  supplier_name: string | null;
  status: string;
  created_at: string;
  warehouses: { name: string } | null;
}

export default function Receipts() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    const { data, error } = await supabase
      .from("receipts")
      .select("*, warehouses(name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ variant: "destructive", title: "Error loading receipts", description: error.message });
    } else {
      setReceipts(data || []);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Receipts</h1>
            <p className="text-muted-foreground mt-1">Manage incoming stock</p>
          </div>
          <Button onClick={() => navigate("/receipts/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Receipt
          </Button>
        </div>

        <Card className="shadow">
          <CardHeader>
            <CardTitle>Receipt List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.map((receipt) => (
                  <TableRow
                    key={receipt.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/receipts/${receipt.id}`)}
                  >
                    <TableCell className="font-medium">{receipt.receipt_number}</TableCell>
                    <TableCell>{receipt.supplier_name || "—"}</TableCell>
                    <TableCell>{receipt.warehouses?.name || "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={receipt.status as any} />
                    </TableCell>
                    <TableCell>{new Date(receipt.created_at).toLocaleDateString()}</TableCell>
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
