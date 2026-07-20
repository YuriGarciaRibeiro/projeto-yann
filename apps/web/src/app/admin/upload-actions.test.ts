import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  applyUploadModalInert,
  clearUploadModalInert,
  restoreUploadModalFocus,
} from "./components/upload-modal-dom";

const currentDir = dirname(fileURLToPath(import.meta.url));
const uploadActionsSource = readFileSync(join(currentDir, "upload-actions.ts"), "utf8");
const mediaUploadFieldSource = readFileSync(
  join(currentDir, "components", "MediaUploadField.tsx"),
  "utf8",
);
const uploadModalDomSource = readFileSync(join(currentDir, "components", "upload-modal-dom.ts"), "utf8");
const adminActionsSource = readFileSync(join(currentDir, "actions.ts"), "utf8");
const videoUploadRouteSource = readFileSync(join(currentDir, "uploads", "video", "route.ts"), "utf8");

class FakeElement {
  attributes = new Set<string>();
  focusCount = 0;
  isConnected = true;

  hasAttribute(name: string) {
    return this.attributes.has(name);
  }

  setAttribute(name: string) {
    this.attributes.add(name);
  }

  removeAttribute(name: string) {
    this.attributes.delete(name);
  }

  focus() {
    this.focusCount += 1;
  }
}

const backgroundElement = new FakeElement();
const portalElement = new FakeElement();
const alreadyInertElement = new FakeElement();
alreadyInertElement.setAttribute("inert");

const inertedElements = applyUploadModalInert(
  [backgroundElement, portalElement, alreadyInertElement],
  portalElement,
);

assert.deepEqual(
  inertedElements,
  [backgroundElement],
  "upload modal inert helper must return only elements it marked inert",
);
assert.equal(backgroundElement.hasAttribute("inert"), true, "background content must become inert");
assert.equal(portalElement.hasAttribute("inert"), false, "portal content must stay interactive");
assert.equal(
  alreadyInertElement.hasAttribute("inert"),
  true,
  "pre-existing inert content must remain inert",
);

clearUploadModalInert(inertedElements);

assert.equal(
  backgroundElement.hasAttribute("inert"),
  false,
  "upload modal inert cleanup must remove inert it added",
);
assert.equal(
  alreadyInertElement.hasAttribute("inert"),
  true,
  "upload modal inert cleanup must not remove pre-existing inert attributes",
);

const enabledFocusTarget = new FakeElement();
restoreUploadModalFocus(enabledFocusTarget);
assert.equal(enabledFocusTarget.focusCount, 1, "upload modal must restore focus to enabled connected elements");

const disabledFocusTarget = new FakeElement();
disabledFocusTarget.setAttribute("disabled");
restoreUploadModalFocus(disabledFocusTarget);
assert.equal(disabledFocusTarget.focusCount, 0, "upload modal must not focus disabled elements");

const disconnectedFocusTarget = new FakeElement();
disconnectedFocusTarget.isConnected = false;
restoreUploadModalFocus(disconnectedFocusTarget);
assert.equal(disconnectedFocusTarget.focusCount, 0, "upload modal must not focus disconnected elements");

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
  videoUploadRouteSource.includes("request.formData()"),
  false,
  "video upload route must forward the multipart request body without buffering formData",
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

assert.equal(
  mediaUploadFieldSource.includes('role="dialog"'),
  true,
  "media upload must render an accessible blocking dialog while busy",
);

assert.equal(
  mediaUploadFieldSource.includes('aria-modal="true"'),
  true,
  "upload blocking dialog must be modal for assistive technology",
);

assert.equal(
  mediaUploadFieldSource.includes("Processando envio"),
  true,
  "upload blocking dialog must show a clear processing title",
);

assert.equal(
  mediaUploadFieldSource.includes("Não feche esta aba até o processamento terminar."),
  true,
  "upload blocking dialog must warn the admin not to close the tab",
);

assert.equal(
  mediaUploadFieldSource.includes("dialogRef"),
  true,
  "upload blocking dialog must receive focus while busy",
);

assert.equal(
  uploadModalDomSource.includes('setAttribute("inert", "")'),
  true,
  "upload blocking dialog must make non-modal content inert while busy",
);

assert.equal(
  mediaUploadFieldSource.includes("tabIndex={-1}"),
  true,
  "upload blocking dialog must be programmatically focusable",
);

assert.equal(
  mediaUploadFieldSource.includes("createPortal"),
  true,
  "upload blocking dialog must render outside the page content with a portal",
);

assert.equal(
  mediaUploadFieldSource.includes("document.body.appendChild"),
  true,
  "upload blocking dialog must append a dedicated portal container to the page body",
);

assert.equal(
  mediaUploadFieldSource.includes("Array.from(document.body.children)"),
  true,
  "upload blocking dialog must inert body-level siblings while busy",
);

assert.equal(
  uploadModalDomSource.includes("child !== portalContainer"),
  true,
  "upload blocking dialog must keep its portal container interactive while inerting the page",
);

assert.equal(
  mediaUploadFieldSource.includes("previousFocusRef"),
  true,
  "upload blocking dialog must remember focus before opening",
);

assert.equal(
  mediaUploadFieldSource.includes("restoreUploadModalFocus(previousFocus)"),
  true,
  "upload blocking dialog must restore focus after closing",
);

assert.equal(
  mediaUploadFieldSource.includes('role={status === "error" ? "alert" : isBusy ? undefined : "status"}'),
  true,
  "inline upload message must not duplicate status announcements while busy",
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
