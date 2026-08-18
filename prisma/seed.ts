import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";
import {
  knowledgeArticles,
  platforms,
  pricingTiers,
  servicesByPlatform,
} from "./catalog";

const prisma = new PrismaClient();

async function upsertStaffUser(email: string | undefined, password: string | undefined, role: Role, name: string) {
  if (!email || !password) return null;
  const passwordHash = await hash(password, 12);
  return prisma.user.upsert({
    where: { email },
    update: { role, passwordHash, name },
    create: { email, role, passwordHash, name },
  });
}

async function main() {
  await prisma.caseSequence.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, lastNumber: 10000 },
  });

  await prisma.appSetting.upsert({
    where: { key: "diagnosticCreditEnabled" },
    update: {},
    create: { key: "diagnosticCreditEnabled", value: true },
  });
  await prisma.appSetting.upsert({
    where: { key: "diagnosticCreditPolicy" },
    update: {},
    create: {
      key: "diagnosticCreditPolicy",
      value: {
        enabled: true,
        message: "Your diagnostic fee can be credited toward the recommended resolution.",
      },
    },
  });

  for (const tier of pricingTiers) {
    await prisma.pricingTier.upsert({
      where: { slug: tier.slug },
      update: tier,
      create: tier,
    });
  }

  for (const platform of platforms) {
    const record = await prisma.platform.upsert({
      where: { slug: platform.slug },
      update: {
        name: platform.name,
        shortName: platform.shortName,
        description: platform.description,
        accent: platform.accent,
        sortOrder: platform.sortOrder,
        isActive: true,
      },
      create: {
        slug: platform.slug,
        name: platform.name,
        shortName: platform.shortName,
        description: platform.description,
        accent: platform.accent,
        sortOrder: platform.sortOrder,
      },
    });

    const categoryIds = new Map<string, string>();
    for (const [index, category] of platform.categories.entries()) {
      const created = await prisma.serviceCategory.upsert({
        where: {
          platformId_slug: { platformId: record.id, slug: category.slug },
        },
        update: { name: category.name, sortOrder: index },
        create: {
          slug: category.slug,
          name: category.name,
          platformId: record.id,
          sortOrder: index,
        },
      });
      categoryIds.set(category.slug, created.id);
    }

    const services = servicesByPlatform[platform.slug] ?? [];
    for (const [index, service] of services.entries()) {
      const seoTitle = `${service.name} | Ecom Resolutions`;
      const seoDescription = service.shortDescription;
      const created = await prisma.service.upsert({
        where: { slug: service.slug },
        update: {
          name: service.name,
          shortDescription: service.shortDescription,
          description: service.description,
          includedScope: service.includedScope,
          excludedScope: service.excludedScope,
          requiredInformation: service.requiredInformation,
          requiredAccess: service.requiredAccess,
          requiredAttachments: service.requiredAttachments,
          intakeQuestions: service.intakeQuestions,
          priceCents: service.priceCents,
          priceFrom: service.priceFrom ?? false,
          complexity: service.complexity,
          slaLabel: service.slaLabel,
          slaHours: service.slaHours,
          isPopular: service.isPopular ?? false,
          diagnosticEligible: service.diagnosticEligible ?? false,
          seoTitle,
          seoDescription,
          ogTitle: seoTitle,
          ogDescription: seoDescription,
          sortOrder: index,
          platformId: record.id,
          categoryId: categoryIds.get(service.category),
        },
        create: {
          slug: service.slug,
          name: service.name,
          shortDescription: service.shortDescription,
          description: service.description,
          includedScope: service.includedScope,
          excludedScope: service.excludedScope,
          requiredInformation: service.requiredInformation,
          requiredAccess: service.requiredAccess,
          requiredAttachments: service.requiredAttachments,
          intakeQuestions: service.intakeQuestions,
          priceCents: service.priceCents,
          priceFrom: service.priceFrom ?? false,
          complexity: service.complexity,
          slaLabel: service.slaLabel,
          slaHours: service.slaHours,
          isPopular: service.isPopular ?? false,
          diagnosticEligible: service.diagnosticEligible ?? false,
          seoTitle,
          seoDescription,
          ogTitle: seoTitle,
          ogDescription: seoDescription,
          sortOrder: index,
          platformId: record.id,
          categoryId: categoryIds.get(service.category),
        },
      });

      if (service.problem) {
        await prisma.problemPage.upsert({
          where: { slug: service.problem.slug },
          update: {
            title: service.problem.title,
            h1: service.problem.h1,
            problem: service.problem.problem,
            commonCauses: service.problem.commonCauses,
            whatWeCheck: service.problem.whatWeCheck,
            whatWeCanFix: service.problem.whatWeCanFix,
            faqs: service.problem.faqs,
            seoTitle: `${service.problem.h1.replace("?", "")} | Ecom Resolutions`,
            seoDescription: service.problem.problem.slice(0, 155),
            platformId: record.id,
            serviceId: created.id,
          },
          create: {
            slug: service.problem.slug,
            title: service.problem.title,
            h1: service.problem.h1,
            problem: service.problem.problem,
            commonCauses: service.problem.commonCauses,
            whatWeCheck: service.problem.whatWeCheck,
            whatWeCanFix: service.problem.whatWeCanFix,
            faqs: service.problem.faqs,
            seoTitle: `${service.problem.h1.replace("?", "")} | Ecom Resolutions`,
            seoDescription: service.problem.problem.slice(0, 155),
            platformId: record.id,
            serviceId: created.id,
          },
        });
      }
    }
  }

  for (const article of knowledgeArticles) {
    await prisma.knowledgeArticle.upsert({
      where: { slug: article.slug },
      update: article,
      create: article,
    });
  }

  await upsertStaffUser(
    process.env.SEED_ADMIN_EMAIL,
    process.env.SEED_ADMIN_PASSWORD,
    Role.SUPER_ADMIN,
    "Ecom Resolutions Admin",
  );
  await upsertStaffUser(
    process.env.SEED_EXPERT_EMAIL,
    process.env.SEED_EXPERT_PASSWORD,
    Role.EXPERT,
    "Ecom Resolutions Specialist",
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
