import { prisma } from "@sales-agent/database";

export async function getDefaultOrganizationId(): Promise<string> {
  const org = await prisma.organization.findFirst({ where: { slug: "default" } });
  if (!org) throw new Error("Run db:seed first");
  return org.id;
}
