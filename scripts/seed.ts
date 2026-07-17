import bcrypt from "bcryptjs";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

import { closeDb, getDb } from "../src/lib/db/client";
import { adminUsers } from "../src/lib/db/schema";

const seedEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8),
});

function loadLocalEnv() {
  const envPath = join(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return;
  }

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^(["'])(.*)\1$/, "$2");

    process.env[key] ??= value;
  }
}

function getSeedEnv() {
  loadLocalEnv();

  const parsed = seedEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const fields = parsed.error.issues
      .map((issue) => issue.path.join("."))
      .filter(Boolean)
      .join(", ");

    throw new Error(`Missing or invalid seed environment variables: ${fields}`);
  }

  return parsed.data;
}

async function seed() {
  const env = getSeedEnv();
  const db = getDb(env.DATABASE_URL);
  const now = new Date();
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);

  await db
    .insert(adminUsers)
    .values({
      email: env.ADMIN_EMAIL,
      passwordHash,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: adminUsers.email,
      set: {
        passwordHash,
        updatedAt: now,
      },
    });

  console.log("Admin seed completed.");
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
