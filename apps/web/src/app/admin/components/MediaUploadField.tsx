"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";

import type { AdminMediaAsset } from "@/lib/api/admin-media";
import type { MediaUsageScope } from "@/lib/api/project-types";

import { saveMediaAssetAction } from "../actions";
import { createSignedAdminUploadAction, type VideoUploadProgressEvent } from "../upload-actions";
import {
  applyUploadModalInert,
  clearUploadModalInert,
  restoreUploadModalFocus,
} from "./upload-modal-dom";
import { getLibraryItems } from "./media-library-items";

type MediaUploadFieldProps = {
  description: string;
  mediaAssets: AdminMediaAsset[];
  projectId?: string | null;
  title: string;
  usageScope: MediaUsageScope;
};

type UploadStatus = "idle" | "signing" | "uploading" | "saving" | "success" | "error";

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
  const dialogRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [message, setMessage] = useState("");
  const [portalContainer] = useState<HTMLDivElement | null>(() => {
    if (typeof document === "undefined") {
      return null;
    }

    const container = document.createElement("div");
    container.setAttribute("data-media-upload-portal", "");
    return container;
  });
  const [status, setStatus] = useState<UploadStatus>("idle");

  const isBusy = status === "signing" || status === "uploading" || status === "saving";
  const libraryItems = getLibraryItems(mediaAssets);

  useEffect(() => {
    if (!portalContainer || typeof document === "undefined") {
      return;
    }

    document.body.appendChild(portalContainer);

    return () => portalContainer.remove();
  }, [portalContainer]);

  useEffect(() => {
    if (!isBusy || !portalContainer || typeof document === "undefined") {
      return;
    }

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const inertedChildren = applyUploadModalInert(Array.from(document.body.children), portalContainer);

    dialogRef.current?.focus();

    return () => {
      const previousFocus = previousFocusRef.current;
      previousFocusRef.current = null;

      clearUploadModalInert(inertedChildren);
      restoreUploadModalFocus(previousFocus);
    };
  }, [isBusy, portalContainer]);

  async function uploadFile(file: File) {
    const displayName = getDisplayNameFromFileName(file.name);

    if (file.type.startsWith("video/")) {
      setStatus("uploading");
      setMessage(`Enviando ${file.name} e criando versões para rolagem e com áudio...`);

      const videoFormData = new FormData();
      videoFormData.append("file", file);
      videoFormData.append("altText", displayName);
      videoFormData.append("usageScope", usageScope);
      if (projectId) {
        videoFormData.append("projectId", projectId);
      }

      const response = await fetch("/admin/uploads/video", {
        body: videoFormData,
        cache: "no-store",
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Não foi possível otimizar ${file.name}.`);
      }

      await readVideoProgressStream(response, (event) => setMessage(event.message));

      return;
    }

    setStatus("signing");
    setMessage(`Preparando envio de ${file.name}...`);

    const signedUpload = await createSignedAdminUploadAction({
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
    });

    if (!signedUpload.uploadUrl || !signedUpload.storageKey) {
      throw new Error(signedUpload.error || `Não foi possível preparar o envio de ${file.name}.`);
    }

    setStatus("uploading");
    setMessage(`Enviando ${file.name}...`);

    const uploadResponse = await fetch(signedUpload.uploadUrl, {
      body: file,
      headers: { "Content-Type": file.type },
      method: "PUT",
    });

    if (!uploadResponse.ok) {
      throw new Error(`O envio de ${file.name} falhou. Verifique as configurações do storage.`);
    }

    setStatus("saving");
    setMessage(`Salvando ${file.name} na biblioteca...`);

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

  const uploadDialog = isBusy && portalContainer
    ? createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
          <div
            aria-labelledby="media-upload-progress-title"
            aria-modal="true"
            className="w-full max-w-md border border-neutral-950 bg-white p-6 shadow-2xl md:p-8"
            ref={dialogRef}
            role="dialog"
            tabIndex={-1}
          >
            <p className="text-admin-help uppercase tracking-[0.18em] text-neutral-500">Upload em andamento</p>
            <h2
              className="mt-3 text-admin-section-title font-normal tracking-[-0.03em] text-neutral-950"
              id="media-upload-progress-title"
            >
              Processando envio
            </h2>
            <p className="mt-5 border border-neutral-200 px-4 py-3 text-admin-body text-neutral-700" role="status">
              {message || "Preparando envio..."}
            </p>
            <p className="mt-4 text-admin-help leading-5 text-neutral-500">
              Não feche esta aba até o processamento terminar.
            </p>
          </div>
        </div>,
        portalContainer,
      )
    : null;

  return (
    <>
    <section className="border border-neutral-200 bg-white p-5 md:p-6" id={usageScope === "site" ? "midias" : undefined}>
      <div className="space-y-5">
        <div>
          <p className="text-admin-label uppercase tracking-[0.18em] text-neutral-500">
            {usageScope === "site" ? "Arquivos do site" : "Arquivos deste projeto"}
          </p>
          <h2 className="mt-2 text-admin-section-title font-normal tracking-[-0.02em]">{title}</h2>
          <p className="mt-2 max-w-2xl text-admin-body leading-6 text-neutral-600">
            {description}
          </p>
        </div>
        <form className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <label className="text-admin-label uppercase tracking-[0.14em]" htmlFor="media-upload-file">
              Arquivos
            </label>
            <input
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
              className="min-h-12 border border-neutral-300 bg-white px-3 py-2 text-admin-body outline-none file:mr-3 file:border-0 file:bg-neutral-950 file:px-3 file:py-2 file:text-admin-body file:text-white focus:border-neutral-950"
              disabled={isBusy}
              id="media-upload-file"
              multiple
              ref={fileInputRef}
              type="file"
            />
          </div>
          <button
            className="min-h-12 border border-neutral-950 px-5 text-admin-label uppercase tracking-[0.16em] hover:bg-neutral-950 hover:text-white focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-neutral-950 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-400 disabled:hover:bg-white disabled:hover:text-neutral-400"
            disabled={isBusy}
            type="submit"
          >
            {isBusy ? "Enviando" : "Enviar"}
          </button>
        </form>
        {message ? (
          <p
            className={
              status === "error"
                ? "border border-neutral-950 bg-neutral-950 px-4 py-3 text-admin-body text-white"
                : "border border-neutral-300 px-4 py-3 text-admin-body text-neutral-700"
            }
            role={status === "error" ? "alert" : isBusy ? undefined : "status"}
          >
            {message}
          </p>
        ) : null}
        <div className="space-y-3">
          <h3 className="text-admin-label uppercase tracking-[0.14em]">Biblioteca</h3>
          {mediaAssets.length > 0 ? (
            <ul className="divide-y divide-neutral-200 border border-neutral-200 text-admin-body">
              {libraryItems.map((item) => (
                <li className="grid gap-1 px-3 py-3 md:grid-cols-[1fr_auto] md:gap-4" key={item.id}>
                  <span className="font-medium">{item.displayName}</span>
                  <span className="text-neutral-600">
                    {item.mimeType} / Usado em: {item.usageScope === "site" ? "Site" : "Projeto"}
                  </span>
                  <a
                    className="break-all text-neutral-600 underline underline-offset-4 md:col-span-2"
                    href={item.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Abrir arquivo: {item.url}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="border border-neutral-200 px-4 py-3 text-admin-body text-neutral-600">
              Nenhuma foto ou vídeo foi salvo ainda.
            </p>
          )}
        </div>
      </div>
    </section>
    {uploadDialog}
    </>
  );
}
