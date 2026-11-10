# Satzklar

Reading this as: a trust-first billing tool for German freelancers, with a Swiss ledger language, leaning toward the Satzklar design system (navy, paper, paid green, Plus Jakarta Sans).

## Dials

- UI/UX Pro Max: variance 4, motion 3, density 5. Landing stays spacious. Studio is dense (8) and uses plain figures, not cards around every number.
- Open Design `design-taste-frontend`: trust-first override, variance 4, motion 3, density 5. Public-sector and tax-adjacent constraints beat a louder aesthetic.

## What governs the UI

`design-system/satzklar/MASTER.md` is the brand contract from UI/UX Pro Max: Swiss minimalism, Plus Jakarta Sans, the navy and green palette, 4/8 spacing, visible focus, reduced motion, no emoji icons, Phosphor only.

Open Design `frontend-design` and `design-taste-frontend` govern craft. They override a generated page file when that file fights the product:

- `pages/landing.md` drifted into glassmorphism and an orange CTA. That is the generic look both skills reject, and it breaks the one-palette rule. Landing keeps the master palette and uses a live calculator plus the real invoice component.
- `pages/studio.md` drifted into Fira and orange. Studio keeps Plus Jakarta Sans and the master palette, and only takes the higher density.
- The Digits fintech template (black, warm paper, neon lime) is a slide deck, not this product. Neon lime is too loud for invoices. Swiss grid discipline stays: one reading order, tabular numbers, quiet motion.
- On-accent text is `#0F172A`, not pure black. Pure `#000` is banned, and `#0F172A` still clears 4.5:1 on `#059669`.
- No GSAP scroll reveal. Content is visible without JavaScript. Motion is color and border transitions at 200ms, removed under `prefers-reduced-motion`.
- Separation is a hairline border. No stacked shadows, no glass, no gradient text.

## Product

Satzklar calculates the hourly rate a freelancer needs, then turns that rate into a quote or invoice and lists what is still unpaid. Data stays in the browser. Sample records are labeled Beispiel.
