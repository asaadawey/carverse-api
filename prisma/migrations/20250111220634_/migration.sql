-- CreateTable
CREATE TABLE "ratings" (
    "id" SERIAL NOT NULL,
    "OrderID" INTEGER NOT NULL,
    "Rating" DECIMAL(65,30) NOT NULL,
    "CreatedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);
