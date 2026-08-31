CREATE UNIQUE INDEX "Address_one_active_default_per_user"
ON "Address" ("userId")
WHERE "isDefault" = true
  AND "deletedAt" IS NULL;
