# Good Boy Atelier

Speculative mobile-first prototype: a studio that sculpts your dog as a memorial, commissioned while they're still alive. A portfolio piece; see [DESIGN.md](DESIGN.md) for the UX rationale.

**Live:** https://daverich-jpg.github.io/good-boy-atelier/ (deployed from `main` by GitHub Actions)

```bash
npm install
npm run dev   # http://localhost:5230
```

- **Begin a commission:** a six-step order flow (dog, placement, size and material, guided photos with on-device quality checks, notes, review and reserve). No payment is taken.
- **See an example: Bo's commission:** a seeded commission waiting at likeness approval. Request a change and Ines "revises" it in a few seconds.

React 19 + TypeScript + Vite, with no other dependencies. State is kept in `localStorage` (`gba:v1`).
