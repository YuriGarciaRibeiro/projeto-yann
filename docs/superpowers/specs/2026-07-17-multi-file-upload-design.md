# Multi-File Upload Design

## Goal

Make media upload simpler for Yann: no manual display name field, multiple files can be selected at once, and videos appear as one logical file in the admin even though two internal variants are created.

## Approved Behavior

- The upload form uses the original file name as the display name.
- The visible display name removes the extension, so `casa.mp4` appears as `casa`.
- The file input accepts multiple files.
- Files upload sequentially to avoid overloading FFmpeg and storage.
- Images create one media asset.
- Videos create two internal media assets, one `scrub` and one `standard`.
- The admin library groups video variants so the user sees one row per uploaded video.
- Media selectors continue to filter the correct internal variant automatically.
- Upload completion shows a Portuguese summary, such as `4 arquivos enviados.` or `3 enviados, 1 falhou.`

## Scope

This change does not introduce a new database table. It keeps the current `media_assets.videoVariant` model and groups duplicate video variants visually by normalized display name.
