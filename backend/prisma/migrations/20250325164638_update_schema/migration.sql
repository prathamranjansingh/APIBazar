-- CreateTable
CREATE TABLE "ApiCallLog" (
    "id" TEXT NOT NULL,
    "apiId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusCode" INTEGER NOT NULL,
    "responseTime" DOUBLE PRECISION NOT NULL,
    "endpoint" TEXT,
    "consumerId" TEXT,
    "country" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "errorMessage" TEXT,

    CONSTRAINT "ApiCallLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApiCallLog_apiId_idx" ON "ApiCallLog"("apiId");

-- CreateIndex
CREATE INDEX "ApiCallLog_timestamp_idx" ON "ApiCallLog"("timestamp");

-- CreateIndex
CREATE INDEX "ApiCallLog_consumerId_idx" ON "ApiCallLog"("consumerId");

-- CreateIndex
CREATE INDEX "ApiCallLog_country_idx" ON "ApiCallLog"("country");

-- CreateIndex
CREATE INDEX "ApiCallLog_endpoint_idx" ON "ApiCallLog"("endpoint");

-- AddForeignKey
ALTER TABLE "ApiCallLog" ADD CONSTRAINT "ApiCallLog_apiId_fkey" FOREIGN KEY ("apiId") REFERENCES "Api"("id") ON DELETE CASCADE ON UPDATE CASCADE;
