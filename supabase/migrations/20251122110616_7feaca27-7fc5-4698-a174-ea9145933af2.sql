-- Fix search_path for update_stock_location function
CREATE OR REPLACE FUNCTION update_stock_location(
  p_product_id UUID,
  p_warehouse_id UUID,
  p_quantity_change DECIMAL
) RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.stock_locations (product_id, warehouse_id, quantity)
  VALUES (p_product_id, p_warehouse_id, p_quantity_change)
  ON CONFLICT (product_id, warehouse_id)
  DO UPDATE SET 
    quantity = stock_locations.quantity + p_quantity_change,
    updated_at = now();
END;
$$;

-- Fix search_path for log_stock_movement function
CREATE OR REPLACE FUNCTION log_stock_movement(
  p_product_id UUID,
  p_warehouse_id UUID,
  p_operation_type TEXT,
  p_reference_number TEXT,
  p_quantity_change DECIMAL,
  p_user_id UUID
) RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;