"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminMediaAsset } from "@/lib/api/admin-media";
import type { MediaUsageScope } from "@/lib/api/project-types";

import { deleteMediaAssetAction, saveMediaAssetAction } from "../actions";
import {
  createSignedAdminUploadAction,
  createSignedAdminVideoUploadAction,
  type VideoUploadProgressEvent,
} from "../upload-actions";
import { getLibraryItems } from "./media-library-items";

type MediaUploadFieldProps = {
  description: string;
  mediaAssets: AdminMediaAsset[];
  projectId?: string | null;
  title: string;
  usageScope: MediaUsageScope;
};

type UploadStatus = "idle" | "signing" | "uploading" | "saving" | "success" | "error";

type PendingDeleteAsset = {
  assetIds: string[];
  displayName: string;
};

function getDisplayNameFromFileName(fileName: string) {
  const extensionlessName = fileName.replace(/\.[^.]+$/, "").trim();
  return extensionlessName || fileName || "arquivo";
}

async function readVideoProgressStream(
  response: Response,
  onProgress: (event: VideoUploadProgressEvent) => void,
) {
  if (!response.body) {
    throw new Error("Não foi possível acompanhar o progresso do vídeo.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const events: VideoUploadProgressEvent[] = [];
  let buffer = "";

  function getRequestHint() {
    const requestId = events.at(-1)?.requestId;
    return requestId ? ` Código: ${requestId}.` : "";
  }

  function parseLine(line: string) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      return;
    }

    let event: VideoUploadProgressEvent;

    try {
      event = JSON.parse(trimmedLine) as VideoUploadProgressEvent;
    } catch {
      throw new Error(
        `Não foi possível ler o progresso do processamento do vídeo.${getRequestHint()}`,
      );
    }

    events.push(event);
    onProgress(event);
  }

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      parseLine(line);
    }
  }

  buffer += decoder.decode();
  parseLine(buffer);

  const finalEvent = events.at(-1);

  if (!finalEvent) {
    throw new Error("Nenhum progresso de vídeo foi recebido.");
  }

  const requestHint = finalEvent.requestId ? ` Código: ${finalEvent.requestId}.` : "";

  if (finalEvent.event === "failed" || finalEvent.ok === false) {
    throw new Error(`${finalEvent.error || finalEvent.message}${requestHint}`);
  }

  if (finalEvent.event !== "completed") {
    throw new Error(`O envio de vídeo terminou sem confirmação de conclusão.${requestHint}`);
  }
}

