-- AlterTable
ALTER TABLE "KnowledgeArticle" ADD COLUMN     "authorName" TEXT NOT NULL DEFAULT 'Ecom Resolutions',
ADD COLUMN     "keywords" TEXT[];
