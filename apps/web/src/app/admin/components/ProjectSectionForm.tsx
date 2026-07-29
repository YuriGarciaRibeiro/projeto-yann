"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { AdminMediaAsset } from "@/lib/api/admin-media";
import type { AdminProjectSection } from "@/lib/api/admin-projects";
import {
  type ProjectSectionType,
  projectSectionTypes,
} from "@/lib/api/project-types";

import { deleteProjectSectionInlineAction, saveProjectSectionInlineAction } from "../actions";

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

const creatableProjectSectionTypes = projectSectionTypes.filter(
  (type) => type !== "contact_credit",
);

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
    youtubeUrl?: boolean;
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
    text: true,
    youtubeUrl: true,
  },
};

export function ProjectSectionForm({
  displayOrder,
  mediaAssets,
  projectId,
  section,
  sectionCount = 0,
}: ProjectSectionFormProps) {
  const router = useRouter();
  const sectionData = section?.section;
  const isEditing = Boolean(sectionData);
  const idPrefix = sectionData?.id ?? `${projectId}-new-section`;
  const metadataValue = JSON.stringify(sectionData?.metadata ?? {}, null, 2);
  const mediaLabel = section?.primaryMediaAsset
    ? getMediaDisplayName(section.primaryMediaAsset)
    : "Sem foto ou vídeo principal";
  const blockTitle = sectionData?.title || "Sem título";
  const visibleOrder = displayOrder ?? sectionCount + 1;
  const submittedSortOrder = sectionData ? String(sectionData.sortOrder) : String(visibleOrder);
  const [selectedType, setSelectedType] = useState<ProjectSectionType>(
    sectionData?.type ?? "text_block",
  );
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const fieldConfig = sectionFieldConfig[selectedType];
  const hiddenPrimaryMediaAssetId =
    sectionData?.type === "video_block" && selectedType === "video_block"
      ? (sectionData.primaryMediaAssetId ?? "")
      : "";

  async function handleSaveSection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) {
      return;
    }

    const form = event.currentTarget;
    setIsSaving(true);
    setSaveMessage("Salvando bloco…");

    try {
      const result = await saveProjectSectionInlineAction(new FormData(form));

      if (!result.ok) {
        throw new Error(result.error ?? "Não foi possível salvar o bloco.");
      }

      setSaveMessage("Bloco salvo.");
      if (!isEditing) {
        form.reset();
        setSelectedType("text_block");
      }
      router.refresh();
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Não foi possível salvar o bloco.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteSection() {
    if (!sectionData || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setDeleteMessage("Apagando bloco…");

    try {
      const result = await deleteProjectSectionInlineAction({
        projectId,
        sectionId: sectionData.id,
      });

      if (!result.ok) {
        throw new Error(result.error ?? "Não foi possível apagar o bloco.");
      }

      setDeleteMessage("Bloco apagado.");
      router.refresh();
    } catch (error) {
      setDeleteMessage(error instanceof Error ? error.message : "Não foi possível apagar o bloco.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card className="rounded-none">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h4 className="text-admin-label uppercase tracking-[0.14em]">
            {isEditing ? `Bloco ${visibleOrder}` : "Criar bloco"}
          </h4>
          {sectionData ? (
            <dl className="mt-3 grid gap-2 text-admin-body text-muted-foreground md:grid-cols-4">
              <SummaryItem label="Tipo" value={sectionTypeLabels[sectionData.type]} />
              <SummaryItem label="Título" value={blockTitle} />
              <SummaryItem label="Mídia" value={mediaLabel} />
              <SummaryItem
                label="Status"
                value={(
                  <Badge variant={sectionData.isEnabled ? "default" : "secondary"}>
                    {sectionData.isEnabled ? "Visível" : "Oculto"}
                  </Badge>
                )}
              />
            </dl>
          ) : null}
        </div>
        {sectionData ? (
          <div className="grid gap-2 justify-items-start md:justify-items-end">
            <AlertDialog>
              <AlertDialogTrigger
                render={(
                  <Button
                    className="min-h-11 rounded-none px-4 text-admin-label uppercase tracking-[0.16em]"
                    disabled={isDeleting}
                    variant="outline"
                  />
                )}
              >
                {isDeleting ? "Apagando…" : "Apagar"}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Apagar este bloco?</AlertDialogTitle>
                  <AlertDialogDescription>
                    O bloco {blockTitle} será removido deste projeto. Essa ação não apaga arquivos da biblioteca.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={isDeleting}
                    onClick={() => void handleDeleteSection()}
                    type="button"
                    variant="destructive"
                  >
                    Apagar bloco
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {deleteMessage ? (
              <Alert aria-live="polite" className="max-w-72 rounded-none" role="status">
                <AlertDescription className="text-admin-help leading-5">{deleteMessage}</AlertDescription>
              </Alert>
            ) : null}
          </div>
        ) : null}
      </CardHeader>

      <CardContent>
        <form className="mt-5" noValidate onSubmit={(event) => void handleSaveSection(event)}>
          <FieldGroup className="gap-5">
            <input name="id" type="hidden" value={sectionData?.id ?? ""} />
            <input name="projectId" type="hidden" value={projectId} />
            <input name="sortOrder" type="hidden" value={submittedSortOrder} />
            {!fieldConfig.caption ? <input name="caption" type="hidden" value="" /> : null}
            {!fieldConfig.metadata ? <input name="metadata" type="hidden" value="{}" /> : null}
            {!fieldConfig.primaryMedia ? <input name="primaryMediaAssetId" type="hidden" value={hiddenPrimaryMediaAssetId} /> : null}
            {!fieldConfig.poster ? <input name="posterMediaAssetId" type="hidden" value="" /> : null}
            {!fieldConfig.text ? <input name="body" type="hidden" value="" /> : null}
            {!fieldConfig.youtubeUrl ? <input name="youtubeUrl" type="hidden" value="" /> : null}

        <FieldGroup className="grid gap-5 md:grid-cols-2">
          <SectionTypeSelect
            currentType={selectedType}
            idPrefix={idPrefix}
            onChange={setSelectedType}
            types={isEditing ? projectSectionTypes : creatableProjectSectionTypes}
          />
          <TextField defaultValue={sectionData?.title ?? ""} idPrefix={idPrefix} label="Título" name="title" />
        </FieldGroup>

        {fieldConfig.text ? (
          <TextArea
            defaultValue={sectionData?.body ?? ""}
            idPrefix={idPrefix}
            label={selectedType === "technical_info" ? "Texto de apoio" : "Texto"}
            name="body"
            rows={5}
          />
        ) : null}

        {fieldConfig.youtubeUrl ? (
          <TextField
            defaultValue={
              typeof sectionData?.metadata?.youtubeUrl === "string"
                ? sectionData.metadata.youtubeUrl
                : ""
            }
            idPrefix={idPrefix}
            label="URL do YouTube"
            name="youtubeUrl"
          />
        ) : null}

        {fieldConfig.primaryMedia || fieldConfig.poster || fieldConfig.caption ? (
          <FieldGroup className="grid gap-5 md:grid-cols-3">
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
          </FieldGroup>
        ) : null}

        {fieldConfig.metadata ? (
          <details className="border border-border p-4">
            <summary className="cursor-pointer text-admin-label uppercase tracking-[0.14em]">
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
              <FieldDescription className="mt-2 text-admin-help leading-5">
                Use um objeto JSON com chave e valor para os dados da ficha técnica.
              </FieldDescription>
            </div>
          </details>
        ) : null}

        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel className="text-admin-body" htmlFor={`${idPrefix}-isEnabled`}>
              Visível na página
            </FieldLabel>
          </FieldContent>
          <Switch
            defaultChecked={sectionData?.isEnabled ?? true}
            id={`${idPrefix}-isEnabled`}
            name="isEnabled"
            value="on"
          />
        </Field>
        <Button
          className="min-h-11 justify-self-start rounded-none px-5 text-admin-label uppercase tracking-[0.16em]"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? "Salvando…" : isEditing ? "Salvar bloco" : "Criar bloco"}
        </Button>
        {saveMessage ? (
          <Alert aria-live="polite" className="rounded-none" role="status">
            <AlertDescription className="text-admin-help leading-5">{saveMessage}</AlertDescription>
          </Alert>
        ) : null}
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

function SummaryItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-admin-help uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function SectionTypeSelect({
  currentType,
  idPrefix,
  onChange,
  types,
}: {
  currentType: ProjectSectionType;
  idPrefix: string;
  onChange: (type: ProjectSectionType) => void;
  types: readonly ProjectSectionType[];
}) {
  const id = `${idPrefix}-type`;

  return (
    <Field>
      <FieldLabel className="text-admin-label uppercase tracking-[0.14em]" htmlFor={id}>
        Tipo de bloco
      </FieldLabel>
      <Select
        items={types.map((type) => ({ label: sectionTypeLabels[type], value: type }))}
        name="type"
        onValueChange={(value) => onChange(value as ProjectSectionType)}
        value={currentType}
      >
        <SelectTrigger className="min-h-12 w-full rounded-none text-admin-control" id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectGroup>
            {types.map((type) => (
              <SelectItem key={type} value={type}>
                {sectionTypeLabels[type]}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
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
    <Field>
      <FieldLabel className="text-admin-label uppercase tracking-[0.14em]" htmlFor={id}>
        {label}
      </FieldLabel>
      <Input
        autoComplete="off"
        className="min-h-12 rounded-none text-admin-control"
        defaultValue={defaultValue}
        id={id}
        name={name}
        type="text"
      />
    </Field>
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
    <Field>
      <FieldLabel className="text-admin-label uppercase tracking-[0.14em]" htmlFor={id}>
        {label}
      </FieldLabel>
      <Textarea
        autoComplete="off"
        className="rounded-none text-admin-control leading-6"
        defaultValue={defaultValue}
        id={id}
        name={name}
        rows={rows}
      />
    </Field>
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
  const selectItems = [
    { label: "Nenhum arquivo selecionado", value: "" },
    ...filteredAssets.map((asset) => ({
      label: `${getMediaDisplayName(asset)} - ${asset.mimeType}`,
      value: asset.id,
    })),
  ];

  return (
    <Field>
      <FieldLabel className="text-admin-label uppercase tracking-[0.14em]" htmlFor={id}>
        {label}
      </FieldLabel>
      <Select defaultValue={currentId ?? ""} items={selectItems} name={name}>
        <SelectTrigger className="min-h-12 w-full rounded-none text-admin-control" id={id}>
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
    </Field>
  );
}
