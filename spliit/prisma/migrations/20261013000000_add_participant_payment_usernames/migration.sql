-- SplitTrip: adds the Venmo, PayPal and Cash App usernames to each member (#27)
-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "venmoUsername" TEXT,
ADD COLUMN     "paypalUsername" TEXT,
ADD COLUMN     "cashAppCashtag" TEXT;
