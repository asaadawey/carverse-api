-- Performance optimization indexes for faster queries

-- Index on orders table for faster lookups
CREATE INDEX IF NOT EXISTS "idx_orders_id_provider" ON "orders"("id", "ProviderID");
CREATE INDEX IF NOT EXISTS "idx_orders_customer_date" ON "orders"("CustomerID", "OrderCreatedDate");
CREATE INDEX IF NOT EXISTS "idx_orders_provider_date" ON "orders"("ProviderID", "OrderCreatedDate") WHERE "ProviderID" IS NOT NULL;

-- Index on orderServices for faster joins
CREATE INDEX IF NOT EXISTS "idx_orderServices_order_car" ON "orderServices"("OrderID", "CarID");
CREATE INDEX IF NOT EXISTS "idx_orderServices_provider_service" ON "orderServices"("ProviderServiceBodyTypeID") WHERE "ProviderServiceBodyTypeID" IS NOT NULL;

-- Index on customer table for faster user lookups
CREATE INDEX IF NOT EXISTS "idx_customer_user" ON "customer"("UserID");

-- Index on provider table for faster user lookups
CREATE INDEX IF NOT EXISTS "idx_provider_user" ON "provider"("UserID");

-- Index on providerServicesAllowedBodyTypes for faster price lookups
CREATE INDEX IF NOT EXISTS "idx_provider_services_body_types_price" ON "providerServicesAllowedBodyTypes"("ProviderServiceID", "BodyTypeID", "Price");

-- Index on providerServices for faster service lookups
CREATE INDEX IF NOT EXISTS "idx_provider_services_active" ON "providerServices"("ProviderID", "ServiceID") WHERE "isActive" = true;

-- Index on users table for faster name lookups
CREATE INDEX IF NOT EXISTS "idx_users_name_active" ON "users"("FirstName", "LastName") WHERE "isActive" = true;

-- Index on services table for faster service lookups
CREATE INDEX IF NOT EXISTS "idx_services_active_auto_select" ON "services"("id", "ServiceName") WHERE "IsActive" = true AND "isAvailableForAutoSelect" = true;

-- Index on bodyTypes for faster type lookups
CREATE INDEX IF NOT EXISTS "idx_body_types_name" ON "bodyTypes"("TypeName");
