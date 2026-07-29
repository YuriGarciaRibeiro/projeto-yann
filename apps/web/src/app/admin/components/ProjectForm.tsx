"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AdminMediaAsset } from "@/lib/api/admin-media";
import type { AdminProject } from "@/lib/api/admin-projects";

import { saveProjectFormAction, type ProjectFormState } from "../actions";

type ProjectFormProps = {
  mediaAssets: AdminMediaAsset[];
  project?: AdminProject;
};

function getMediaDisplayName(asset: AdminMediaAsset) {
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

    const value = project[name as keyof AdminProject];
    return typeof value === "string" || typeof value === "number" ? String(value) : "";
  };

  const fieldErrors = state.fieldErrors;
  const formRef = useRef<HTMLFormElement>(null);
  const formErrorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const firstErrorField = Object.keys(fieldErrors)[0];

    if (firstErrorField) {
      const field =
        document.getElementById(`${idPrefix}-${firstErrorField}`) ??
        formRef.current?.elements.namedItem(firstErrorField);

      if (field instanceof HTMLElement) {
        field.focus();
      }

      return;
    }

    if (state.formError) {
      formErrorRef.current?.focus();
    }
  }, [fieldErrors, idPrefix, state.formError]);

  return (
    <Card>
      <CardHeader className="gap-4 md:grid-cols-[1fr_auto] md:items-start">
        <div className="grid gap-2">
          <h2 className="text-admin-section-title font-normal tracking-[-0.02em]">{title}</h2>
          <CardDescription className="max-w-2xl text-admin-body leading-6">
            Preencha as informações que aparecem na página pública do projeto.
          </CardDescription>
        </div>
        {project?.slug ? (
          <CardAction className="col-auto row-auto justify-self-start md:justify-self-end">
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={`/projetos/${project.slug}`}
              rel="noreferrer"
              target="_blank"
            >
              Ver página do projeto
            </Link>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        <form action={formAction} key={state.submissionKey} noValidate ref={formRef}>
          <input name="id" type="hidden" value={project?.id ?? ""} />
          {state.formError ? (
            <p
              className="mb-5 border border-destructive bg-destructive/10 px-3 py-2 text-admin-body leading-6 text-destructive"
              ref={formErrorRef}
              role="alert"
              tabIndex={-1}
            >
              {state.formError}
            </p>
          ) : null}
          <FieldGroup className="gap-5">
          <FieldGroup className="grid gap-5 md:grid-cols-2">
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
              defaultValue={fieldValue("heroDisplayName")}
              error={fieldErrors.heroDisplayName}
              helpText="Nome curto que aparece acima do título na Hero."
              idPrefix={idPrefix}
              label="Apelido da Hero"
              name="heroDisplayName"
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
          </FieldGroup>
          <TextArea
            defaultValue={fieldValue("shortDescription")}
            error={fieldErrors.shortDescription}
            idPrefix={idPrefix}
            label="Descrição curta"
            name="shortDescription"
            required
            rows={4}
          />
          <FieldSet className="border border-border p-4">
            <FieldLegend className="px-1 text-admin-label uppercase tracking-[0.14em]" variant="label">
              Arquiteto responsável
            </FieldLegend>
            <FieldGroup className="grid gap-5 md:grid-cols-2">
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
                spellCheck={false}
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
            </FieldGroup>
          </FieldSet>
          <FieldGroup className="grid gap-5 md:grid-cols-2">
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
          </FieldGroup>
          <Field orientation="horizontal">
            <Checkbox
              defaultChecked={values ? values.isPublished : (project?.isPublished ?? false)}
              id={`${idPrefix}-isPublished`}
              name="isPublished"
              uncheckedValue="false"
              value="true"
            />
            <FieldLabel className="text-admin-body" htmlFor={`${idPrefix}-isPublished`}>
              Publicado
            </FieldLabel>
          </Field>
          <SubmitButton />
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      className="justify-self-start"
      disabled={pending}
      type="submit"
      variant="secondary"
    >
      {pending ? "Salvando…" : "Salvar projeto"}
    </Button>
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
  spellCheck,
  type = "text",
}: {
  defaultValue?: string;
  error?: string;
  helpText?: string;
  idPrefix: string;
  label: string;
  name: string;
  required?: boolean;
  spellCheck?: boolean;
  type?: string;
}) {
  const id = `${idPrefix}-${name}`;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const describedBy = [helpText ? descriptionId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <Field className="grid-rows-[auto_auto_minmax(1.25rem,_auto)]" data-invalid={Boolean(error)}>
      <FieldLabel className="text-admin-label uppercase tracking-[0.14em]" htmlFor={id}>
        {label}
      </FieldLabel>
      <Input
        aria-describedby={describedBy || undefined}
        aria-errormessage={error ? errorId : undefined}
        aria-invalid={Boolean(error) || undefined}
        autoComplete="off"
        defaultValue={defaultValue}
        id={id}
        name={name}
        required={required}
        spellCheck={spellCheck}
        type={type}
      />
      {helpText ? (
        <FieldDescription className="text-admin-help leading-5" id={descriptionId}>
          {helpText}
        </FieldDescription>
      ) : null}
      {error ? (
        <FieldError className="text-admin-body leading-5" id={errorId}>
          {error}
        </FieldError>
      ) : null}
    </Field>
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
  const errorId = `${id}-error`;

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel className="text-admin-label uppercase tracking-[0.14em]" htmlFor={id}>
        {label}
      </FieldLabel>
      <Textarea
        aria-describedby={error ? errorId : undefined}
        aria-errormessage={error ? errorId : undefined}
        aria-invalid={Boolean(error) || undefined}
        autoComplete="off"
        defaultValue={defaultValue}
        id={id}
        name={name}
        required={required}
        rows={rows}
      />
      {error ? (
        <FieldError className="text-admin-body leading-5" id={errorId}>
          {error}
        </FieldError>
      ) : null}
    </Field>
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
  assets: AdminMediaAsset[];
  currentId?: string | null;
  error?: string;
  idPrefix: string;
  label: string;
  name: string;
  typePrefix: string;
  videoVariant?: AdminMediaAsset["videoVariant"];
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
  const errorId = `${id}-error`;
  const selectItems = [
    { label: "Nenhum arquivo selecionado", value: "" },
    ...filteredAssets.map((asset) => ({
      label: `${getMediaDisplayName(asset)} - ${asset.mimeType}`,
      value: asset.id,
    })),
  ];

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel className="text-admin-label uppercase tracking-[0.14em]" htmlFor={id}>
        {label}
      </FieldLabel>
      <Select defaultValue={currentId ?? ""} items={selectItems} name={name}>
        <SelectTrigger
          aria-describedby={error ? errorId : undefined}
          aria-errormessage={error ? errorId : undefined}
          aria-invalid={Boolean(error) || undefined}
          className="w-full"
          id={id}
        >
          <SelectValue>
            {(value: string | null) => {
              const selectedAsset = selectItems.find((item) => item.value === value);

              return selectedAsset?.label ?? "Nenhum arquivo selecionado";
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectGroup>
            {selectItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {error ? (
        <FieldError className="text-admin-body leading-5" id={errorId}>
          {error}
        </FieldError>
      ) : null}
    </Field>
  );
}
