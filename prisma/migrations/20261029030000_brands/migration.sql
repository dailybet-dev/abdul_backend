CREATE TABLE IF NOT EXISTS "Brand" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Brand_slug_key" ON "Brand"("slug");
CREATE INDEX IF NOT EXISTS "Brand_name_idx" ON "Brand"("name");

INSERT INTO "Brand" ("id", "name", "slug", "updatedAt") VALUES
  ('brand-samsung', 'SAMSUNG', 'samsung', CURRENT_TIMESTAMP),
  ('brand-xiaomi', 'XIAOMI', 'xiaomi', CURRENT_TIMESTAMP),
  ('brand-tecno', 'TECNO', 'tecno', CURRENT_TIMESTAMP),
  ('brand-nokia', 'NOKIA', 'nokia', CURRENT_TIMESTAMP),
  ('brand-infinix', 'INFINIX', 'infinix', CURRENT_TIMESTAMP),
  ('brand-oneplus', 'ONEPLUS', 'oneplus', CURRENT_TIMESTAMP),
  ('brand-oppo', 'OPPO', 'oppo', CURRENT_TIMESTAMP),
  ('brand-zte', 'ZTE', 'zte', CURRENT_TIMESTAMP),
  ('brand-motorola', 'MOTOROLA', 'motorola', CURRENT_TIMESTAMP),
  ('brand-nothing-phone', 'NOTHING PHONE', 'nothing-phone', CURRENT_TIMESTAMP),
  ('brand-huawei', 'HUAWEI', 'huawei', CURRENT_TIMESTAMP),
  ('brand-poco', 'POCO', 'poco', CURRENT_TIMESTAMP),
  ('brand-macbooks', 'MACBOOKS', 'macbooks', CURRENT_TIMESTAMP),
  ('brand-ipads', 'IPADS', 'ipads', CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
