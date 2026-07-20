# Upload Blocking Modal Design

## Goal

Prevent accidental admin interaction while media uploads, video conversion, or metadata saving is in progress. The UI should make it obvious that the upload is still running and that the user should not close the tab.

## Current Behavior

`MediaUploadField` disables the file input and submit button while busy, but the rest of the admin page remains visually interactive. Progress text appears inline below the form.

## Approach

Add a central blocking modal rendered by `MediaUploadField` whenever the existing `isBusy` flag is true. The modal reuses the current `message` state, so it reflects image upload stages and streamed video processing stages without adding new backend behavior.

## UI Behavior

- Open when upload, signing, saving, or video processing starts.
- Cover the viewport with a dark translucent overlay.
- Show a white, bordered modal card with the title `Processando envio`.
- Show the latest progress message from `message`.
- Show the note `Não feche esta aba até o processamento terminar.`
- Close automatically when the busy state ends.
- Do not include a cancel button because upload cancellation is not implemented.
- Preserve the existing inline success/error message after the modal closes.

## Accessibility

- Use `role="dialog"` and `aria-modal="true"` on the modal container.
- Associate the modal title with `aria-labelledby`.
- Expose the progress message with `role="status"`.
- Keep the modal readable on mobile by using viewport-aware width and padding.

## Testing

Update the existing admin upload source guard test to assert that the upload component includes a blocking dialog tied to busy upload state. Existing lint and build checks should continue to pass.

## Out Of Scope

- Canceling an in-flight upload or video conversion.
- Numeric FFmpeg progress.
- A separate reusable modal component.
- Changes to backend upload behavior.
