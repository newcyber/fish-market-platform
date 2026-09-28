-- Add structured seafood product condition without changing existing product data.
CREATE TYPE "ProductCondition" AS ENUM ('FRESH', 'CHILLED', 'FROZEN');

ALTER TABLE "Product"
ADD COLUMN "condition" "ProductCondition" NOT NULL DEFAULT 'FRESH';
