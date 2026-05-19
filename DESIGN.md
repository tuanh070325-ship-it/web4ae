# AkibaCore Design System

This file is the canonical UI reference for AI agents and humans changing AkibaCore frontend screens. Read it before creating or changing visual UI in `shopanime_fe`.

## Design Goal

AkibaCore is a manga commerce app. The UI should feel sharp, fast, and editorial without blocking the shopping flow. Product discovery must be immediate on mobile: navigation and filters should use progressive disclosure, overlays, drawers, or collapsible panels instead of pushing the catalog far below the fold.

## Brand Tokens

- App shell: `#111216`
- Page background: `#181a1f`
- Deep background: `#000000`
- Surface: `#1a1b22`
- Raised surface: `#242730`
- Border: `#2e333d`
- Primary red: `#e63946`
- Hot accent: `#ff315a`
- Catalog blue: `#5ea5c8`
- Rating amber: `#f5a623`
- Body text: `#a0a5b1`
- Muted text: `#5e6677`
- White text: `#ffffff`

## Typography

- Keep the existing Inter/system sans stack from `shopanime_fe/src/index.css`.
- Use uppercase and high weight only for short commerce labels, badges, and section headers.
- Product names should be readable before decorative. Use `line-clamp` instead of letting titles stretch cards.
- Do not scale text with viewport width. Use Tailwind breakpoints and fixed rem/px utility sizes already present in the app.

## Layout Rules

- Mobile first: primary content appears before secondary controls.
- Mobile navigation must not push the hero or catalog far down the page. Use a fixed drawer or overlay.
- Shop filters are secondary controls. On mobile they open in a drawer. On tablet/desktop they can be shown or hidden.
- Keep persistent controls sticky only when they help scanning. Avoid sticky blocks taller than one compact toolbar.
- Use stable product card dimensions with `aspect-*` utilities so images and hover states do not shift layout.
- Avoid nested cards. Cards are for repeated items, modals, drawers, and framed tools.

## Interaction Rules

- Use `lucide-react` icons for actions such as menu, close, search, filters, wishlist, cart, and admin.
- Touch targets should be at least `44px` high or wide on mobile.
- Every drawer or overlay needs a visible close control, an overlay/backdrop close path, and appropriate `aria-label` or `aria-expanded`.
- Prefer collapsible panels for long navigation/filter groups.
- Preserve keyboard/focus behavior by using real `button`, `a`, `input`, `select`, and `label` elements.

## Product Catalog Rules

- Product grid should be visible quickly on mobile. Filters should not force users to scroll through a long sidebar before seeing products.
- Keep sorting and filter entry points close to the catalog status line.
- Active filters should be visible as a count or chips.
- Price and rating formatting must use helpers in `shopanime_fe/src/lib/format.ts`.
- Product paths and images must use helpers in `shopanime_fe/src/lib/format.ts`.

## AI Coding Rules

- Reuse existing helpers, routes, and components before creating new abstractions.
- Do not add dependencies for UI polish.
- Do not invent unrelated brand colors or one-off gradient themes.
- For UI files, verify with `npm --prefix shopanime_fe run typecheck`; run `npm --prefix shopanime_fe run build` when feasible.

## Research Notes

These rules are adapted for AkibaCore after reviewing public guidance on AI project rules and frontend design systems:

- Cursor Project Rules: https://cursor.com/docs/rules
- DESIGN.md workflow: https://designmd.app/blog/design-md-with-cursor
- Generic frontend AI rules: https://aicodingrules.com/rules/codex/generic-frontend-ui-codex
- UI/UX design rule guidance: https://www.vibecodingtools.tech/rules/uiux-design
- MIT-licensed cursor rule examples: https://github.com/blefnk/awesome-cursor-rules
