-- SplitTrip: adds the optional trip budget to each group (#50)
-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "budget" INTEGER;
