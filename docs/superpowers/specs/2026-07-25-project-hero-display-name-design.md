# Project Hero Display Name Design

## Goal

Add an optional project field for the name shown in the hero metadata line above the project title. This separates the public hero label from the architect contact name.

## Behavior

The admin project form includes a text field labeled `Apelido da Hero`.

The backend persists the value as `projects.hero_display_name` and exposes it as `heroDisplayName` in admin and public project payloads.

The project hero metadata line renders available values in this order: hero display name, category, location, year. If the hero display name is empty, it is omitted without leaving an extra separator.

The architect responsible name remains unchanged for credits, contact, and technical information.

## Verification

Tests should cover backend project mapping, frontend project form/action plumbing, and hero rendering source expectations.
