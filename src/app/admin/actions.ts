"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_SESSION_COOKIE,
  getExpiredSessionCookieOptions,
  verifySessionCookieValue,
} from "@/lib/auth/session";
import {
  createMediaAsset,
  deleteProject,
  deleteProjectSection,
  type ProjectUpsert,
  upsertProjectSection,
  upsertProject,
} from "@/lib/db/queries";
import {
  mediaUsageScopes,
  projectSectionTypes,
  type MediaUsageScope,
  type ProjectSectionType,
} from "@/lib/db/schema";
import {
  getPublicMediaUrl,
  validateMediaUploadInput,
  validateUploadStorageKey,
  verifyUploadedMediaObject,
} from "@/lib/storage/s3";

const ADMIN_PATH = "/admin";

type ProjectFormField =
  | "category"
  | "clientArchitectEmail"
  | "clientArchitectImageAssetId"
  | "clientArchitectInstagram"
  | "clientArchitectName"
  | "clientArchitectPhone"
  | "clientArchitectWebsite"
  | "fallbackImageAssetId"
  | "heroVideoAssetId"
  | "location"
  | "shortDescription"
  | "slug"
  | "subtitle"
  | "title"
  | "year";

type ProjectFormValues = Record<ProjectFormField, string> & {
  id: string;
  isPublished: boolean;
};

export type ProjectFormState = {
  fieldErrors: Partial<Record<ProjectFormField, string>>;
  formError?: string;
  submittedValues?: ProjectFormValues;
  submissionKey: number;
};

