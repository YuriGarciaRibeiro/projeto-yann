---
name: media-performance
description: This skill should be used when preparing, compressing, exporting, delivering, preloading, profiling, or debugging video and image assets for the architecture portfolio, especially media used in scroll scrubbing or full-screen cinematic sections.
user-invocable: true
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# Media Performance

The visual experience fails if media seeking, decoding, transfer, or compositing is unreliable.
Optimize the asset pipeline and runtime together.

## Asset strategy

Keep a high-quality master:

- ProRes 422;
- DNxHR;
- PNG or EXR sequence.

Never create a new web export from an already compressed web file.

For every major sequence, prepare intentional variants:

- desktop landscape;
- tablet or intermediate crop when needed;
- mobile portrait or 4:5 crop;
- poster matching each crop.

Do not use one 4K desktop file with `object-fit: cover` for every device.

## Scrubbing codec strategy

Default:

- H.264 MP4 for broad compatibility.
- VP9 WebM as an optional alternative.
- AV1 only when tested across the actual target devices and delivery stack.
- No audio track for silent architectural scrubbing.
- 24 or 30fps is usually sufficient.
- Use frequent keyframes.

Starting GOP:

- keyframe every `6–15` frames;
- approximately `0.25–0.5s`;
- fixed scene-cut behavior for predictable seek points.

All-I-frame encoding may be used only for very short hero assets after measuring file size.

## Encoding

Use `scripts/encode-scrub-video.sh` as a repeatable starting point.

Example H.264 parameters:

```text
preset: slow
CRF: 19–22
pixel format: yuv420p
faststart: enabled
audio: removed
GOP: 8–12 for a 24–30fps sequence
scene cut: disabled for fixed keyframe spacing
```

## Delivery

The media host or CDN must support byte-range requests.

Expected response behavior:

```http
Accept-Ranges: bytes
Content-Length: ...
Cache-Control: public, max-age=31536000, immutable
```

Use hashed file names when serving immutable media.

## HTML source order

Provide explicit MIME and codec information where appropriate. Browsers should be able to reject
unsupported sources without downloading them.

```html
<video muted playsinline preload="metadata" poster="/poster.avif">
  <source src="/film-vp9.webm" type="video/webm; codecs=vp9" />
  <source src="/film.mp4" type="video/mp4" />
</video>
```

Do not assume the first format is universally best. Validate on Safari, Chrome, Firefox, iOS,
and representative Android devices.

## Loading policy

### First chapter

- Load the poster immediately.
- Start with `preload="metadata"`.
- Upgrade to more aggressive loading only after critical content and based on connection conditions.
- Do not reveal a scrub interaction before enough media is available for a stable initial experience.

### Later chapters

- Start with `preload="none"`.
- Begin loading approximately `1–1.5` viewports before the chapter.
- Keep one active scrubbed video.
- Pause and release unnecessary media resources when appropriate.

## Runtime performance

Animate frequently only with:

- transform;
- opacity.

Avoid during video scrubbing:

- full-screen blur;
- backdrop filter over moving video;
- large animated shadows;
- layout properties;
- multiple simultaneous 4K videos;
- canvas at source resolution;
- dozens of independently animated text nodes.

Use `will-change` briefly and only for elements about to animate.

## Practical budgets

Initial targets, to be validated rather than treated as universal rules:

| Asset | Target |
|---|---:|
| Desktop poster | 200–300 KB |
| Mobile poster | 100–150 KB |
| First desktop sequence | 6–12 MB |
| First mobile sequence | 3–6 MB |
| Active scrubbed videos | 1 |
| Simultaneous animated overlays | 2–4 |

## Diagnostics

Run:

```bash
./scripts/check-video.sh path/to/video.mp4
```

Inspect:

- codec;
- width and height;
- frame rate;
- duration;
- bitrate;
- audio tracks;
- pixel format;
- keyframe interval.

Profile the real page using browser performance tools. A compressed file can still stutter if
seeks are too frequent, keyframes are too sparse, or expensive overlays are composited above it.
