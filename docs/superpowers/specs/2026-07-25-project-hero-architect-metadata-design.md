# Project Hero Metadata Layout Design

## Goal

Simplify the project hero by removing the lateral facts table and keeping the small metadata line above the title.

## Behavior

The hero metadata line renders the available values in this order: hero display name, category, location, year. Missing values are omitted without leaving extra separators.

The hero no longer renders the `dl` table containing Arquiteto(a), Local, Ano, and Categoria.

## Scope

Only the project hero layout changes. Technical info sections, footer contact credits, and scroll/video behavior remain unchanged.

## Verification

Add a focused source-level test that checks the hero builds metadata from `heroDisplayName`, `category`, `location`, and `year`, and no longer renders `HeroFact` or the facts table.
