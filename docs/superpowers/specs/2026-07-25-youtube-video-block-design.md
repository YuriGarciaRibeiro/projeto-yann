# YouTube Video Block Design

## Goal

Change the public `video_block` section from an uploaded standard video workflow to a YouTube embed workflow. The scroll/parallax video section remains unchanged.

## Admin Experience

For `video_block`, the project section form shows title, text, caption, visibility, and a YouTube URL field. It does not show the primary uploaded video selector for this section type.

The YouTube URL is stored in `section.metadata.youtubeUrl`. This avoids database and backend schema changes while keeping the value attached to the section.

## Public Rendering

`VideoBlockSection` reads `section.metadata.youtubeUrl`, accepts normal YouTube watch URLs, short `youtu.be` URLs, and embed URLs, then renders a responsive 16:9 `iframe` using `youtube.com/embed/{videoId}`.

If no valid YouTube URL is present, the section falls back to existing uploaded media, then the poster image, then the unavailable-media placeholder.

## Validation And Safety

The frontend only creates an embed URL for recognized YouTube hosts with a video id. Invalid or empty values are treated as missing media.

The iframe includes a descriptive `title`, `allowFullScreen`, and the standard YouTube permissions needed for playback.

## Testing

Add focused tests for YouTube URL parsing so supported URL formats render to the expected embed URL and unsupported URLs are rejected.
