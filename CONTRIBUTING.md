# Contributing

Maintainer notes for this repository: the rules that keep the handlers
consistent with the other language repositories and with the documentation site.

If you came here to integrate the service into your own project, read
`AGENTS.md` instead. This file is about changing the handlers, not using them.

## Rule one: the key never reaches the browser

Two things make that true, and both are easy to undo by accident.

**No `NEXT_PUBLIC_` prefix, ever.** Next.js inlines any env var with that prefix
into the client bundle. Verified on 2026-09-11: with the prefix, the key appears
verbatim in `.next/static/chunks/app/page-*.js`; without it, the key is in
neither `.next/static` nor the server output, because it is read from the
environment at request time.

**No service URL or sender line anywhere a client could reach.** The browser
should know only that `/api/sms/send-token-single` exists on the reader's own
site. If an example ever imports a handler into a client component, stop.

## Rule two: a handler is not a proxy

`/api/sms/send` is a public URL on the customer's site. A handler that forwards
whatever arrived in the body is a free SMS gateway with the customer's credit
behind it. The key never leaked and the account still drained.

Every handler does two things before it touches the network, and they are code,
not comments:

- `requireUser(request)` first. `lib/session.ts` is deliberately unimplemented
  and throws in production, so nobody ships on top of the stub.
- Recipients and message text come from the server's own data, never from the
  request body. The browser sends an order id; the handler looks up whose order
  it is and what the phone number is. `send-token-single.ts` generates the OTP
  server-side and never returns it.

The helper functions `lookupOrders`, `lookupShipments`, `ownedMessageIds`,
`ownedTraceIds` and
`storeInbox` are empty on purpose and return nothing, so a fresh clone sends no
messages until someone fills them in.

## Rule three: the handlers are the documentation

Each handler carries `// docs:start` and `// docs:end`. The region between them
is lifted verbatim into the method's page on docs.payam-resan.com.

The layout is the same as every other language repository: `examples/v3/` with
one file per operation, named after the reference page slug. Do not move them
into an `app/` tree to make the repository runnable. That costs eleven one-line
re-export files, a Next.js dependency and a build step, all so the repository
can be something it was never meant to be. The Laravel repository has the same
tension and the same answer: ship the file, let the reader place it.

The file header tells the reader that destination, and that line is part of the
contract:

```
 * این فایل را در app/api/sms/send-bulk/route.ts پروژه خودتان بگذارید.
```

One thing learned and worth keeping: route segment config (`runtime`,
`dynamic`) has to be declared literally in the reader's `route.ts`. Re-exported
from another module, Next.js ignores it and warns. That is why the exports sit
at the top of every handler rather than being factored anywhere.

Full-line comments are stripped when the region is lifted, so anything the
reader must see has to be code.

## Rule four: the TypeScript 6 note belongs to the reader

This repository type-checks with `tsc` alone, so either TypeScript version would
do. The pin on `^6` is there to match what the reader will have: Next.js 15
reads `tsconfig.json` through the TypeScript compiler API, which the TS 7 native
compiler does not provide. On TS 7 their build fails, and before it fails it
silently ignores `paths`, so `@/…` imports stop resolving with a misleading
"module not found".

Keep that in `AGENTS.md`, because it is the reader's problem, not ours.

## Rule five: a version is a folder

A new service version means a new `examples/v<n>/`. No file inside an existing
version folder is moved or renamed; older versions still have users.

## Secrets

The key comes from `PAYAM_RESAN_API_KEY`, read inside the handler and checked
before the network call. No key, no real phone number and no customer name goes
into a file here, not even a dead one. Example numbers are `9121112222` upward
and the example key is `123456-XXXXXXXXXXXXXXX`.

## Layout

| Path | What it holds |
|---|---|
| `examples/v3/` | one handler per service operation, lifted into the docs |
| `lib/session.ts` | the authorization stub the customer replaces |

## Before every commit

```bash
npm run check
```

Be plain about what that proves and what it does not. `tsc` checks the handlers
in isolation; it cannot check that they work as App Router routes, because there
is deliberately no Next.js application here to build.

A real `next build` inside a consuming project is the only thing that proves a
handler runs. Say so when reporting; do not describe this repository as built.

## Git

Semantic messages, `type(scope): subject`, with no explanatory body and no
attribution trailer. Commits here are authored as Payam Resan.
