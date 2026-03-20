-- Add CHECK constraints for data integrity

-- InventoryBalance
ALTER TABLE "InventoryBalance" ADD CONSTRAINT "InventoryBalance_onHand_check" CHECK ("onHandQuantity" >= 0);
ALTER TABLE "InventoryBalance" ADD CONSTRAINT "InventoryBalance_reserved_check" CHECK ("reservedQuantity" >= 0);

-- Sale
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_subTotal_check" CHECK ("subtotalAmount" >= 0);
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_taxTotal_check" CHECK ("taxAmount" >= 0);
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_grandTotal_check" CHECK ("totalAmount" >= 0);
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_discountAmount_check" CHECK ("discountAmount" >= 0);
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_amountPaid_check" CHECK ("amountPaid" >= 0);

-- SaleItem
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_quantity_check" CHECK ("quantity" > 0);
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_unitPrice_check" CHECK ("unitPrice" >= 0);

-- Payment
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_amount_check" CHECK ("amount" > 0);

-- Refund
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_totalAmount_check" CHECK ("refundTotalAmount" > 0);

-- RefundItem
ALTER TABLE "RefundItem" ADD CONSTRAINT "RefundItem_quantity_check" CHECK ("quantityRefunded" > 0);

-- PurchaseOrderItem
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "POItem_orderedQty_check" CHECK ("orderedQuantity" > 0);
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "POItem_receivedQty_check" CHECK ("receivedQuantity" >= 0);
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "POItem_unitCost_check" CHECK ("unitCost" >= 0);

-- CartItem
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_quantity_check" CHECK ("quantity" > 0);
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_unitPrice_check" CHECK ("unitPrice" >= 0);

-- OrderItem
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_quantity_check" CHECK ("quantity" > 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_unitPrice_check" CHECK ("unitPrice" >= 0);

-- Product
ALTER TABLE "Product" ADD CONSTRAINT "Product_sellingPrice_check" CHECK ("sellingPrice" >= 0);
ALTER TABLE "Product" ADD CONSTRAINT "Product_purchasePrice_check" CHECK ("purchasePrice" >= 0);
