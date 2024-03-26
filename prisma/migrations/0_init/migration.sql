-- CreateEnum
CREATE TYPE "ConstantType" AS ENUM ('Amount', 'Percentage', 'Numeric');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "UserTypeID" INTEGER NOT NULL,
    "FirstName" TEXT NOT NULL,
    "LastName" TEXT NOT NULL,
    "Password" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "PhoneNumber" TEXT NOT NULL,
    "Nationality" TEXT NOT NULL,
    "CreatedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ModifiedOn" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer" (
    "id" SERIAL NOT NULL,
    "UserID" INTEGER NOT NULL,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider" (
    "id" SERIAL NOT NULL,
    "UserID" INTEGER NOT NULL,
    "NumberOfOrders" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "additionalFees" (
    "id" SERIAL NOT NULL,
    "FeeName" TEXT NOT NULL,
    "FeePrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "CreatedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "additionalFees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" SERIAL NOT NULL,
    "ServiceName" TEXT NOT NULL,
    "ServiceDescription" TEXT NOT NULL,
    "ServiceIconLink" TEXT NOT NULL,
    "ServicePrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "CreatedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ModifiedOn" TIMESTAMP(3) NOT NULL,
    "ModuleID" INTEGER NOT NULL,
    "GradientID" INTEGER,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "PaymentMethodID" INTEGER NOT NULL,
    "CustomerID" INTEGER NOT NULL,
    "ProviderID" INTEGER NOT NULL,
    "OrderTotalAmount" DOUBLE PRECISION NOT NULL,
    "OrderCreatedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Longitude" DOUBLE PRECISION NOT NULL,
    "Latitude" DOUBLE PRECISION NOT NULL,
    "AddressString" TEXT NOT NULL,
    "PaymentIntentID" TEXT,
    "AdditionalAddressData" JSONB,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orderServices" (
    "id" SERIAL NOT NULL,
    "ProviderServiceID" INTEGER NOT NULL,
    "OrderID" INTEGER NOT NULL,
    "CarID" INTEGER NOT NULL,
    "CreatedOn" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orderServices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orderCreditCardsPurchase" (
    "id" SERIAL NOT NULL,
    "CardID" INTEGER NOT NULL,
    "OrderID" INTEGER NOT NULL,
    "TotalAmount" DOUBLE PRECISION NOT NULL,
    "CreatedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orderCreditCardsPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creditCards" (
    "id" SERIAL NOT NULL,
    "UserID" INTEGER NOT NULL,
    "CVC" TEXT NOT NULL,
    "CardNumber" TEXT NOT NULL,
    "ExpiryDate" TEXT NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "CreatedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creditCards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paymentMethods" (
    "id" SERIAL NOT NULL,
    "MethodName" TEXT NOT NULL,
    "MethodDescription" TEXT NOT NULL,
    "CreatedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "paymentMethods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "userTypes" (
    "id" SERIAL NOT NULL,
    "TypeName" TEXT NOT NULL,
    "CreatedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "AllowedClients" TEXT[],

    CONSTRAINT "userTypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" SERIAL NOT NULL,
    "ModuleName" TEXT NOT NULL,
    "ModuleDescription" TEXT NOT NULL,
    "ModuleIconLink" TEXT NOT NULL,
    "CreatedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providerServices" (
    "id" SERIAL NOT NULL,
    "ProviderID" INTEGER,
    "ServiceID" INTEGER,
    "Pofeciency" TEXT,
    "Price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "CreatedOn" TEXT,
    "Rating" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "providerServices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packages" (
    "id" SERIAL NOT NULL,
    "ModuleID" INTEGER NOT NULL,
    "GradiantID" INTEGER,
    "PackageName" TEXT NOT NULL,
    "PackageDescription" TEXT NOT NULL,
    "PackagePrice" DOUBLE PRECISION NOT NULL,
    "PackageOriginalPrice" DOUBLE PRECISION NOT NULL,
    "PackageIconLink" TEXT NOT NULL,
    "CreatedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bodyTypes" (
    "id" SERIAL NOT NULL,
    "TypeName" TEXT NOT NULL,

    CONSTRAINT "bodyTypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cars" (
    "id" SERIAL NOT NULL,
    "UserID" INTEGER NOT NULL,
    "BodyTypeID" INTEGER NOT NULL,
    "PlateNumber" TEXT NOT NULL,
    "Color" TEXT NOT NULL,
    "Manufacturer" TEXT NOT NULL,
    "Model" TEXT NOT NULL,
    "CreatedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ModifiedOn" TIMESTAMP(3) NOT NULL,
    "PlateCity" TEXT,

    CONSTRAINT "cars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colorGradiants" (
    "id" SERIAL NOT NULL,
    "ColorName" TEXT NOT NULL,
    "ColorMainText" TEXT NOT NULL,
    "ColorSecondaryText" TEXT NOT NULL,
    "ColorStart" TEXT NOT NULL,
    "ColorEnd" TEXT NOT NULL,

    CONSTRAINT "colorGradiants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packageServices" (
    "PackageID" INTEGER NOT NULL,
    "ServiceID" INTEGER NOT NULL,

    CONSTRAINT "packageServices_pkey" PRIMARY KEY ("PackageID","ServiceID")
);

-- CreateTable
CREATE TABLE "orderHistory" (
    "id" SERIAL NOT NULL,
    "OrderID" INTEGER NOT NULL,
    "HistoryItemID" INTEGER NOT NULL,
    "CreatedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orderHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orderHistoryItems" (
    "id" SERIAL NOT NULL,
    "HistoryName" TEXT NOT NULL,

    CONSTRAINT "orderHistoryItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachmentTypes" (
    "id" SERIAL NOT NULL,
    "TypeName" TEXT NOT NULL,

    CONSTRAINT "attachmentTypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" SERIAL NOT NULL,
    "TypeID" INTEGER NOT NULL,
    "Name" TEXT NOT NULL,
    "Description" TEXT NOT NULL,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploadedFiles" (
    "id" SERIAL NOT NULL,
    "AttachmentID" INTEGER NOT NULL,
    "UserID" INTEGER NOT NULL,
    "FileName" TEXT NOT NULL,
    "AWSEtag" TEXT,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UploadedAt" TIMESTAMP(3),
    "JsonData" JSONB,

    CONSTRAINT "uploadedFiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "constants" (
    "id" SERIAL NOT NULL,
    "Value" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "Type" "ConstantType" NOT NULL,
    "Label" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "Name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "constants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orderAmountStatements" (
    "id" SERIAL NOT NULL,
    "OrderID" INTEGER NOT NULL,
    "RelatedConstantID" INTEGER,
    "RelatedProviderServiceID" INTEGER,
    "Name" TEXT,
    "Amount" DECIMAL(65,30) NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orderAmountStatements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_Email_key" ON "users"("Email");

-- CreateIndex
CREATE UNIQUE INDEX "users_PhoneNumber_key" ON "users"("PhoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "customer_UserID_key" ON "customer"("UserID");

-- CreateIndex
CREATE UNIQUE INDEX "provider_UserID_key" ON "provider"("UserID");

-- CreateIndex
CREATE UNIQUE INDEX "additionalFees_FeeName_key" ON "additionalFees"("FeeName");

-- CreateIndex
CREATE UNIQUE INDEX "services_ServiceName_key" ON "services"("ServiceName");

-- CreateIndex
CREATE UNIQUE INDEX "orders_PaymentIntentID_key" ON "orders"("PaymentIntentID");

-- CreateIndex
CREATE UNIQUE INDEX "paymentMethods_MethodName_key" ON "paymentMethods"("MethodName");

-- CreateIndex
CREATE UNIQUE INDEX "userTypes_TypeName_key" ON "userTypes"("TypeName");

-- CreateIndex
CREATE UNIQUE INDEX "modules_ModuleName_key" ON "modules"("ModuleName");

-- CreateIndex
CREATE UNIQUE INDEX "bodyTypes_TypeName_key" ON "bodyTypes"("TypeName");

-- CreateIndex
CREATE UNIQUE INDEX "colorGradiants_ColorName_key" ON "colorGradiants"("ColorName");

-- CreateIndex
CREATE UNIQUE INDEX "orderHistoryItems_HistoryName_key" ON "orderHistoryItems"("HistoryName");

-- CreateIndex
CREATE UNIQUE INDEX "attachmentTypes_TypeName_key" ON "attachmentTypes"("TypeName");

-- CreateIndex
CREATE UNIQUE INDEX "uploadedFiles_FileName_key" ON "uploadedFiles"("FileName");

-- CreateIndex
CREATE UNIQUE INDEX "constants_Name_key" ON "constants"("Name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_UserTypeID_fkey" FOREIGN KEY ("UserTypeID") REFERENCES "userTypes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider" ADD CONSTRAINT "provider_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_GradientID_fkey" FOREIGN KEY ("GradientID") REFERENCES "colorGradiants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_ModuleID_fkey" FOREIGN KEY ("ModuleID") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_CustomerID_fkey" FOREIGN KEY ("CustomerID") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_PaymentMethodID_fkey" FOREIGN KEY ("PaymentMethodID") REFERENCES "paymentMethods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_ProviderID_fkey" FOREIGN KEY ("ProviderID") REFERENCES "provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderServices" ADD CONSTRAINT "orderServices_CarID_fkey" FOREIGN KEY ("CarID") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderServices" ADD CONSTRAINT "orderServices_OrderID_fkey" FOREIGN KEY ("OrderID") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderServices" ADD CONSTRAINT "orderServices_ServiceID_fkey" FOREIGN KEY ("ProviderServiceID") REFERENCES "providerServices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderCreditCardsPurchase" ADD CONSTRAINT "orderCreditCardsPurchase_CardID_fkey" FOREIGN KEY ("CardID") REFERENCES "creditCards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderCreditCardsPurchase" ADD CONSTRAINT "orderCreditCardsPurchase_OrderID_fkey" FOREIGN KEY ("OrderID") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creditCards" ADD CONSTRAINT "creditCards_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providerServices" ADD CONSTRAINT "providerServices_ProviderID_fkey" FOREIGN KEY ("ProviderID") REFERENCES "provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providerServices" ADD CONSTRAINT "providerServices_ServiceID_fkey" FOREIGN KEY ("ServiceID") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_GradiantID_fkey" FOREIGN KEY ("GradiantID") REFERENCES "colorGradiants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_ModuleID_fkey" FOREIGN KEY ("ModuleID") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cars" ADD CONSTRAINT "cars_BodyTypeID_fkey" FOREIGN KEY ("BodyTypeID") REFERENCES "bodyTypes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cars" ADD CONSTRAINT "cars_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packageServices" ADD CONSTRAINT "packageServices_PackageID_fkey" FOREIGN KEY ("PackageID") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packageServices" ADD CONSTRAINT "packageServices_ServiceID_fkey" FOREIGN KEY ("ServiceID") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderHistory" ADD CONSTRAINT "orderHistory_HistoryItemID_fkey" FOREIGN KEY ("HistoryItemID") REFERENCES "orderHistoryItems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderHistory" ADD CONSTRAINT "orderHistory_OrderID_fkey" FOREIGN KEY ("OrderID") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_TypeID_fkey" FOREIGN KEY ("TypeID") REFERENCES "attachmentTypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploadedFiles" ADD CONSTRAINT "uploadedFiles_AttachmentID_fkey" FOREIGN KEY ("AttachmentID") REFERENCES "attachments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploadedFiles" ADD CONSTRAINT "uploadedFiles_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderAmountStatements" ADD CONSTRAINT "orderAmountStatements_OrderID_fkey" FOREIGN KEY ("OrderID") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orderAmountStatements" ADD CONSTRAINT "orderAmountStatements_RelatedConstantID_fkey" FOREIGN KEY ("RelatedConstantID") REFERENCES "constants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orderAmountStatements" ADD CONSTRAINT "orderAmountStatements_RelatedProviderServiceID_fkey" FOREIGN KEY ("RelatedProviderServiceID") REFERENCES "providerServices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

