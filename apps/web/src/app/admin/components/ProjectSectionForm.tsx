"use client";

import { useState } from "react";

import type { AdminMediaAsset } from "@/lib/api/admin-media";
import type { AdminProjectSection } from "@/lib/api/admin-projects";
import {
  type ProjectSectionType,
  projectSectionTypes,
} from "@/lib/api/project-types";

import { deleteProjectSectionAction, saveProjectSectionAction } from "../actions";

type ProjectSectionFormProps = {
  displayOrder?: number;
  mediaAssets: AdminMediaAsset[];
  projectId: string;
  section?: AdminProjectSection;
  sectionCount?: number;
};

const sectionTypeLabels: Record<ProjectSectionType, string> = {
  contact_credit: "Contato / créditos",
  image_block: "Imagem",
  parallax_video: "Vídeo com rolagem",
  technical_info: "Ficha técnica",
  text_block: "Texto",
  video_block: "Vídeo simples",
};

function getMediaDisplayName(asset: Pick<AdminMediaAsset, "altText"> | { altText: string | null }) {
  return (asset.altText ?? "Arquivo sem descrição").replace(
    / - (rolagem otimizado|normal com áudio)$/,
    "",
  );
}

const sectionFieldConfig: Record<
  ProjectSectionType,
  {
    caption?: boolean;
    metadata?: boolean;
    primaryMedia?: "image" | "video";
    primaryMediaLabel?: string;
    poster?: boolean;
    text?: boolean;
  }
> = {
  contact_credit: {
    primaryMedia: "image",
    primaryMediaLabel: "Imagem do arquiteto / escritório",
    text: true,
  },
  image_block: {
    caption: true,
    primaryMedia: "image",
    primaryMediaLabel: "Imagem principal",
    text: true,
  },
  parallax_video: {
    caption: true,
    primaryMedia: "video",
    primaryMediaLabel: "Vídeo principal",
    text: true,
  },
  technical_info: {
    metadata: true,
    text: true,
  },
  text_block: {
    text: true,
  },
  video_block: {
    caption: true,
    primaryMedia: "video",
    primaryMediaLabel: "Vídeo principal",
    text: true,
  },
};

