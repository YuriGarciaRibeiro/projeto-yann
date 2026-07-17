"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { MediaAsset, Project } from "@/lib/db/schema";

import { saveProjectFormAction, type ProjectFormState } from "../actions";

type ProjectFormProps = {
  mediaAssets: MediaAsset[];
  project?: Project;
};

function getMediaDisplayName(asset: MediaAsset) {
  return asset.altText.replace(/ - (rolagem otimizado|normal com áudio)$/, "");
}

export function ProjectForm({ mediaAssets, project }: ProjectFormProps) {
  const title = project ? `Editar projeto: ${project.title}` : "Criar projeto";
  const idPrefix = project?.id ?? "new-project";
  const initialState: ProjectFormState = {
    fieldErrors: {},
    submissionKey: 0,
  };
  const [state, formAction] = useActionState(saveProjectFormAction, initialState);
  const values = state.submittedValues;

  const fieldValue = (name: keyof NonNullable<ProjectFormState["submittedValues"]>) => {
    if (values) {
      const value = values[name];
      return typeof value === "string" ? value : "";
    }

    if (!project) {
      return "";
    }

    const value = project[name as keyof Project];
    return typeof value === "string" || typeof value === "number" ? String(value) : "";
  };

  const fieldErrors = state.fieldErrors;

  return (
    <section className="border border-neutral-200 bg-white p-5 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-normal tracking-[-0.02em]">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            Preencha as informações que aparecem na página pública do projeto.
          </p>
        </div>
        {project?.slug ? (
          <Link
            className="inline-flex min-h-11 items-center justify-center border border-neutral-300 px-4 text-sm uppercase tracking-[0.16em] hover:border-neutral-950 focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-neutral-950"
            href={`/projetos/${project.slug}`}
            target="_blank"
          >
            Ver página do projeto
          </Link>
        ) : null}
      </div>
      <form action={formAction} className="mt-6 grid gap-5" key={state.submissionKey} noValidate>
        <input name="id" type="hidden" value={project?.id ?? ""} />
        {state.formError ? (
          <p className="border border-red-300 bg-red-50 px-3 py-2 text-sm leading-6 text-red-700">
            {state.formError}
          </p>
        ) : null}
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            defaultValue={fieldValue("title")}
            error={fieldErrors.title}
            idPrefix={idPrefix}
            label="Nome do projeto"
            name="title"
            required
          />
          <TextField
            defaultValue={fieldValue("slug")}
            error={fieldErrors.slug}
            helpText="Esse texto vira o endereço público, por exemplo: /projetos/casa-branca."
            idPrefix={idPrefix}
            label="Endereço da página"
            name="slug"
          />
          <TextField
            defaultValue={fieldValue("subtitle")}
            error={fieldErrors.subtitle}
            idPrefix={idPrefix}
            label="Frase curta"
            name="subtitle"
          />
          <TextField
            defaultValue={fieldValue("category")}
            error={fieldErrors.category}
            idPrefix={idPrefix}
            label="Tipo de projeto"
            name="category"
          />
          <TextField
            defaultValue={fieldValue("location")}
            error={fieldErrors.location}
            idPrefix={idPrefix}
            label="Local"
            name="location"
          />
          <TextField
            defaultValue={fieldValue("year")}
            error={fieldErrors.year}
            idPrefix={idPrefix}
            label="Ano"
            name="year"
            required
            type="number"
          />
        </div>
        <TextArea
          defaultValue={fieldValue("shortDescription")}
          error={fieldErrors.shortDescription}
          idPrefix={idPrefix}
          label="Descrição curta"
          name="shortDescription"
          required
          rows={4}
        />
        <fieldset className="grid gap-5 border border-neutral-200 p-4">
          <legend className="px-1 text-sm uppercase tracking-[0.14em]">
            Arquiteto responsável
          </legend>
          <div className="grid gap-5 md:grid-cols-2">
            <TextField
              defaultValue={fieldValue("clientArchitectName")}
              error={fieldErrors.clientArchitectName}
              idPrefix={idPrefix}
              label="Nome"
              name="clientArchitectName"
              required
            />
            <TextField
              defaultValue={fieldValue("clientArchitectEmail")}
              error={fieldErrors.clientArchitectEmail}
              idPrefix={idPrefix}
              label="E-mail"
              name="clientArchitectEmail"
              type="email"
            />
            <TextField
              defaultValue={fieldValue("clientArchitectPhone")}
              error={fieldErrors.clientArchitectPhone}
              idPrefix={idPrefix}
              label="Telefone"
              name="clientArchitectPhone"
              type="tel"
            />
            <TextField
              defaultValue={fieldValue("clientArchitectWebsite")}
              error={fieldErrors.clientArchitectWebsite}
              idPrefix={idPrefix}
              label="Site"
              name="clientArchitectWebsite"
              type="url"
            />
            <TextField
              defaultValue={fieldValue("clientArchitectInstagram")}
              error={fieldErrors.clientArchitectInstagram}
              idPrefix={idPrefix}
              label="Instagram"
              name="clientArchitectInstagram"
            />
            <MediaSelect
              assets={mediaAssets}
              currentId={
                values ? fieldValue("clientArchitectImageAssetId") : project?.clientArchitectImageAssetId
              }
              error={fieldErrors.clientArchitectImageAssetId}
              idPrefix={idPrefix}
              label="Imagem do arquiteto"
              name="clientArchitectImageAssetId"
              typePrefix="image/"
            />
          </div>
        </fieldset>
        <div className="grid gap-5 md:grid-cols-2">
          <MediaSelect
            assets={mediaAssets}
            currentId={values ? fieldValue("heroVideoAssetId") : project?.heroVideoAssetId}
            error={fieldErrors.heroVideoAssetId}
            idPrefix={idPrefix}
            label="Vídeo de abertura"
            name="heroVideoAssetId"
            typePrefix="video/"
            videoVariant="scrub"
          />
          <MediaSelect
            assets={mediaAssets}
            currentId={values ? fieldValue("fallbackImageAssetId") : project?.fallbackImageAssetId}
            error={fieldErrors.fallbackImageAssetId}
            idPrefix={idPrefix}
            label="Imagem alternativa"
            name="fallbackImageAssetId"
            typePrefix="image/"
          />
        </div>
        <label
          className="flex min-h-11 items-center gap-3 text-sm"
          htmlFor={`${idPrefix}-isPublished`}
        >
            <input
              className="size-4 accent-neutral-950"
              defaultChecked={values ? values.isPublished : (project?.isPublished ?? false)}
              id={`${idPrefix}-isPublished`}
              name="isPublished"
              type="checkbox"
            />
            Publicado
          </label>
        <SubmitButton />
      </form>
    </section>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="min-h-11 justify-self-start border border-neutral-950 px-5 text-sm uppercase tracking-[0.16em] hover:bg-neutral-950 hover:text-white focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-neutral-950 disabled:cursor-wait disabled:border-neutral-300 disabled:text-neutral-400"
      disabled={pending}
      type="submit"
    >
      {pending ? "Salvando..." : "Salvar projeto"}
    </button>
  );
}

