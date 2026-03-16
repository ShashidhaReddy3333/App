-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_expiresAt_usedAt_idx" ON "PasswordResetToken"("userId", "expiresAt", "usedAt");

-- CreateIndex
CREATE INDEX "StaffInviteToken_businessId_revokedAt_expiresAt_idx" ON "StaffInviteToken"("businessId", "revokedAt", "expiresAt");

-- CreateIndex
CREATE INDEX "Order_customerId_createdAt_idx" ON "Order"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "PurchaseOrder_supplierId_businessId_status_idx" ON "PurchaseOrder"("supplierId", "businessId", "status");

-- CreateIndex
CREATE INDEX "Notification_status_channel_createdAt_idx" ON "Notification"("status", "channel", "createdAt");
