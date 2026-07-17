import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "../env";

import * as schema from "./schema";

let client: postgres.Sql | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb(databaseUrl = env.DATABASE_URL) {
  if (!client) {
    client = postgres(databaseUrl, { prepare: false });
  }

  if (!db) {
    db = drizzle(client, { schema });
  }

  return db;
}

export async function closeDb() {
  if (client) {
    await client.end();
    client = null;
    db = null;
  }
}