export function ProjectSectionForm({
  displayOrder,
  mediaAssets,
  projectId,
  section,
  sectionCount = 0,
}: ProjectSectionFormProps) {
  const sectionData = section?.section;
  const isEditing = Boolean(sectionData);
  const idPrefix = sectionData?.id ?? `${projectId}-new-section`;
  const metadataValue = JSON.stringify(sectionData?.metadata ?? {}, null, 2);
  const mediaLabel = section?.primaryMediaAsset
    ? getMediaDisplayName(section.primaryMediaAsset)
    : "Sem foto ou vídeo principal";
  const blockTitle = sectionData?.title || "Sem título";
  const visibleOrder = displayOrder ?? sectionCount + 1;
  const [selectedType, setSelectedType] = useState<ProjectSectionType>(
    sectionData?.type ?? "text_block",
  );
  const fieldConfig = sectionFieldConfig[selectedType];

  return (
    <div className="border border-neutral-200 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h4 className="text-[var(--text-admin-label)] uppercase tracking-[0.14em]">
            {isEditing ? `Bloco ${visibleOrder}` : "Criar bloco"}
          </h4>
          {sectionData ? (
            <dl className="mt-3 grid gap-2 text-[var(--text-admin-body)] text-neutral-600 md:grid-cols-4">
              <SummaryItem label="Tipo" value={sectionTypeLabels[sectionData.type]} />
              <SummaryItem label="Título" value={blockTitle} />
              <SummaryItem label="Mídia" value={mediaLabel} />
              <SummaryItem label="Status" value={sectionData.isEnabled ? "Visível" : "Oculto"} />
            </dl>
          ) : null}
        </div>
        {sectionData ? (
          <form action={deleteProjectSectionAction}>
            <input name="id" type="hidden" value={sectionData.id} />
            <input name="projectId" type="hidden" value={projectId} />
            <button
              className="min-h-11 border border-neutral-300 px-4 text-[var(--text-admin-label)] uppercase tracking-[0.16em] hover:border-neutral-950 focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-neutral-950"
              type="submit"
            >
              Apagar
            </button>
          </form>
        ) : null}
      </div>

      <form action={saveProjectSectionAction} className="mt-5 grid gap-5" noValidate>
        <input name="id" type="hidden" value={sectionData?.id ?? ""} />
        <input name="projectId" type="hidden" value={projectId} />
        <input name="sortOrder" type="hidden" value={String(visibleOrder)} />
        {!fieldConfig.caption ? <input name="caption" type="hidden" value="" /> : null}
        {!fieldConfig.metadata ? <input name="metadata" type="hidden" value="{}" /> : null}
        {!fieldConfig.primaryMedia ? <input name="primaryMediaAssetId" type="hidden" value="" /> : null}
        {!fieldConfig.poster ? <input name="posterMediaAssetId" type="hidden" value="" /> : null}
        {!fieldConfig.text ? <input name="body" type="hidden" value="" /> : null}

        <div className="grid gap-5 md:grid-cols-2">
          <SectionTypeSelect currentType={selectedType} idPrefix={idPrefix} onChange={setSelectedType} />
          <TextField defaultValue={sectionData?.title ?? ""} idPrefix={idPrefix} label="Título" name="title" />
        </div>

        {fieldConfig.text ? (
          <TextArea
            defaultValue={sectionData?.body ?? ""}
            idPrefix={idPrefix}
            label={selectedType === "technical_info" ? "Texto de apoio" : "Texto"}
            name="body"
            rows={5}
          />
        ) : null}

        {fieldConfig.primaryMedia || fieldConfig.poster || fieldConfig.caption ? (
          <div className="grid gap-5 md:grid-cols-3">
            {fieldConfig.primaryMedia ? (
              <MediaSelect
                assets={mediaAssets}
                currentId={sectionData?.primaryMediaAssetId}
                idPrefix={idPrefix}
                label={fieldConfig.primaryMediaLabel ?? "Arquivo principal"}
                name="primaryMediaAssetId"
                typePrefix={fieldConfig.primaryMedia === "video" ? "video/" : "image/"}
                videoVariant={
                  selectedType === "parallax_video"
                    ? "scrub"
                    : selectedType === "video_block"
                      ? "standard"
                      : undefined
                }
              />
            ) : null}
            {fieldConfig.poster ? (
              <MediaSelect
                assets={mediaAssets}
                currentId={sectionData?.posterMediaAssetId}
                idPrefix={idPrefix}
                label="Imagem alternativa"
                name="posterMediaAssetId"
                typePrefix="image/"
              />
            ) : null}
            {fieldConfig.caption ? (
              <TextField
                defaultValue={sectionData?.caption ?? ""}
                idPrefix={idPrefix}
                label="Legenda"
                name="caption"
              />
            ) : null}
          </div>
        ) : null}

        {fieldConfig.metadata ? (
          <details className="border border-neutral-200 p-4">
            <summary className="cursor-pointer text-[var(--text-admin-label)] uppercase tracking-[0.14em]">
              Configurações avançadas
            </summary>
            <div className="mt-4">
              <TextArea
                defaultValue={metadataValue}
                idPrefix={idPrefix}
                label="Dados técnicos"
                name="metadata"
                rows={5}
              />
              <p className="mt-2 text-[var(--text-admin-help)] leading-5 text-neutral-500">
                Use um objeto JSON com chave e valor para os dados da ficha técnica.
              </p>
            </div>
          </details>
        ) : null}

        <label
          className="flex min-h-11 items-center gap-3 text-[var(--text-admin-body)]"
          htmlFor={`${idPrefix}-isEnabled`}
        >
          <input
            className="size-4 accent-neutral-950"
            defaultChecked={sectionData?.isEnabled ?? true}
            id={`${idPrefix}-isEnabled`}
            name="isEnabled"
            type="checkbox"
          />
          Visível na página
        </label>
        <button
          className="min-h-11 justify-self-start border border-neutral-950 px-5 text-[var(--text-admin-label)] uppercase tracking-[0.16em] hover:bg-neutral-950 hover:text-white focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-neutral-950"
          type="submit"
        >
          {isEditing ? "Salvar bloco" : "Criar bloco"}
        </button>
      </form>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[var(--text-admin-help)] uppercase tracking-[0.14em] text-neutral-400">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function SectionTypeSelect({
  currentType,
  idPrefix,
  onChange,
}: {
  currentType: ProjectSectionType;
  idPrefix: string;
  onChange: (type: ProjectSectionType) => void;
}) {
  const id = `${idPrefix}-type`;

  return (
    <div className="grid min-w-0 gap-2">
      <label className="text-[var(--text-admin-label)] uppercase tracking-[0.14em]" htmlFor={id}>
        Tipo de bloco
      </label>
      <select
        className="min-h-12 w-full min-w-0 border border-neutral-300 bg-white px-3 text-[var(--text-admin-control)] outline-none focus:border-neutral-950 focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-neutral-950"
        id={id}
        name="type"
        onChange={(event) => onChange(event.target.value as ProjectSectionType)}
        required
        value={currentType}
      >
        {projectSectionTypes.map((type) => (
          <option key={type} value={type}>
            {sectionTypeLabels[type]}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextField({
  defaultValue = "",
  idPrefix,
  label,
  name,
}: {
  defaultValue?: string;
  idPrefix: string;
  label: string;
  name: string;
}) {
  const id = `${idPrefix}-${name}`;

  return (
    <div className="grid min-w-0 gap-2">
      <label className="text-[var(--text-admin-label)] uppercase tracking-[0.14em]" htmlFor={id}>
        {label}
      </label>
      <input
        className="min-h-12 border border-neutral-300 bg-white px-3 text-[var(--text-admin-control)] outline-none focus:border-neutral-950 focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-neutral-950"
        defaultValue={defaultValue}
        id={id}
        name={name}
        type="text"
      />
    </div>
  );
}

function TextArea({
  defaultValue = "",
  idPrefix,
  label,
  name,
  rows = 4,
}: {
  defaultValue?: string;
  idPrefix: string;
  label: string;
  name: string;
  rows?: number;
}) {
  const id = `${idPrefix}-${name}`;

  return (
    <div className="grid gap-2">
      <label className="text-[var(--text-admin-label)] uppercase tracking-[0.14em]" htmlFor={id}>
        {label}
      </label>
      <textarea
        className="border border-neutral-300 bg-white px-3 py-3 text-[var(--text-admin-control)] leading-6 outline-none focus:border-neutral-950 focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-neutral-950"
        defaultValue={defaultValue}
        id={id}
        name={name}
        rows={rows}
      />
    </div>
  );
}

function MediaSelect({
  assets,
  currentId,
  idPrefix,
  label,
  name,
  typePrefix,
  videoVariant,
}: {
  assets: AdminMediaAsset[];
  currentId?: string | null;
  idPrefix: string;
  label: string;
  name: string;
  typePrefix?: string;
  videoVariant?: AdminMediaAsset["videoVariant"];
}) {
  const filteredAssets = assets.filter((asset) => {
    if (typePrefix && !asset.mimeType.startsWith(typePrefix)) {
      return false;
    }

    if (videoVariant && asset.videoVariant && asset.videoVariant !== videoVariant) {
      return false;
    }

    return true;
  });
  const id = `${idPrefix}-${name}`;

  return (
    <div className="grid min-w-0 gap-2">
      <label className="text-[var(--text-admin-label)] uppercase tracking-[0.14em]" htmlFor={id}>
        {label}
      </label>
      <select
        className="min-h-12 w-full min-w-0 border border-neutral-300 bg-white px-3 text-[var(--text-admin-control)] outline-none focus:border-neutral-950 focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-neutral-950"
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
    </div>
  );
}
