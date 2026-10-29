CREATE TABLE "HomepageSlide" (
  "id" TEXT NOT NULL,
  "eyebrow" TEXT NOT NULL DEFAULT '',
  "title" TEXT NOT NULL,
  "highlight" TEXT NOT NULL DEFAULT '',
  "description" TEXT NOT NULL DEFAULT '',
  "imageUrl" TEXT NOT NULL,
  "alt" TEXT NOT NULL DEFAULT '',
  "primaryLabel" TEXT NOT NULL DEFAULT 'Explore Services',
  "primaryHref" TEXT NOT NULL DEFAULT '/services',
  "secondaryLabel" TEXT NOT NULL DEFAULT 'Buy Products',
  "secondaryHref" TEXT NOT NULL DEFAULT '/shop',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HomepageSlide_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "HomepageSlide_isActive_sortOrder_idx" ON "HomepageSlide"("isActive", "sortOrder");

INSERT INTO "HomepageSlide" ("id","eyebrow","title","highlight","description","imageUrl","alt","primaryLabel","primaryHref","secondaryLabel","secondaryHref","sortOrder","isActive","updatedAt") VALUES
('home-slide-1','ABDUL ICT & ELECTRICAL SOLUTIONS','Electrical & ICT','Services You Can Trust','Electrical installation, CCTV security and expert device repairs.','/images/ABDUL%20ICT%20Technical%20Services%20Showcase-5.png','Abdul ICT team delivering electrical and technical services','Explore Services','/services','Buy Products','/shop',0,true,CURRENT_TIMESTAMP),
('home-slide-2','SECURITY & SURVEILLANCE','Protect Your','Home and Business','Professional CCTV installation and practical security solutions.','/images/Electrical%2C%20Security%2C%20and%20Phone%20Repair%20Services-6.png','CCTV and security system installation','Explore Services','/services','Buy Products','/shop',1,true,CURRENT_TIMESTAMP),
('home-slide-3','PHONE HARDWARE REPAIR','Expert Repairs','Done with Care','Precision phone hardware repair, soldering and troubleshooting.','/images/ABDUL%20ICT%20Services%20in%20Action-4.png','Technician repairing mobile phone hardware','Explore Services','/services','Buy Products','/shop',2,true,CURRENT_TIMESTAMP),
('home-slide-4','ELECTRICAL INSTALLATION','Power Your Space','Safely and Reliably','Trusted electrical wiring and installation for homes and businesses.','/images/Complete%20Electrical%2C%20CCTV%20%26%20Phone%20Repair%20Services-3.png','Electrical installation and technical services','Explore Services','/services','Buy Products','/shop',3,true,CURRENT_TIMESTAMP);