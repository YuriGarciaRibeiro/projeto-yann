export type ProjectFormMappedField =
  | "clientArchitectInstagram"
  | "clientArchitectWebsite"
  | "heroVideoAssetId"
  | "slug";

export function normalizeErrorMessage(message: string) {
  return message
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function getProjectFormFieldErrors(error: unknown) {
  const message = error instanceof Error ? error.message : "Não foi possível salvar o projeto.";
  const normalizedMessage = normalizeErrorMessage(message);

  if (message.includes("projects_slug_unique")) {
    return {
      slug: "Este endereço da página já está em uso. Escolha outro.",
    } satisfies Partial<Record<ProjectFormMappedField, string>>;
  }

  if (message.includes("Client architect website")) {
    return {
      clientArchitectWebsite: "Informe um site válido começando com http:// ou https://.",
    } satisfies Partial<Record<ProjectFormMappedField, string>>;
  }

  if (message.includes("Client architect Instagram")) {
    return {
      clientArchitectInstagram: "Informe um Instagram válido, como @nome ou uma URL completa.",
    } satisfies Partial<Record<ProjectFormMappedField, string>>;
  }

  if (
    (normalizedMessage.includes("video de abertura") &&
      normalizedMessage.includes("versao otimizada")) ||
    (normalizedMessage.includes("hero video") &&
      normalizedMessage.includes("scrub video asset"))
  ) {
    return {
      heroVideoAssetId: "Escolha a versão otimizada para rolagem do vídeo de abertura.",
    } satisfies Partial<Record<ProjectFormMappedField, string>>;
  }

  return null;
}