function TextField({
  defaultValue = "",
  error,
  helpText,
  idPrefix,
  label,
  name,
  required = false,
  type = "text",
}: {
  defaultValue?: string;
  error?: string;
  helpText?: string;
  idPrefix: string;
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  const id = `${idPrefix}-${name}`;

  return (
    <div className="grid min-w-0 gap-2">
      <label className="text-sm uppercase tracking-[0.14em]" htmlFor={id}>
        {label}
      </label>
      <input
        className="min-h-12 border border-neutral-300 bg-white px-3 text-base outline-none focus:border-neutral-950"
        defaultValue={defaultValue}
        id={id}
        name={name}
        required={required}
        type={type}
      />
      {helpText ? <p className="text-xs leading-5 text-neutral-500">{helpText}</p> : null}
      {error ? <p className="text-sm leading-5 text-red-700">{error}</p> : null}
    </div>
  );
}

function TextArea({
  defaultValue = "",
  error,
  idPrefix,
  label,
  name,
  required = false,
  rows = 4,
}: {
  defaultValue?: string;
  error?: string;
  idPrefix: string;
  label: string;
  name: string;
  required?: boolean;
  rows?: number;
}) {
  const id = `${idPrefix}-${name}`;

  return (
    <div className="grid gap-2">
      <label className="text-sm uppercase tracking-[0.14em]" htmlFor={id}>
        {label}
      </label>
      <textarea
        className="border border-neutral-300 bg-white px-3 py-3 text-base leading-6 outline-none focus:border-neutral-950"
        defaultValue={defaultValue}
        id={id}
        name={name}
        required={required}
        rows={rows}
      />
      {error ? <p className="text-sm leading-5 text-red-700">{error}</p> : null}
    </div>
  );
}

function MediaSelect({
  assets,
  currentId,
  error,
  idPrefix,
  label,
  name,
  typePrefix,
  videoVariant,
}: {
  assets: MediaAsset[];
  currentId?: string | null;
  error?: string;
  idPrefix: string;
  label: string;
  name: string;
  typePrefix: string;
  videoVariant?: MediaAsset["videoVariant"];
}) {
  const filteredAssets = assets.filter((asset) => {
    if (!asset.mimeType.startsWith(typePrefix)) {
      return false;
    }

    if (videoVariant && asset.videoVariant && asset.videoVariant !== videoVariant) {
      return false;
    }

    return true;
  });
  const id = `${idPrefix}-${name}`;

  return (
    <div className="grid gap-2">
      <label className="text-sm uppercase tracking-[0.14em]" htmlFor={id}>
        {label}
      </label>
      <select
        className="min-h-12 w-full min-w-0 border border-neutral-300 bg-white px-3 text-base outline-none focus:border-neutral-950"
        defaultValue={currentId ?? ""}
        id={id}
        name={name}
      >
        <option value="">Nenhum arquivo selecionado</option>
        {filteredAssets.map((asset) => (
          <option key={asset.id} value={asset.id}>
            {getMediaDisplayName(asset)} - {asset.mimeType}
          </option>
        ))}
      </select>
      {error ? <p className="text-sm leading-5 text-red-700">{error}</p> : null}
    </div>
  );
}
