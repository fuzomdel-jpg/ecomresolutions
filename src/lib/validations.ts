import { z } from "zod";

export const complexitySchema = z.enum(["QUICK", "STANDARD", "COMPLEX", "DIAGNOSTIC"]);

export const aiDiagnosisSchema = z.object({
  platform: z.string().nullable(),
  issueCategory: z.string(),
  probableCause: z.string(),
  confidence: z.number().min(0).max(1),
  complexity: complexitySchema,
  recommendedService: z.string().nullable(),
  recommendedPrice: z.number().int().nonnegative().nullable(),
  estimatedSla: z.string().nullable(),
  additionalInformationRequired: z.array(z.string()),
  summary: z.string(),
  caution: z.string().default(
    "This is a likely issue and recommended resolution, subject to platform systems and policies.",
  ),
});

export type AIDiagnosis = z.infer<typeof aiDiagnosisSchema>;

export const intakeStartSchema = z.object({
  problemText: z.string().min(8, "Tell us a bit more about what happened.").max(8000),
  platformSlug: z.string().optional(),
  serviceSlug: z.string().optional(),
});

export const intakeReplySchema = z.object({
  sessionId: z.string(),
  message: z.string().max(8000).optional(),
  answers: z.record(z.string(), z.string()).optional(),
  skip: z.boolean().optional(),
});

export const signupSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const caseMessageSchema = z.object({
  body: z.string().min(1).max(8000),
});

export const internalNoteSchema = z.object({
  body: z.string().min(1).max(8000),
});

export const resolutionSchema = z.object({
  problem: z.string().min(1),
  rootCause: z.string().min(1),
  actionTaken: z.string().min(1),
  verification: z.string().min(1),
  result: z.string().min(1),
  recommendedPrevention: z.string().min(1),
});

export const serviceUpdateSchema = z.object({
  name: z.string().min(1),
  shortDescription: z.string().min(1),
  description: z.string().min(1),
  priceCents: z.number().int().nonnegative(),
  priceFrom: z.boolean(),
  slaLabel: z.string().min(1),
  slaHours: z.number().int().positive(),
  complexity: complexitySchema,
  isActive: z.boolean(),
  isPopular: z.boolean(),
  diagnosticEligible: z.boolean(),
  diagnosticCreditEnabled: z.boolean(),
  subscriptionEligible: z.boolean(),
  includedScope: z.array(z.string()),
  excludedScope: z.array(z.string()),
  requiredInformation: z.array(z.string()),
  requiredAccess: z.array(z.string()),
  requiredAttachments: z.array(z.string()),
  seoTitle: z.string().min(1),
  seoDescription: z.string().min(1),
});

export const blogSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  excerpt: z.string().min(1).max(400),
  body: z.string().min(1),
  authorName: z.string().min(1).max(120),
  keywords: z.array(z.string()),
  published: z.boolean(),
  seoTitle: z.string().min(1).max(200),
  seoDescription: z.string().min(1).max(320),
});

export const ALLOWED_UPLOAD_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "text/csv",
  "text/plain",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
