-- Create categories used by the storefront and admin dashboard.
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '📦',
    "description" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "Category_name_idx" ON "Category"("name");
CREATE INDEX "Category_sortOrder_idx" ON "Category"("sortOrder");

INSERT INTO "Category" ("id","name","slug","icon","description","sortOrder","updatedAt") VALUES
('category-mobile-phones','MOBILE PHONES','mobile-phones','📱','','1',CURRENT_TIMESTAMP),
('category-accessories','ACCESSORIES','accessories','🎧','Premium Accessories — Enhance your device experience','2',CURRENT_TIMESTAMP),
('category-laptops-desktops','LAPTOPS & DESKTOPS','laptops-desktops','💻','','3',CURRENT_TIMESTAMP),
('category-tablets','TABLETS','tablets','📱','','4',CURRENT_TIMESTAMP),
('category-sound-systems','SOUND SYSTEMS','sound-systems','🔊','','5',CURRENT_TIMESTAMP),
('category-home-appliances','HOME APPLIANCES','home-appliances','🏠','','6',CURRENT_TIMESTAMP),
('category-television-sets','TELEVISION SETS','television-sets','📺','','7',CURRENT_TIMESTAMP),
('category-repair-spare','REPAIR SPARE','repair-spare','🧰','','8',CURRENT_TIMESTAMP),
('category-cctv-security','CCTV & SECURITY','cctv-security','📹','','9',CURRENT_TIMESTAMP),
('category-security-cameras','SECURITY CAMERAS','security-cameras','📷','','10',CURRENT_TIMESTAMP),
('category-electrical-appliances','ELECTRICAL APPLIANCES','electrical-appliances','🔌','','11',CURRENT_TIMESTAMP),
('category-networking','NETWORKING','networking','🌐','','12',CURRENT_TIMESTAMP),
('category-power-electrical','POWER & ELECTRICAL','power-electrical','🔌','','13',CURRENT_TIMESTAMP),
('category-storage-memory','STORAGE & MEMORY','storage-memory','💾','','14',CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
