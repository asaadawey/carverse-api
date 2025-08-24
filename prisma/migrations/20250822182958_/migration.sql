-- DropIndex
DROP INDEX "public"."idx_body_types_name";

-- DropIndex
DROP INDEX "public"."idx_customer_user";

-- DropIndex
DROP INDEX "public"."idx_provider_services_body_types_price";

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "cars_UserID_idx" ON "public"."cars"("UserID");

-- CreateIndex
CREATE INDEX "cars_BodyTypeID_idx" ON "public"."cars"("BodyTypeID");

-- CreateIndex
CREATE INDEX "cars_PlateNumber_idx" ON "public"."cars"("PlateNumber");

-- CreateIndex
CREATE INDEX "cars_UserID_BodyTypeID_idx" ON "public"."cars"("UserID", "BodyTypeID");

-- CreateIndex
CREATE INDEX "orderServices_ServiceID_idx" ON "public"."orderServices"("ServiceID");

-- CreateIndex
CREATE INDEX "orderServices_ProviderServiceBodyTypeID_idx" ON "public"."orderServices"("ProviderServiceBodyTypeID");

-- CreateIndex
CREATE INDEX "orders_ProviderID_OrderCreatedDate_idx" ON "public"."orders"("ProviderID", "OrderCreatedDate");

-- CreateIndex
CREATE INDEX "packages_ModuleID_idx" ON "public"."packages"("ModuleID");

-- CreateIndex
CREATE INDEX "packages_PackagePrice_idx" ON "public"."packages"("PackagePrice");

-- CreateIndex
CREATE INDEX "packages_ModuleID_PackagePrice_idx" ON "public"."packages"("ModuleID", "PackagePrice");

-- CreateIndex
CREATE INDEX "provider_CompanyName_idx" ON "public"."provider"("CompanyName");

-- CreateIndex
CREATE INDEX "providerServices_ProviderID_idx" ON "public"."providerServices"("ProviderID");

-- CreateIndex
CREATE INDEX "providerServices_ServiceID_idx" ON "public"."providerServices"("ServiceID");

-- CreateIndex
CREATE INDEX "providerServices_isActive_idx" ON "public"."providerServices"("isActive");

-- CreateIndex
CREATE INDEX "providerServices_Rating_idx" ON "public"."providerServices"("Rating");

-- CreateIndex
CREATE INDEX "providerServices_ProviderID_isActive_idx" ON "public"."providerServices"("ProviderID", "isActive");

-- CreateIndex
CREATE INDEX "providerServices_ServiceID_isActive_idx" ON "public"."providerServices"("ServiceID", "isActive");

-- CreateIndex
CREATE INDEX "services_IsActive_isAvailableForAutoSelect_idx" ON "public"."services"("IsActive", "isAvailableForAutoSelect");

-- CreateIndex
CREATE INDEX "services_ServiceName_idx" ON "public"."services"("ServiceName");

-- CreateIndex
CREATE INDEX "users_FirstName_LastName_idx" ON "public"."users"("FirstName", "LastName");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "public"."users"("isActive");

-- RenameIndex
ALTER INDEX "public"."idx_orderServices_order_car" RENAME TO "orderServices_OrderID_CarID_idx";

-- RenameIndex
ALTER INDEX "public"."idx_orders_customer_date" RENAME TO "orders_CustomerID_OrderCreatedDate_idx";

-- RenameIndex
ALTER INDEX "public"."idx_orders_id_provider" RENAME TO "orders_id_ProviderID_idx";

-- RenameIndex
ALTER INDEX "public"."idx_provider_user" RENAME TO "provider_UserID_idx";
