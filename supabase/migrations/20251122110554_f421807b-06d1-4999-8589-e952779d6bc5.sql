-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'staff',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create warehouses table
CREATE TABLE public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view warehouses"
  ON public.warehouses FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage warehouses"
  ON public.warehouses FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Create product categories
CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON public.product_categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage categories"
  ON public.product_categories FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  category_id UUID REFERENCES public.product_categories(id),
  unit_of_measure TEXT DEFAULT 'units',
  reorder_level INTEGER DEFAULT 10,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage products"
  ON public.products FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Create stock locations (tracks stock per warehouse)
CREATE TABLE public.stock_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
  quantity DECIMAL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, warehouse_id)
);

ALTER TABLE public.stock_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stock"
  ON public.stock_locations FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage stock"
  ON public.stock_locations FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Create receipts table (incoming stock)
CREATE TABLE public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT UNIQUE NOT NULL,
  warehouse_id UUID REFERENCES public.warehouses(id),
  supplier_name TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'waiting', 'ready', 'done', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view receipts"
  ON public.receipts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage receipts"
  ON public.receipts FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Create receipt items
CREATE TABLE public.receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID REFERENCES public.receipts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity DECIMAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.receipt_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view receipt items"
  ON public.receipt_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage receipt items"
  ON public.receipt_items FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Create delivery orders table (outgoing stock)
CREATE TABLE public.delivery_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_number TEXT UNIQUE NOT NULL,
  warehouse_id UUID REFERENCES public.warehouses(id),
  customer_name TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'waiting', 'ready', 'done', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view deliveries"
  ON public.delivery_orders FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage deliveries"
  ON public.delivery_orders FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Create delivery items
CREATE TABLE public.delivery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES public.delivery_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity DECIMAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.delivery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view delivery items"
  ON public.delivery_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage delivery items"
  ON public.delivery_items FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Create internal transfers table
CREATE TABLE public.internal_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number TEXT UNIQUE NOT NULL,
  from_warehouse_id UUID REFERENCES public.warehouses(id),
  to_warehouse_id UUID REFERENCES public.warehouses(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'waiting', 'ready', 'done', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.internal_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view transfers"
  ON public.internal_transfers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage transfers"
  ON public.internal_transfers FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Create transfer items
CREATE TABLE public.transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID REFERENCES public.internal_transfers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity DECIMAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.transfer_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view transfer items"
  ON public.transfer_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage transfer items"
  ON public.transfer_items FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Create stock adjustments table
CREATE TABLE public.stock_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_number TEXT UNIQUE NOT NULL,
  warehouse_id UUID REFERENCES public.warehouses(id),
  reason TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'done', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view adjustments"
  ON public.stock_adjustments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage adjustments"
  ON public.stock_adjustments FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Create adjustment items
CREATE TABLE public.adjustment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_id UUID REFERENCES public.stock_adjustments(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  counted_quantity DECIMAL NOT NULL,
  theoretical_quantity DECIMAL NOT NULL,
  difference DECIMAL GENERATED ALWAYS AS (counted_quantity - theoretical_quantity) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.adjustment_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view adjustment items"
  ON public.adjustment_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage adjustment items"
  ON public.adjustment_items FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Create stock ledger (movement history)
CREATE TABLE public.stock_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id),
  warehouse_id UUID REFERENCES public.warehouses(id),
  operation_type TEXT NOT NULL,
  reference_number TEXT,
  quantity_change DECIMAL NOT NULL,
  balance_after DECIMAL,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.stock_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ledger"
  ON public.stock_ledger FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert ledger entries"
  ON public.stock_ledger FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create function to update stock
CREATE OR REPLACE FUNCTION update_stock_location(
  p_product_id UUID,
  p_warehouse_id UUID,
  p_quantity_change DECIMAL
) RETURNS void AS $$
BEGIN
  INSERT INTO public.stock_locations (product_id, warehouse_id, quantity)
  VALUES (p_product_id, p_warehouse_id, p_quantity_change)
  ON CONFLICT (product_id, warehouse_id)
  DO UPDATE SET 
    quantity = stock_locations.quantity + p_quantity_change,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log stock movement
CREATE OR REPLACE FUNCTION log_stock_movement(
  p_product_id UUID,
  p_warehouse_id UUID,
  p_operation_type TEXT,
  p_reference_number TEXT,
  p_quantity_change DECIMAL,
  p_user_id UUID
) RETURNS void AS $$
DECLARE
  v_balance DECIMAL;
BEGIN
  SELECT COALESCE(quantity, 0) INTO v_balance
  FROM public.stock_locations
  WHERE product_id = p_product_id AND warehouse_id = p_warehouse_id;
  
  INSERT INTO public.stock_ledger (
    product_id,
    warehouse_id,
    operation_type,
    reference_number,
    quantity_change,
    balance_after,
    created_by
  ) VALUES (
    p_product_id,
    p_warehouse_id,
    p_operation_type,
    p_reference_number,
    p_quantity_change,
    v_balance + p_quantity_change,
    p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;