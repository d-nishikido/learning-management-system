-- DropForeignKey
ALTER TABLE "progress_history" DROP CONSTRAINT "progress_history_progress_id_fkey";

-- DropForeignKey
ALTER TABLE "progress_history" DROP CONSTRAINT "progress_history_changed_by_fkey";

-- DropTable
DROP TABLE "progress_history";

┌─────────────────────────────────────────────────────────┐
│  Update available 5.22.0 -> 6.16.3                      │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘
