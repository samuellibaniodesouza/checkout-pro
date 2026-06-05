import { prisma } from "@/app/lib/prisma";

export function replaceEmailVariables(
  text: string,
  variables: Record<string, string>
) {
  let result = text || "";

  Object.entries(variables).forEach(([key, value]) => {
    result = result.replaceAll(`{{${key}}}`, value);
  });

  return result;
}

export async function getEmailTemplate(key: string) {
  const template = await prisma.emailTemplate.findUnique({
    where: {
      key,
    },
  });

  return template;
}