export function MediaUploadField({
  description,
  mediaAssets,
  projectId = null,
  title,
  usageScope,
}: MediaUploadFieldProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  const [pendingDeleteAsset, setPendingDeleteAsset] = useState<PendingDeleteAsset | null>(null);

  const isBusy = status === "signing" || status === "uploading" || status === "saving";
  const libraryItems = getLibraryItems(mediaAssets);
  const isMutating = isBusy || deletingAssetId !== null;

  async function uploadFile(file: File) {
    const displayName = getDisplayNameFromFileName(file.name);

    if (file.type.startsWith("video/")) {
      setStatus("signing");
      setMessage(`Preparando envio de ${file.name}…`);

      const signedVideoUpload = await createSignedAdminVideoUploadAction({
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
      });

      if (!signedVideoUpload.uploadUrl || !signedVideoUpload.sourceStorageKey) {
        throw new Error(signedVideoUpload.error || `Não foi possível preparar o envio de ${file.name}.`);
      }

      setStatus("uploading");
      setMessage(`Enviando ${file.name} para o storage…`);

      const uploadResponse = await fetch(signedVideoUpload.uploadUrl, {
        body: file,
        headers: { "Content-Type": file.type },
        method: "PUT",
      });

      if (!uploadResponse.ok) {
        throw new Error(`O envio de ${file.name} falhou. Verifique as configurações do storage.`);
      }

      setMessage(`Processando ${file.name}…`);

      const response = await fetch("/admin/uploads/video/process", {
        body: JSON.stringify({
          altText: displayName,
          projectId,
          sourceStorageKey: signedVideoUpload.sourceStorageKey,
          usageScope,
        }),
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Não foi possível otimizar ${file.name}.`);
      }

      await readVideoProgressStream(response, (event) => setMessage(event.message));

      return;
    }

    setStatus("signing");
    setMessage(`Preparando envio de ${file.name}…`);

    const signedUpload = await createSignedAdminUploadAction({
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
    });

    if (!signedUpload.uploadUrl || !signedUpload.storageKey) {
      throw new Error(signedUpload.error || `Não foi possível preparar o envio de ${file.name}.`);
    }

    setStatus("uploading");
    setMessage(`Enviando ${file.name}…`);

    const uploadResponse = await fetch(signedUpload.uploadUrl, {
      body: file,
      headers: { "Content-Type": file.type },
      method: "PUT",
    });

    if (!uploadResponse.ok) {
      throw new Error(`O envio de ${file.name} falhou. Verifique as configurações do storage.`);
    }

    setStatus("saving");
    setMessage(`Salvando ${file.name} na biblioteca…`);

    const result = await saveMediaAssetAction({
      altText: displayName,
      mimeType: file.type,
      projectId,
      sizeBytes: file.size,
      storageKey: signedUpload.storageKey,
      usageScope,
    });

    if (!result.ok) {
      throw new Error(result.error ?? `Não foi possível salvar ${file.name} na biblioteca.`);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const files = Array.from(fileInputRef.current?.files ?? []);

    if (files.length === 0) {
      setStatus("error");
      setMessage("Escolha uma ou mais fotos ou vídeos para enviar.");
      return;
    }

    let uploadedCount = 0;
    let failedCount = 0;

    try {
      for (const [index, file] of files.entries()) {
        setMessage(`Enviando ${index + 1} de ${files.length}: ${file.name}`);

        try {
          await uploadFile(file);
          uploadedCount += 1;
        } catch (error) {
          failedCount += 1;
          console.error("Media upload failed", {
            error,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
          });
          setMessage(error instanceof Error ? error.message : `O envio de ${file.name} falhou.`);
        }
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setStatus(failedCount > 0 ? "error" : "success");
      setMessage(
        failedCount > 0
          ? `${uploadedCount} enviado${uploadedCount === 1 ? "" : "s"}, ${failedCount} falhou${failedCount === 1 ? "" : "ram"}.`
          : `${uploadedCount} arquivo${uploadedCount === 1 ? "" : "s"} enviado${uploadedCount === 1 ? "" : "s"}.`,
      );
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "O envio falhou.");
    }
  }

  function handleDeleteAsset(assetIds: string[], displayName: string) {
    if (isBusy || deletingAssetId) {
      return;
    }

    setPendingDeleteAsset({ assetIds, displayName });
  }

  async function handleConfirmDeleteAsset() {
    if (!pendingDeleteAsset || isBusy || deletingAssetId) {
      return;
    }

    const asset = pendingDeleteAsset;
    setPendingDeleteAsset(null);
    setDeletingAssetId(asset.assetIds[0] ?? null);
    setStatus("idle");
    setMessage(`Apagando ${asset.displayName}…`);

    try {
      for (const assetId of asset.assetIds) {
        const result = await deleteMediaAssetAction(assetId);
        if (!result.ok) {
          throw new Error(result.error ?? "Não foi possível apagar o arquivo.");
        }
      }

      setMessage(`${asset.displayName} apagado.`);
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Não foi possível apagar o arquivo.");
    } finally {
      setDeletingAssetId(null);
    }
  }

  return (
    <>
    <Card className="scroll-mt-6 rounded-none" id={usageScope === "site" ? "midias" : undefined}>
      <CardHeader>
          <p className="text-admin-label uppercase tracking-[0.18em] text-muted-foreground">
            {usageScope === "site" ? "Arquivos do site" : "Arquivos deste projeto"}
          </p>
          <CardTitle className="text-admin-section-title font-normal tracking-[-0.02em]">{title}</CardTitle>
          <CardDescription className="max-w-2xl text-admin-body leading-6">
            {description}
          </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <form className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <label className="text-admin-label uppercase tracking-[0.14em]" htmlFor="media-upload-file">
              Arquivos
            </label>
            <input
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
              className="min-h-12 border border-input bg-background px-3 py-2 text-admin-body text-foreground outline-none transition-colors file:mr-3 file:border-0 file:bg-primary file:px-3 file:py-2 file:text-admin-body file:text-primary-foreground focus-visible:border-ring focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              disabled={isMutating}
              id="media-upload-file"
              multiple
              ref={fileInputRef}
              type="file"
            />
          </div>
          <Button
            className="min-h-12 rounded-none px-5 text-admin-label uppercase tracking-[0.16em]"
            disabled={isMutating}
            type="submit"
          >
            {isBusy ? "Enviando…" : "Enviar"}
          </Button>
        </form>
        {message ? (
          <Alert
            className="rounded-none"
            aria-live="polite"
            role={status === "error" ? "alert" : "status"}
            variant={status === "error" ? "destructive" : "default"}
          >
            <AlertDescription className="text-admin-body">
              {message}
            </AlertDescription>
          </Alert>
        ) : null}
        <div className="flex flex-col gap-3">
          <h3 className="text-admin-label uppercase tracking-[0.14em]">Biblioteca</h3>
          {mediaAssets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Uso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {libraryItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="min-w-56 whitespace-normal font-medium">{item.displayName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.mimeType}</Badge>
                    </TableCell>
                    <TableCell>
                      {item.usageScope === "site" ? "Site" : "Projeto"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                        <Button
                          className="rounded-none text-admin-label uppercase tracking-[0.14em]"
                          disabled={isMutating}
                          onClick={() => handleDeleteAsset(item.assets.map((asset) => asset.id), item.displayName)}
                          type="button"
                          variant="outline"
                        >
                          {deletingAssetId === item.id ? "Apagando…" : "Apagar"}
                        </Button>
                        <a
                          className={buttonVariants({
                            className: "rounded-none text-admin-label uppercase tracking-[0.14em]",
                            variant: "outline",
                          })}
                          href={item.url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Abrir
                        </a>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty className="border">
              <EmptyHeader>
                <EmptyTitle>Nenhuma mídia salva ainda</EmptyTitle>
                <EmptyDescription>
                  Envie fotos ou vídeos para disponibilizar arquivos nos campos de mídia do admin.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </CardContent>
    </Card>
    <Dialog open={isBusy}>
      <DialogContent className="rounded-none" showCloseButton={false}>
        <DialogHeader>
          <p className="text-admin-help uppercase tracking-[0.18em] text-muted-foreground">Upload em andamento</p>
          <DialogTitle className="text-admin-section-title font-normal tracking-[-0.03em]">
            Processando envio
          </DialogTitle>
          <DialogDescription>
            Não feche esta aba até o processamento terminar.
          </DialogDescription>
        </DialogHeader>
        <Alert aria-live="polite" className="rounded-none" role="status">
          <AlertDescription className="text-admin-body">
            {message || "Preparando envio…"}
          </AlertDescription>
        </Alert>
      </DialogContent>
    </Dialog>
    <AlertDialog
      open={pendingDeleteAsset !== null}
      onOpenChange={(open) => {
        if (!open) {
          setPendingDeleteAsset(null);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apagar arquivo?</AlertDialogTitle>
          <AlertDialogDescription>
            Apagar {pendingDeleteAsset?.displayName ?? "este arquivo"} remove o arquivo da biblioteca e do storage.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isMutating}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={isMutating}
            onClick={() => void handleConfirmDeleteAsset()}
            type="button"
            variant="destructive"
          >
            Apagar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