async function requireAdminSession() {
  const cookieStore = await cookies();
  const session = await verifySessionCookieValue(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}

function getString(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function nullableString(value: string) {
  return value.length > 0 ? value : null;
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseProjectSectionType(value: string): ProjectSectionType {
  const sectionType = projectSectionTypes.find((type) => type === value);

  if (!sectionType) {
    throw new Error("Escolha um tipo de bloco válido.");
  }

  return sectionType;
}

function parseMediaUsageScope(value: string): MediaUsageScope {
  const usageScope = mediaUsageScopes.find((scope) => scope === value);

  if (!usageScope) {
    throw new Error("Escolha onde este arquivo será usado.");
  }

  return usageScope;
}

function parseJsonObject(value: string) {
  if (!value) {
    return {};
  }

  const parsed = JSON.parse(value) as unknown;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("As configurações avançadas precisam estar em formato válido.");
  }

  return parsed as Record<string, unknown>;
}

function statusRedirect(status: string) {
  redirect(`${ADMIN_PATH}?status=${encodeURIComponent(status)}`);
}

function errorRedirect(error: string) {
  redirect(`${ADMIN_PATH}?error=${encodeURIComponent(error)}`);
}

function projectStatusRedirect(projectId: string, status: string) {
  redirect(`/admin/projetos/${projectId}?status=${encodeURIComponent(status)}`);
}

function projectErrorRedirect(projectId: string, error: string) {
  redirect(`/admin/projetos/${projectId}?error=${encodeURIComponent(error)}`);
}

function getProjectFormValues(formData: FormData): ProjectFormValues {
  return {
    category: getString(formData, "category"),
    clientArchitectEmail: getString(formData, "clientArchitectEmail"),
    clientArchitectImageAssetId: getString(formData, "clientArchitectImageAssetId"),
    clientArchitectInstagram: getString(formData, "clientArchitectInstagram"),
    clientArchitectName: getString(formData, "clientArchitectName"),
    clientArchitectPhone: getString(formData, "clientArchitectPhone"),
    clientArchitectWebsite: getString(formData, "clientArchitectWebsite"),
    fallbackImageAssetId: getString(formData, "fallbackImageAssetId"),
    heroVideoAssetId: getString(formData, "heroVideoAssetId"),
    id: getString(formData, "id"),
    isPublished: formData.get("isPublished") === "on",
    location: getString(formData, "location"),
    shortDescription: getString(formData, "shortDescription"),
    slug: getString(formData, "slug"),
    subtitle: getString(formData, "subtitle"),
    title: getString(formData, "title"),
    year: getString(formData, "year"),
  };
}

function getProjectUpsertInput(values: ProjectFormValues): {
  fieldErrors: ProjectFormState["fieldErrors"];
  input?: ProjectUpsert;
} {
  const fieldErrors: ProjectFormState["fieldErrors"] = {};
  const slug = normalizeSlug(values.slug || values.title);
  const year = Number.parseInt(values.year, 10);

  if (!values.title) {
    fieldErrors.title = "Informe o nome do projeto.";
  }

  if (!slug) {
    fieldErrors.slug = "Informe o endereço da página.";
  }

  if (!values.year || Number.isNaN(year)) {
    fieldErrors.year = "Informe um ano válido.";
  }

  if (!values.clientArchitectName) {
    fieldErrors.clientArchitectName = "Informe o nome do arquiteto responsável.";
  }

  if (values.isPublished) {
    const hasContactMethod = [
      values.clientArchitectEmail,
      values.clientArchitectPhone,
      values.clientArchitectWebsite,
      values.clientArchitectInstagram,
    ].some(Boolean);

    if (!hasContactMethod) {
      fieldErrors.clientArchitectEmail =
        "Para publicar, informe pelo menos um contato: e-mail, telefone, site ou Instagram.";
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return {
    fieldErrors,
    input: {
      id: nullableString(values.id) ?? undefined,
      category: values.category,
      clientArchitectEmail: nullableString(values.clientArchitectEmail),
      clientArchitectImageAssetId: nullableString(values.clientArchitectImageAssetId),
      clientArchitectInstagram: nullableString(values.clientArchitectInstagram),
      clientArchitectName: values.clientArchitectName,
      clientArchitectPhone: nullableString(values.clientArchitectPhone),
      clientArchitectWebsite: nullableString(values.clientArchitectWebsite),
      fallbackImageAssetId: nullableString(values.fallbackImageAssetId),
      heroVideoAssetId: nullableString(values.heroVideoAssetId),
      isPublished: values.isPublished,
      location: values.location,
      shortDescription: values.shortDescription,
      slug,
      subtitle: values.subtitle,
      title: values.title,
      year,
    },
  };
}

function getProjectFormErrorState(
  previousState: ProjectFormState,
  values: ProjectFormValues,
  error: unknown,
): ProjectFormState {
  const message = error instanceof Error ? error.message : "Não foi possível salvar o projeto.";

  if (message.includes("projects_slug_unique") || message.includes("duplicate key")) {
    return {
      fieldErrors: {
        slug: "Este endereço da página já está em uso. Escolha outro.",
      },
      submittedValues: values,
      submissionKey: previousState.submissionKey + 1,
    };
  }

  if (message.includes("Client architect website")) {
    return {
      fieldErrors: {
        clientArchitectWebsite: "Informe um site válido começando com http:// ou https://.",
      },
      submittedValues: values,
      submissionKey: previousState.submissionKey + 1,
    };
  }

  if (message.includes("Client architect Instagram")) {
    return {
      fieldErrors: {
        clientArchitectInstagram: "Informe um Instagram válido, como @nome ou uma URL completa.",
      },
      submittedValues: values,
      submissionKey: previousState.submissionKey + 1,
    };
  }

  if (message.includes("Vídeo de abertura") && message.includes("versão otimizada")) {
    return {
      fieldErrors: {
        heroVideoAssetId: "Escolha a versão otimizada para rolagem do vídeo de abertura.",
      },
      submittedValues: values,
      submissionKey: previousState.submissionKey + 1,
    };
  }

  return {
    fieldErrors: {},
    formError: message,
    submittedValues: values,
    submissionKey: previousState.submissionKey + 1,
  };
}

export async function saveProjectFormAction(
  previousState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  await requireAdminSession();

  const values = getProjectFormValues(formData);
  const { fieldErrors, input } = getProjectUpsertInput(values);

  if (!input) {
    return {
      fieldErrors,
      submittedValues: values,
      submissionKey: previousState.submissionKey + 1,
    };
  }

  let projectId = input.id;

  try {
    const project = await upsertProject(input);
    projectId = project.id;

    revalidatePath(ADMIN_PATH);
    revalidatePath(`/admin/projetos/${project.id}`);
    revalidatePath(`/projetos/${project.slug}`);
    revalidatePath("/");
  } catch (error) {
    return getProjectFormErrorState(previousState, values, error);
  }

  if (input.id) {
    redirect(`/admin/projetos/${projectId}?status=${encodeURIComponent("Projeto salvo.")}`);
  }

  redirect(`/admin/projetos/${projectId}?status=${encodeURIComponent("Projeto criado.")}`);
}

export async function saveProjectAction(formData: FormData) {
  await requireAdminSession();

  try {
    const id = nullableString(getString(formData, "id")) ?? undefined;
    const title = getString(formData, "title");
    const slug = normalizeSlug(getString(formData, "slug") || title);
    const year = Number.parseInt(getString(formData, "year"), 10);
    const clientArchitectName = getString(formData, "clientArchitectName");

    if (!title || !slug || Number.isNaN(year)) {
      throw new Error("Nome do projeto, endereço da página e ano são obrigatórios.");
    }

    if (!clientArchitectName) {
      throw new Error("Nome do arquiteto responsável é obrigatório.");
    }

    const project = await upsertProject({
      id,
      category: getString(formData, "category"),
      clientArchitectEmail: nullableString(getString(formData, "clientArchitectEmail")),
      clientArchitectImageAssetId: nullableString(
        getString(formData, "clientArchitectImageAssetId"),
      ),
      clientArchitectInstagram: nullableString(getString(formData, "clientArchitectInstagram")),
      clientArchitectName,
      clientArchitectPhone: nullableString(getString(formData, "clientArchitectPhone")),
      clientArchitectWebsite: nullableString(getString(formData, "clientArchitectWebsite")),
      fallbackImageAssetId: nullableString(getString(formData, "fallbackImageAssetId")),
      heroVideoAssetId: nullableString(getString(formData, "heroVideoAssetId")),
      isPublished: formData.get("isPublished") === "on",
      location: getString(formData, "location"),
      shortDescription: getString(formData, "shortDescription"),
      slug,
      subtitle: getString(formData, "subtitle"),
      title,
      year,
    });

    revalidatePath(ADMIN_PATH);
    revalidatePath(`/admin/projetos/${project.id}`);
    revalidatePath("/");

    if (id) {
      redirect(`/admin/projetos/${project.id}?status=${encodeURIComponent("Projeto salvo.")}`);
    }

    redirect(`/admin/projetos/${project.id}?status=${encodeURIComponent("Projeto criado.")}`);
  } catch (error) {
    errorRedirect(error instanceof Error ? error.message : "Não foi possível salvar o projeto.");
  }
}

export async function saveProjectSectionAction(formData: FormData) {
  await requireAdminSession();
  const projectId = getString(formData, "projectId");

  try {
    const sortOrder = Number.parseInt(getString(formData, "sortOrder"), 10);

    if (!projectId) {
      throw new Error("Escolha um projeto para alterar os blocos.");
    }

    if (Number.isNaN(sortOrder) || sortOrder < 1) {
      throw new Error("A posição do bloco precisa ser válida.");
    }

    await upsertProjectSection({
      id: nullableString(getString(formData, "id")) ?? undefined,
      body: nullableString(getString(formData, "body")),
      caption: nullableString(getString(formData, "caption")),
      isEnabled: formData.get("isEnabled") === "on",
      metadata: parseJsonObject(getString(formData, "metadata")),
      posterMediaAssetId: nullableString(getString(formData, "posterMediaAssetId")),
      primaryMediaAssetId: nullableString(getString(formData, "primaryMediaAssetId")),
      projectId,
      sortOrder: sortOrder * 10,
      title: nullableString(getString(formData, "title")),
      type: parseProjectSectionType(getString(formData, "type")),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível salvar o bloco.";
    if (projectId) {
      projectErrorRedirect(projectId, message);
    }
    errorRedirect(message);
  }

  revalidatePath(ADMIN_PATH);
  revalidatePath(`/admin/projetos/${projectId}`);
  revalidatePath("/");
  projectStatusRedirect(projectId, "Bloco salvo.");
}

export async function deleteProjectSectionAction(formData: FormData) {
  await requireAdminSession();
  const projectId = getString(formData, "projectId");

  try {
    const sectionId = getString(formData, "id");

    if (!sectionId || !projectId) {
      throw new Error("Bloco não encontrado.");
    }

    await deleteProjectSection(sectionId, projectId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível apagar o bloco.";
    if (projectId) {
      projectErrorRedirect(projectId, message);
    }
    errorRedirect(message);
  }

  revalidatePath(ADMIN_PATH);
  revalidatePath(`/admin/projetos/${projectId}`);
  revalidatePath("/");
  projectStatusRedirect(projectId, "Bloco apagado.");
}

export async function deleteProjectAction(formData: FormData) {
  await requireAdminSession();

  try {
    const projectId = getString(formData, "projectId");

    if (!projectId) {
      throw new Error("Projeto não encontrado.");
    }

    await deleteProject(projectId);
  } catch (error) {
    errorRedirect(error instanceof Error ? error.message : "Não foi possível apagar o projeto.");
  }

  revalidatePath(ADMIN_PATH);
  revalidatePath("/");
  statusRedirect("Projeto apagado.");
}

export async function saveMediaAssetAction(input: {
  altText: string;
  mimeType: string;
  projectId?: string | null;
  sizeBytes: number;
  storageKey: string;
  usageScope: MediaUsageScope;
}) {
  await requireAdminSession();

  try {
    const altText = input.altText.trim();
    const storageKey = input.storageKey.trim();
    const mimeType = input.mimeType.trim();
    const usageScope = parseMediaUsageScope(input.usageScope);
    const projectId = usageScope === "project" ? input.projectId?.trim() : null;

    if (!altText || !storageKey || !mimeType) {
      throw new Error("As informações do arquivo estão incompletas.");
    }

    if (usageScope === "project" && !projectId) {
      throw new Error("Escolha um projeto para este arquivo.");
    }

    validateMediaUploadInput({ mimeType, sizeBytes: input.sizeBytes });
    validateUploadStorageKey(storageKey);
    await verifyUploadedMediaObject({ mimeType, sizeBytes: input.sizeBytes, storageKey });

    await createMediaAsset({
      altText,
      mimeType,
      projectId,
      sizeBytes: input.sizeBytes,
      storageKey,
      usageScope,
      url: getPublicMediaUrl(storageKey),
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Não foi possível salvar o arquivo.",
      ok: false,
    };
  }

  revalidatePath(ADMIN_PATH);
  revalidatePath("/");

  return { ok: true };
}

export async function logoutAdminAction() {
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, "", getExpiredSessionCookieOptions());
  redirect("/admin/login");
}
