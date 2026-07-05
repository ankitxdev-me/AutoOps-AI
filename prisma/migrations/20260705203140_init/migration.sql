-- CreateTable
CREATE TABLE "SchemaVerification" (
    "id" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchemaVerification_pkey" PRIMARY KEY ("id")
);
