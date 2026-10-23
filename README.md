# Cogni Quest — game

A learning game for one child: maths first, then reading, logic, memory and
attention. The game around it — Kings Bounty today, something else tomorrow —
is there for motivation only.

The successor of `quest` (frozen). Start with the design documents (in
Russian):

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — the core, task plugins, game
  plugins, the cloud, the switch from the old version.
- [docs/CURRICULUM.md](docs/CURRICULUM.md) — the curriculum graph: topics in
  the textbook's order, their formats and their sections by difficulty. It is
  the source of truth; the data follows it.

## Running

Requires Node 24 or newer.

```
npm install
npm run dev      # the test stand at http://localhost:5173
npm run check    # everything at once: format, lint, types, tests
npm run build
```

## Layout

```
packages/
  core/                 the methodology: tasks, answers, attempts, sections and levels, the plugin registry
  tasks/addition/       task plugin «addition and subtraction»: logic/ without React, view/ in React
  curriculum/           curriculum graphs as data (math-moro.json)
apps/
  play/                 the site the child will open; for now, the test stand
docs/                   the design documents
architecture.test.ts    who may import what
curriculum-docs.test.ts the graph data must match docs/CURRICULUM.md
.github/workflows/      CI: the full check and the build on every push
```

## Strictness

- **TypeScript** in its strictest mode (`strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes` and more).
- **The methodology runs without a browser:** the core, the plugins' logic and
  the curriculum are typechecked a second time without the DOM
  (`tsconfig.pure.json`) — `document` simply does not exist there.
- **Import boundaries** — `architecture.test.ts`: the core imports nothing, a
  plugin's logic imports only the core and `zod`, plugins never reach into one
  another.
- **The graph stays honest** — `curriculum-docs.test.ts`: every topic of the
  data is in the document, in the same order and grade, every dependency is a
  path in the document's diagram, and no edge points back in the textbook.
- **ESLint** — `strictTypeChecked` + `stylisticTypeChecked`, rules for React
  hooks and tests, zero warnings.
- **Prettier** — formatting is not up for discussion.
- **CI** — `npm run check` and the build on every push.
