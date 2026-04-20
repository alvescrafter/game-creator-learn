-- CreateTable users
CREATE TABLE "users" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "google_id" TEXT,
    "facebook_id" TEXT,
    "github_id" TEXT,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT,
    "name" TEXT,
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "subscription_active" BOOLEAN NOT NULL DEFAULT false,
    "subscription_end" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable payments
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "stripe_payment_id" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tokens_purchased" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable usage
CREATE TABLE "usage" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "tokens_used" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
CREATE UNIQUE INDEX "users_facebook_id_key" ON "users"("facebook_id");
CREATE UNIQUE INDEX "users_github_id_key" ON "users"("github_id");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
