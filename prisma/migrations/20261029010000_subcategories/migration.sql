-- Add subcategories and seed the default storefront filters.
CREATE TABLE "Subcategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Subcategory_slug_key" ON "Subcategory"("slug");
CREATE INDEX "Subcategory_name_idx" ON "Subcategory"("name");
CREATE INDEX "Subcategory_sortOrder_idx" ON "Subcategory"("sortOrder");
CREATE INDEX "Subcategory_categoryId_idx" ON "Subcategory"("categoryId");

INSERT INTO "Subcategory" ("id","name","slug","description","sortOrder","categoryId","updatedAt") VALUES
('subcategory-uk-used','UK-USED','uk-used','',1,NULL,CURRENT_TIMESTAMP),
('subcategory-best-deals','BEST-DEALS','best-deals','',2,NULL,CURRENT_TIMESTAMP),
('subcategory-brand-new','BRAND-NEW','brand-new','',3,NULL,CURRENT_TIMESTAMP),
('subcategory-premium-repack','PREMIUM-REPACK','premium-repack','',4,NULL,CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
