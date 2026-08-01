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
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

import {
  deleteProjectSectionInlineAction,
  moveProjectSectionInlineAction,
  saveProjectSectionInlineAction,
} from "../actions";

type ProjectSectionFormProps = {
  canMoveDown?: boolean;
  canMoveUp?: boolean;
  displayOrder?: number;
  mediaAssets: AdminMediaAsset[];
  projectId: string;
  section?: AdminProjectSection;
  sectionCount?: number;
  sectionOrder?: string[];
};

type ParallaxGroupItemFormValue = {
  body: string;
  caption: string;
  clientId: string;
  id: string;
  isEnabled: boolean;
  primaryMediaAssetId: string;
  sortOrder: number;
  title: string;
};

const sectionTypeLabels: Record<ProjectSectionType, string> = {
  contact_credit: "Contato / créditos",
  image_block: "Imagem",
  parallax_group: "Grupo parallax",
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
  parallax_group: {
    text: false,
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

function createBlankParallaxGroupItem(
  index: number,
  clientId = `new-${index}`,
): ParallaxGroupItemFormValue {
  return {
    body: "",
    caption: "",
    clientId,
    id: "",
    isEnabled: true,
    primaryMediaAssetId: "",
    sortOrder: (index + 1) * 10,
    title: "",
  };
}

function getInitialParallaxGroupItems(section?: AdminProjectSection): ParallaxGroupItemFormValue[] {
  if (section?.parallaxGroupItems.length) {
    return section.parallaxGroupItems.map(({ item }) => ({
      body: item.body ?? "",
      caption: item.caption ?? "",
      clientId: item.id,
      id: item.id,
      isEnabled: item.isEnabled,
      primaryMediaAssetId: item.primaryMediaAssetId ?? "",
      sortOrder: item.sortOrder,
      title: item.title ?? "",
    }));
  }

  return [createBlankParallaxGroupItem(0)];
}

export function ProjectSectionForm({
  canMoveDown = false,
  canMoveUp = false,
  displayOrder,
  mediaAssets,
  projectId,
  section,
  sectionCount = 0,
  sectionOrder = [],
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
    sectionData?.type ?? "parallax_group",
  );
  const [parallaxGroupItems, setParallaxGroupItems] = useState<ParallaxGroupItemFormValue[]>(
    () => getInitialParallaxGroupItems(section),
  );
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [moveMessage, setMoveMessage] = useState("");
  const [movingDirection, setMovingDirection] = useState<-1 | 1 | null>(null);
  const fieldConfig = sectionFieldConfig[selectedType];
  const hiddenPrimaryMediaAssetId =
    sectionData?.type === "video_block" && selectedType === "video_block"
      ? (sectionData.primaryMediaAssetId ?? "")
      : "";

  function addParallaxGroupItem() {
    setParallaxGroupItems((items) => [
      ...items,
      createBlankParallaxGroupItem(items.length, `new-${Date.now()}-${items.length}`),
    ]);
  }

  function removeParallaxGroupItem(index: number) {
    setParallaxGroupItems((items) => items.filter((_, itemIndex) => itemIndex !== index));
  }

  function moveParallaxGroupItem(index: number, direction: -1 | 1) {
    setParallaxGroupItems((items) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= items.length) {
        return items;
      }

      const nextItems = [...items];
      const [movedItem] = nextItems.splice(index, 1);
      nextItems.splice(nextIndex, 0, movedItem);
      return nextItems;
    });
  }

  function updateParallaxGroupItem(
    index: number,
    field: keyof Omit<ParallaxGroupItemFormValue, "clientId">,
    value: string | boolean,
  ) {
    setParallaxGroupItems((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  }

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
        setSelectedType("parallax_group");
        setParallaxGroupItems([createBlankParallaxGroupItem(0)]);
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

  async function handleMoveSection(direction: -1 | 1) {
    if (!sectionData || movingDirection) {
      return;
    }

    setMovingDirection(direction);
    setMoveMessage(direction === -1 ? "Movendo bloco para cima…" : "Movendo bloco para baixo…");

    try {
      const result = await moveProjectSectionInlineAction({
        direction,
        projectId,
        sectionId: sectionData.id,
        sectionIds: sectionOrder,
      });

      if (!result.ok) {
        throw new Error(result.error ?? "Não foi possível mover o bloco.");
      }

      setMoveMessage("Ordem atualizada.");
      router.refresh();
    } catch (error) {
      setMoveMessage(error instanceof Error ? error.message : "Não foi possível mover o bloco.");
    } finally {
      setMovingDirection(null);
    }
  }

  return (
    <Card>
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
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={!canMoveUp || movingDirection !== null}
                size="sm"
                type="button"
                variant="outline"
                onClick={() => void handleMoveSection(-1)}
              >
                {movingDirection === -1 ? "Subindo…" : "Subir"}
              </Button>
              <Button
                disabled={!canMoveDown || movingDirection !== null}
                size="sm"
                type="button"
                variant="outline"
                onClick={() => void handleMoveSection(1)}
              >
                {movingDirection === 1 ? "Descendo…" : "Descer"}
              </Button>
            </div>
            <AlertDialog>
              <AlertDialogTrigger
                render={(
                  <Button
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
              <Alert aria-live="polite" className="max-w-72" role="status">
                <AlertDescription className="text-admin-help leading-5">{deleteMessage}</AlertDescription>
              </Alert>
            ) : null}
            {moveMessage ? (
              <Alert aria-live="polite" className="max-w-72" role="status">
                <AlertDescription className="text-admin-help leading-5">{moveMessage}</AlertDescription>
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
          <TextField
            defaultValue={sectionData?.title ?? ""}
            idPrefix={idPrefix}
            label={selectedType === "parallax_group" ? "Nome administrativo do grupo" : "Título"}
            name="title"
          />
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
            type="url"
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

        {selectedType === "parallax_group" ? (
          <ParallaxGroupItemsEditor
            assets={mediaAssets}
            idPrefix={idPrefix}
            items={parallaxGroupItems}
            onAdd={addParallaxGroupItem}
            onMove={moveParallaxGroupItem}
            onRemove={removeParallaxGroupItem}
            onUpdate={updateParallaxGroupItem}
          />
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
          className="justify-self-start"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? "Salvando…" : isEditing ? "Salvar bloco" : "Criar bloco"}
        </Button>
        {saveMessage ? (
          <Alert aria-live="polite" role="status">
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

function ParallaxGroupItemsEditor({
  assets,
  idPrefix,
  items,
  onAdd,
  onMove,
  onRemove,
  onUpdate,
}: {
  assets: AdminMediaAsset[];
  idPrefix: string;
  items: ParallaxGroupItemFormValue[];
  onAdd: () => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (index: number) => void;
  onUpdate: (
    index: number,
    field: keyof Omit<ParallaxGroupItemFormValue, "clientId">,
    value: string | boolean,
  ) => void;
}) {
  return (
    <Card size="sm" className="bg-muted/30">
      <CardHeader>
        <CardTitle className="text-admin-label uppercase tracking-[0.14em]">
          Vídeos do grupo
        </CardTitle>
        <CardDescription className="text-admin-help leading-5">
          Cada item usa um vídeo otimizado para rolagem. O fallback visual vem do próprio vídeo.
        </CardDescription>
        <CardAction>
          <Button size="sm" type="button" variant="outline" onClick={onAdd}>
            Adicionar vídeo ao grupo
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        <FieldGroup className="gap-4">
          {items.length === 0 ? (
            <p className="text-admin-help text-muted-foreground">
              Este grupo está vazio e não será exibido na página pública.
            </p>
          ) : null}

          {items.map((item, index) => {
            const itemIdPrefix = `${idPrefix}-parallax-group-${item.clientId}`;
            const fieldPrefix = `parallaxGroupItems[${index}]`;

            return (
              <Card size="sm" className="bg-background" key={item.clientId}>
                <CardHeader>
                  <CardTitle className="text-admin-label uppercase tracking-[0.14em]">
                    Vídeo {index + 1}
                  </CardTitle>
                  <CardDescription className="text-admin-help leading-5">
                    Item interno do grupo parallax
                  </CardDescription>
                  <CardAction className="flex flex-wrap justify-end gap-1">
                    <Button
                      disabled={index === 0}
                      size="sm"
                      type="button"
                      variant="ghost"
                      onClick={() => onMove(index, -1)}
                    >
                      Subir
                    </Button>
                    <Button
                      disabled={index === items.length - 1}
                      size="sm"
                      type="button"
                      variant="ghost"
                      onClick={() => onMove(index, 1)}
                    >
                      Descer
                    </Button>
                    <Button
                      size="sm"
                      type="button"
                      variant="ghost"
                      onClick={() => onRemove(index)}
                    >
                      Remover
                    </Button>
                  </CardAction>
                </CardHeader>

                <CardContent>
                  <FieldGroup className="gap-4">
                    <input name={`${fieldPrefix}[id]`} type="hidden" value={item.id} />
                    <input name={`${fieldPrefix}[sortOrder]`} type="hidden" value={(index + 1) * 10} />

                    <FieldGroup className="grid gap-4 md:grid-cols-2">
                      <ControlledTextField
                        idPrefix={itemIdPrefix}
                        label="Título"
                        name={`${fieldPrefix}[title]`}
                        value={item.title}
                        onChange={(value) => onUpdate(index, "title", value)}
                      />
                      <ControlledTextField
                        idPrefix={itemIdPrefix}
                        label="Legenda"
                        name={`${fieldPrefix}[caption]`}
                        value={item.caption}
                        onChange={(value) => onUpdate(index, "caption", value)}
                      />
                    </FieldGroup>

                    <ControlledTextArea
                      idPrefix={itemIdPrefix}
                      label="Texto"
                      name={`${fieldPrefix}[body]`}
                      rows={4}
                      value={item.body}
                      onChange={(value) => onUpdate(index, "body", value)}
                    />

                    <MediaSelect
                      assets={assets}
                      currentId={item.primaryMediaAssetId}
                      idPrefix={itemIdPrefix}
                      label="Vídeo interno"
                      name={`${fieldPrefix}[primaryMediaAssetId]`}
                      typePrefix="video/"
                      videoVariant="scrub"
                      onChange={(value) => onUpdate(index, "primaryMediaAssetId", value)}
                    />

                    <Field orientation="horizontal" className="rounded-lg bg-muted/30 p-3">
                      <FieldContent>
                        <FieldLabel className="text-admin-body" htmlFor={`${itemIdPrefix}-isEnabled`}>
                          Visível na página
                        </FieldLabel>
                      </FieldContent>
                      <Switch
                        checked={item.isEnabled}
                        id={`${itemIdPrefix}-isEnabled`}
                        name={`${fieldPrefix}[isEnabled]`}
                        value="on"
                        onCheckedChange={(checked) => onUpdate(index, "isEnabled", checked)}
                      />
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>
            );
          })}
        </FieldGroup>
      </CardContent>
    </Card>
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
        <SelectTrigger className="w-full" id={id}>
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
  type = "text",
}: {
  defaultValue?: string;
  idPrefix: string;
  label: string;
  name: string;
  type?: string;
}) {
  const id = `${idPrefix}-${name}`;

  return (
    <Field>
      <FieldLabel className="text-admin-label uppercase tracking-[0.14em]" htmlFor={id}>
        {label}
      </FieldLabel>
      <Input
        autoComplete="off"
        defaultValue={defaultValue}
        id={id}
        name={name}
        type={type}
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
        defaultValue={defaultValue}
        id={id}
        name={name}
        rows={rows}
      />
    </Field>
  );
}

function ControlledTextField({
  idPrefix,
  label,
  name,
  onChange,
  value,
}: {
  idPrefix: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const id = `${idPrefix}-${name}`;

  return (
    <Field>
      <FieldLabel className="text-admin-label uppercase tracking-[0.14em]" htmlFor={id}>
        {label}
      </FieldLabel>
      <Input
        autoComplete="off"
        id={id}
        name={name}
        type="text"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </Field>
  );
}

function ControlledTextArea({
  idPrefix,
  label,
  name,
  onChange,
  rows = 4,
  value,
}: {
  idPrefix: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  rows?: number;
  value: string;
}) {
  const id = `${idPrefix}-${name}`;

  return (
    <Field>
      <FieldLabel className="text-admin-label uppercase tracking-[0.14em]" htmlFor={id}>
        {label}
      </FieldLabel>
      <Textarea
        autoComplete="off"
        id={id}
        name={name}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
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
  onChange,
  typePrefix,
  videoVariant,
}: {
  assets: AdminMediaAsset[];
  currentId?: string | null;
  idPrefix: string;
  label: string;
  name: string;
  onChange?: (value: string) => void;
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
      <Select
        defaultValue={onChange ? undefined : (currentId ?? "")}
        items={selectItems}
        name={name}
        value={onChange ? (currentId ?? "") : undefined}
        onValueChange={onChange ? (value) => onChange(value ?? "") : undefined}
      >
        <SelectTrigger className="w-full" id={id}>
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
