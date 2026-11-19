-- SplitTrip: adds the optional spending limit to each member (#51)
-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "spendingLimit" INTEGER;
