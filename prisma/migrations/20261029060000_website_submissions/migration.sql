CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'REPLIED', 'ARCHIVED');

CREATE TABLE "NewsletterSubscription" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "source" TEXT NOT NULL DEFAULT 'website',
  "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "unsubscribedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NewsletterSubscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NewsletterSubscription_email_key" ON "NewsletterSubscription"("email");
CREATE INDEX "NewsletterSubscription_status_subscribedAt_idx" ON "NewsletterSubscription"("status", "subscribedAt");

CREATE TABLE "ContactSubmission" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL DEFAULT '',
  "service" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
  "adminNote" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ContactSubmission_status_createdAt_idx" ON "ContactSubmission"("status", "createdAt");
CREATE INDEX "ContactSubmission_email_idx" ON "ContactSubmission"("email");

CREATE TABLE "TrainingEnquiry" (
  "id" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT NOT NULL DEFAULT '',
  "course" TEXT NOT NULL,
  "level" TEXT NOT NULL,
  "schedule" TEXT NOT NULL,
  "startDate" TEXT NOT NULL DEFAULT '',
  "goal" TEXT NOT NULL DEFAULT '',
  "notes" TEXT NOT NULL DEFAULT '',
  "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
  "adminNote" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TrainingEnquiry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TrainingEnquiry_status_createdAt_idx" ON "TrainingEnquiry"("status", "createdAt");
CREATE INDEX "TrainingEnquiry_phone_idx" ON "TrainingEnquiry"("phone");
