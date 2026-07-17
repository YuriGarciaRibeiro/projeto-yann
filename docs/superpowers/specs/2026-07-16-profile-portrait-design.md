# Profile Portrait Design

## Purpose

Add an editable architect portrait to the public profile section so Yann's portfolio can present both the work and the professional behind it.

## Approved Direction

Use the existing media upload system. The admin uploads an image, then selects it as the profile portrait in the profile form. The public homepage renders that image in the `Perfil` section beside Yann's name and biography.

## Data Model

Add an optional `portraitImageAssetId` field to `SiteProfile`, referencing `MediaAsset`. The value must be either null or an image media asset.

## Admin Behavior

The profile form includes a `Portrait image` selector filtered to `image/*` assets. Saving the profile validates the selected media on the server before updating the database.

## Public Behavior

`ProfileSection` receives an optional portrait image. When present, it renders a restrained editorial image block. When absent, the layout remains complete and text-led.

## Constraints

Keep the visual system monochrome and editorial. Do not use rounded cards, decorative frames, colorful accents, or heavy shadows. The image should support the profile section without competing with the featured project media.
