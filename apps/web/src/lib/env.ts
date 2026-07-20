import "server-only";

import { z } from "zod";

const envFieldSchemas = {
  BACKEND_PUBLIC_URL: z.string().url().optional(),
} satisfies Record<string, z.ZodType>;

const serverEnvSchema = z.object(envFieldSchemas);

export type Env = z.infer<typeof serverEnvSchema>;

let cachedEnv: Env | null = null;
const cachedFields = new Map<keyof Env, Env[keyof Env]>();

export function getEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const fields = parsed.error.issues
      .map((issue) => issue.path.join("."))
      .filter(Boolean)
      .join(", ");

    throw new Error(`Missing or invalid server environment variables: ${fields}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

function getEnvField<Key extends keyof Env>(key: Key): Env[Key] {
  const cached = cachedFields.get(key);

  if (cached !== undefined) {
    return cached as Env[Key];
  }

  const parsed = envFieldSchemas[key].safeParse(process.env[key]);

  if (!parsed.success) {
    throw new Error(`Missing or invalid server environment variable: ${key}`);
  }

  cachedFields.set(key, parsed.data as Env[Key]);
  return parsed.data as Env[Key];
}

export const env = new Proxy({} as Env, {
  get(_target, property: string) {
    if (!(property in envFieldSchemas)) {
      return undefined;
    }

    return getEnvField(property as keyof Env);
  },
});
