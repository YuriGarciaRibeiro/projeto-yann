import assert from "node:assert/strict";

import { getProjectFormFieldErrors } from "./project-form-errors";

assert.deepEqual(getProjectFormFieldErrors(new Error("projects_slug_unique")), {
  slug: "Este endereço da página já está em uso. Escolha outro.",
});

assert.deepEqual(
  getProjectFormFieldErrors(new Error("Hero video must be a scrub video asset.")),
  {
    heroVideoAssetId: "Escolha a versão otimizada para rolagem do vídeo de abertura.",
  },
);

assert.deepEqual(
  getProjectFormFieldErrors(
    new Error("O vídeo de abertura precisa usar a versão otimizada."),
  ),
  {
    heroVideoAssetId: "Escolha a versão otimizada para rolagem do vídeo de abertura.",
  },
);

assert.equal(
  getProjectFormFieldErrors(new Error("duplicate key value violates unique constraint")),
  null,
);
