"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

import type { AdminMediaAsset } from "@/lib/api/admin-media";
import type { MediaUsageScope } from "@/lib/api/project-types";

import { saveMediaAssetAction } from "../actions";
import { createSignedAdminUploadAction, uploadAdminVideoAction } from "../upload-actions";

type MediaUploadFieldProps = {
  description: string;
  mediaAssets: AdminMediaAsset[];
  projectId?: string | null;
  title: string;
  usageScope: MediaUsageScope;
};

type UploadStatus = "idle" | "signing" | "uploading" | "saving" | "success" | "error";

type LibraryItem = {
  assets: AdminMediaAsset[];
  displayName: string;
  id: string;
  mimeType: string;
  usageScope: MediaUsageScope;
  url: string;
};

function getDisplayNameFromFileName(fileName: string) {
  const extensionlessName = fileName.replace(/\.[^.]+$/, "").trim();
  return extensionlessName || fileName || "arquivo";
}

function getDisplayNameFromAsset(asset: AdminMediaAsset) {
  return asset.altText.replace(/ - (rolagem otimizado|normal com áudio)$/, "");
}

function getLibraryItems(mediaAssets: AdminMediaAsset[]) {
  const itemsByKey = new Map<string, LibraryItem>();

  for (const asset of mediaAssets) {
    const displayName = getDisplayNameFromAsset(asset);
    const isVideo = asset.mimeType.startsWith("video/");
    const key = isVideo ? `video:${displayName}` : asset.id;
    const existingItem = itemsByKey.get(key);

    if (existingItem) {
      existingItem.assets.push(asset);
      continue;
    }

    itemsByKey.set(key, {
      assets: [asset],
      displayName,
      id: asset.id,
      mimeType: asset.mimeType,
      usageScope: asset.usageScope,
      url: asset.url,
    });
  }

  return Array.from(itemsByKey.values());
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

  const isBusy = status === "signing" || status === "uploading" || status === "saving";
  const libraryItems = getLibraryItems(mediaAssets);

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

      const videoResult = await uploadAdminVideoAction(videoFormData);

      if (!videoResult.ok) {
        const requestHint = videoResult.requestId ? ` Código: ${videoResult.requestId}.` : "";
        throw new Error(
          `${videoResult.error || `Não foi possível otimizar ${file.name}.`}${requestHint}`,
        );
      }

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

  return (
    <section className="space-y-5 border border-neutral-200 bg-white p-5 md:p-6" id={usageScope === "site" ? "midias" : undefined}>
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-neutral-500">
          {usageScope === "site" ? "Arquivos do site" : "Arquivos deste projeto"}
        </p>
        <h2 className="mt-2 text-xl font-normal tracking-[-0.02em]">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
          {description}
        </p>
      </div>
      <form className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <label className="text-sm uppercase tracking-[0.14em]" htmlFor="media-upload-file">
            Arquivos
          </label>
          <input
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
            className="min-h-12 border border-neutral-300 bg-white px-3 py-2 text-sm outline-none file:mr-3 file:border-0 file:bg-neutral-950 file:px-3 file:py-2 file:text-sm file:text-white focus:border-neutral-950"
            disabled={isBusy}
            id="media-upload-file"
            multiple
            ref={fileInputRef}
            type="file"
          />
        </div>
        <button
          className="min-h-12 border border-neutral-950 px-5 text-sm uppercase tracking-[0.16em] hover:bg-neutral-950 hover:text-white focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-neutral-950 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-400 disabled:hover:bg-white disabled:hover:text-neutral-400"
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
              ? "border border-neutral-950 bg-neutral-950 px-4 py-3 text-sm text-white"
              : "border border-neutral-300 px-4 py-3 text-sm text-neutral-700"
          }
          role={status === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}
      <div className="space-y-3">
        <h3 className="text-sm uppercase tracking-[0.14em]">Biblioteca</h3>
        {mediaAssets.length > 0 ? (
          <ul className="divide-y divide-neutral-200 border border-neutral-200 text-sm">
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
          <p className="border border-neutral-200 px-4 py-3 text-sm text-neutral-600">
            Nenhuma foto ou vídeo foi salvo ainda.
          </p>
        )}
      </div>
    </section>
  );
}
