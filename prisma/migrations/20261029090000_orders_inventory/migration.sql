CREATE TYPE "OrderStatus" AS ENUM ('NEW','CONFIRMED','PROCESSING','READY_FOR_PICKUP','OUT_FOR_DELIVERY','COMPLETED','CANCELLED');
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID','DEPOSIT_PAID','PARTIALLY_PAID','PAID','REFUNDED');
CREATE TYPE "OrderFulfilment" AS ENUM ('PICKUP','DELIVERY');
CREATE TYPE "OrderPaymentMethod" AS ENUM ('MTN_MOBILE_MONEY','AIRTEL_MONEY','CENTENARY_BANK','CASH_ON_DELIVERY','OTHER');

CREATE TABLE "Order" (
  "id" TEXT NOT NULL,
  "orderNumber" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "customerPhone" TEXT NOT NULL,
  "customerEmail" TEXT NOT NULL DEFAULT '',
  "fulfilment" "OrderFulfilment" NOT NULL,
  "pickupLocation" TEXT NOT NULL DEFAULT '',
  "deliveryAddress" TEXT NOT NULL DEFAULT '',
  "deliveryArea" TEXT NOT NULL DEFAULT '',
  "deliveryNotes" TEXT NOT NULL DEFAULT '',
  "paymentMethod" "OrderPaymentMethod" NOT NULL,
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
  "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
  "subtotal" INTEGER NOT NULL,
  "deliveryFee" INTEGER NOT NULL DEFAULT 0,
  "total" INTEGER NOT NULL,
  "depositRequired" INTEGER NOT NULL DEFAULT 0,
  "amountPaid" INTEGER NOT NULL DEFAULT 0,
  "transactionReference" TEXT NOT NULL DEFAULT '',
  "customerNote" TEXT NOT NULL DEFAULT '',
  "adminNote" TEXT NOT NULL DEFAULT '',
  "trackingNumber" TEXT NOT NULL DEFAULT '',
  "inventoryReserved" BOOLEAN NOT NULL DEFAULT false,
  "inventoryNote" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "cancelledAt" TIMESTAMP(3),
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status","createdAt");
CREATE INDEX "Order_paymentStatus_createdAt_idx" ON "Order"("paymentStatus","createdAt");
CREATE INDEX "Order_customerPhone_idx" ON "Order"("customerPhone");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

CREATE TABLE "OrderItem" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "productId" TEXT,
  "productConditionId" TEXT,
  "productName" TEXT NOT NULL,
  "productSku" TEXT NOT NULL DEFAULT '',
  "condition" "ProductConditionType",
  "quantity" INTEGER NOT NULL,
  "unitPrice" INTEGER NOT NULL,
  "lineTotal" INTEGER NOT NULL,
  "inventoryTracked" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");
CREATE INDEX "OrderItem_productConditionId_idx" ON "OrderItem"("productConditionId");
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productConditionId_fkey" FOREIGN KEY ("productConditionId") REFERENCES "ProductCondition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
