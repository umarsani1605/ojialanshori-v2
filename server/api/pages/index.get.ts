import { isMysqlConfigured, useDb } from "#server/utils/db";
import { requireAdmin } from "#server/utils/guard";
import { createDatabaseNotConfiguredError } from "#server/utils/runtime";

export default defineEventHandler(async (event) => {
  requireAdmin(event);

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError();

  const db = useDb(event);
  const allPages = await db.query.pages.findMany();

  return { data: allPages };
});
