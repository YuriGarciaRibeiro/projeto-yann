import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const uploadActionsSource = readFileSync(join(currentDir, "upload-actions.ts"), "utf8");
const mediaUploadFieldSource = readFileSync(
  join(currentDir, "components", "MediaUploadField.tsx"),
  "utf8",
);
const adminActionsSource = readFileSync(join(currentDir, "actions.ts"), "utf8");

assert.equal(
  /getAdminUploadHeadersAction|backendPublicUrl/.test(uploadActionsSource),
  false,
  "upload server actions must not expose backend URLs or authorization headers to client code",
);

assert.equal(
  uploadActionsSource.includes("export type VideoUploadProgressEvent"),
  true,
  "video upload actions must expose progress event typing",
);

assert.doesNotMatch(
  uploadActionsSource,
  /VideoUploadConnection|getVideoUploadConnectionAction|backendUrl\?:|token\?:/,
  "video upload actions must not expose backend connection details to client code",
);

assert.equal(
  mediaUploadFieldSource.includes("response.body.getReader()"),
  true,
  "video upload field must stream backend progress events",
);

assert.equal(
  mediaUploadFieldSource.includes("Não foi possível ler o progresso do processamento do vídeo."),
  true,
  "video upload progress parsing errors must use a controlled message",
);

assert.doesNotMatch(
  mediaUploadFieldSource,
  /headers:\s*\{\s*authorization:/,
  "video upload field must not send authorization headers to the browser fetch path",
);

assert.equal(
  mediaUploadFieldSource.includes("@/lib/api/admin-uploads"),
  false,
  "client upload components must call server actions instead of direct FastAPI helpers",
);

assert.equal(
  adminActionsSource.includes("getMediaDeliveryUrl"),
  false,
  "image metadata creation must let FastAPI derive media URLs instead of recomputing a Next media URL",
);

assert.doesNotMatch(
  mediaUploadFieldSource,
  /url:\s*signedUpload\.url/,
  "image uploads must not pass a client-held URL into saveMediaAssetAction",
);

assert.doesNotMatch(
  adminActionsSource,
  /createAdminMediaAsset\(\{[\s\S]*?\n\s*url[,\s\n]/,
  "saveMediaAssetAction must not forward client-provided media URLs to metadata creation",
);
