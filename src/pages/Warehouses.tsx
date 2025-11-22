import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string | null;
}

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    const { data, error } = await supabase
      .from("warehouses")
      .select("*")
      .order("name");

    if (error) {
      toast({ variant: "destructive", title: "Error loading warehouses", description: error.message });
    } else {
      setWarehouses(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const warehouseData = {
      name: formData.get("name") as string,
      code: formData.get("code") as string,
      address: formData.get("address") as string || null,
      created_by: user?.id,
    };

    if (editingWarehouse) {
      const { error } = await supabase
        .from("warehouses")
        .update(warehouseData)
        .eq("id", editingWarehouse.id);

      if (error) {
        toast({ variant: "destructive", title: "Error updating warehouse", description: error.message });
      } else {
        toast({ title: "Warehouse updated successfully" });
        setIsDialogOpen(false);
        setEditingWarehouse(null);
        fetchWarehouses();
      }
    } else {
      const { error } = await supabase.from("warehouses").insert([warehouseData]);

      if (error) {
        toast({ variant: "destructive", title: "Error creating warehouse", description: error.message });
      } else {
        toast({ title: "Warehouse created successfully" });
        setIsDialogOpen(false);
        fetchWarehouses();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("warehouses").delete().eq("id", id);

    if (error) {
      toast({ variant: "destructive", title: "Error deleting warehouse", description: error.message });
    } else {
      toast({ title: "Warehouse deleted successfully" });
      fetchWarehouses();
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Warehouses</h1>
            <p className="text-muted-foreground mt-1">Manage warehouse locations</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingWarehouse(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Warehouse
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingWarehouse ? "Edit Warehouse" : "Add New Warehouse"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Warehouse Name</Label>
                  <Input id="name" name="name" defaultValue={editingWarehouse?.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Code</Label>
                  <Input id="code" name="code" defaultValue={editingWarehouse?.code} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" defaultValue={editingWarehouse?.address || ""} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingWarehouse ? "Update" : "Create"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow">
          <CardHeader>
            <CardTitle>Warehouse List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouses.map((warehouse) => (
                  <TableRow key={warehouse.id}>
                    <TableCell className="font-medium">{warehouse.code}</TableCell>
                    <TableCell>{warehouse.name}</TableCell>
                    <TableCell>{warehouse.address || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingWarehouse(warehouse);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(warehouse.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
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
