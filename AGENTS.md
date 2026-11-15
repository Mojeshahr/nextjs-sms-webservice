# Working with this repository

You are looking at Next.js route handlers for the **Payam Resan** SMS web
service (`www.payam-resan.com`, API V3), an Iranian SMS provider. Someone is
probably asking you to add SMS to a Next.js application.

The handlers live in `examples/v3/`, one file per service method, named after
the method. Each is a complete App Router route: copy it into the user's project
at the matching path and it runs.

```bash
cp examples/v3/send-bulk.ts ~/my-app/app/api/sms/send-bulk/route.ts
```

`lib/session.ts` goes with it — every handler imports `requireUser` from there.

Read Rules 1 and 2 before you write anything. They are the two ways a Next.js
app gives away an SMS account, and neither produces an error message.

## Rule 1: never prefix the key with `NEXT_PUBLIC_`

Any environment variable whose name starts with `NEXT_PUBLIC_` is **inlined into
the client JavaScript bundle**. That is a feature, meant for things like an
analytics URL.

Name the key `NEXT_PUBLIC_PAYAM_RESAN_API_KEY` and the first build writes it
into `.next/static/chunks/`, where View Source finds it. Nothing errors.
Everything works, right up until the invoice arrives.

The correct name is plain `PAYAM_RESAN_API_KEY`. An unprefixed variable is
readable only on the server, and if you reach for it in a client component by
mistake you get `undefined` rather than the key.

The same applies to `VITE_` and `REACT_APP_` if the user has mixed tooling.

## Rule 2: a route handler is not a proxy

The tempting conclusion is that once the key sits on the server, you are done.
But `/api/sms/send` is a public URL on the user's site. Anyone who finds it can
call it, and if the handler forwards whatever arrived in the body, they have
published a free SMS gateway. The key never leaked. The credit is gone anyway.

The handlers here follow two rules, and both are code rather than commentary.

**They ask who is calling.** The first line of every handler is `requireUser`.
`lib/session.ts` is deliberately unimplemented and throws in production, so
nobody ships on top of the stub by accident. Replace it with the app's real
session check — NextAuth, Clerk, a signed cookie, anything whose result the
browser cannot forge.

**They never take the message text from the browser.** In all thirteen handlers
the text is composed on the server. Text arriving in the request body means
anyone can send anything from the user's sender line.

The recipient has two cases. In `send-bulk.ts`, `send-multiple.ts` and
`send-token-multi.ts` the browser sends an order id and the server looks it up.
In `send.ts`, `send-token-single.ts` and `send-token-single-get.ts` the number
comes from the request body, because somebody signing up is not in the database
yet — there the rules are to validate the format, rate-limit the route, and
**generate the one-time code on the server and never return it**. If the code
came from the body, a user could choose their own and then verify it.

Five functions are empty on purpose and return nothing: `lookupOrders`,
`lookupShipments`, `ownedMessageIds`, `ownedTraceIds` and `storeInbox`. They are
where the database query goes, and until they are written no message is sent.
That is deliberate.

## Rule 3: segment config must be literal

`export const runtime` and `export const dynamic` have to be declared in the
route file itself. Re-exported from another module, Next.js ignores them and
warns at build time.

```ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
```

Without `force-dynamic` a `GET` handler can be statically optimised and the
user gets a cached answer for a live balance.

## Rule 4: `Success`, never the HTTP status

The service answers `200` to everything, including a wrong key, an empty account
and a malformed body. `answer.ok` proves nothing.

The envelope is typed as a discriminated union on `Success`, so the compiler
refuses to let you read `Result` before checking:

```ts
type Envelope<T> =
  | { Success: true; ErrorCode: null; Error: null; Result: T }
  | { Success: false; ErrorCode: number; Error: string; Result: null };
```

Do not defeat it with `!`, `as`, or optional chaining. If narrowing fails, the
code is wrong, not the type.

Return `502` when the service rejects the call: the user's own API did nothing
wrong, the upstream did.

## Rule 5: pick the right method

| The user wants | Use | Route |
|---|---|---|
| one text to many people | `SendBulk` | `/api/sms/send-bulk` |
| a different text per person | `SendMultiple` | `/api/sms/send-multiple` |
| a one-time password or code | `SendTokenSingle` | `/api/sms/send-token-single` |
| a template to many people | `SendTokenMulti` | `/api/sms/send-token-multi` |
| delivery status | `StatusByUserTraceId` | `/api/sms/status-by-user-trace-id` |
| balance and sender lines | `AccountInfo` | `/api/sms/account-info` |

**A one-time password goes through a template**, not free text — that is the
usual route for OTP, and the template fixes the sender line, which is why
`SendTokenSingle` takes no `Sender`. `/api/sms/token-list` lists the account's
templates; `Status` `2` means approved and sendable, `1` awaiting review, `3`
rejected.

**Prefer `SendBulk` over `Send`.** `Send` is a `GET` upstream: the key ends up
in the URL and the web server log. Same for `send-token-single-get`.

## Rule 6: phone numbers, the 99 cap, and `UserTraceId`

The service wants `9121112222` or `989121112222`. Users type `09121112222` or
`+989121112222`. The `normalize` helper in the handlers does this; without it
you get error `13`. Ninety-nine recipients per request is the ceiling for
`SendBulk`, `SendMultiple` and `SendTokenMulti`, checked before the network
call.

Always send a `UserTraceId` — the application's own record id. After a timeout
or error `100`, resending blind may send twice; `StatusByUserTraceId` is the
only safe way to learn whether the message was registered. `StatusCode === 8`
there means the id is not in the account, so it is safe to send again.

`SendTokenSingle` is the exception: it has no such input, so its `UserTraceId`
comes back null. If a trace id is needed for an OTP, use `SendTokenMulti` with a
single recipient.

`URLSearchParams` encodes the query exactly once — pre-encode as well and the
message arrives full of `%D8`.

## Rule 7: know which errors are worth retrying

These never succeed on retry — fix the cause; retrying only burns the rate limit
until the account hits error `20`:

`1`, `2`, `3`, `6`, `8`, `9`, `10`, `11`, `12`, `13`, `14`, `19`

`19` is an empty balance; `10` means the server's IP is not on the account's
allowlist — common when a deployment moves, and very common on serverless where
the egress address is not fixed. Treat any unknown code the way you treat `100`:
unclear outcome, check with `StatusByUserTraceId` before resending.

## Rule 8: delivery status is a poll, not a callback

Status codes `0`, `1`, `2`, `3` and `10` mean still in flight — query again
later, and not more often than every few minutes or you will hit error `20`.
Everything else is final. Branch on `StatusCode`, never on the `Status` text,
which is Persian prose meant for humans and can change.

## Rule 9: `GetInbox` consumes what it returns

The service hands over each incoming message **once**. Never wire
`/api/sms/get-inbox` to a page: every load consumes unread messages
permanently. It belongs in a cron job — a Vercel Cron route or a scheduled
worker — that writes straight to the database.

The sender field is called `Form`, not `From`. That is the service's spelling.

## TypeScript 6, not 7

Next.js 15 reads `tsconfig.json` through the TypeScript compiler API, which the
TS 7 native compiler does not provide. On TS 7 the build fails, and before it
fails it silently ignores `paths`, so `@/…` imports stop resolving with a
misleading "module not found". This repository pins `typescript@^6`.

`baseUrl` is deprecated in TS 6 and errors the build — use `paths` alone.

## Testing without spending credit

Replace `V3` with `V3SandBox` in the URL. No message is sent and no credit is
spent. `TokenList` is not implemented there.

The sandbox is a simulator, not a mirror of the account: credit is always
`1234567`, sender lines are invented, and **it accepts any key**. Success there
proves nothing about the user's real key.

## Where the authoritative answers are

- Method reference and error tables: <https://docs.payam-resan.com>
- Machine-readable OpenAPI: <https://github.com/Mojeshahr/sms-webservice-spec>
- Plain Node.js or TypeScript, outside Next.js:
  [nodejs-sms-webservice](https://github.com/Mojeshahr/nodejs-sms-webservice) ·
  [typescript-sms-webservice](https://github.com/Mojeshahr/typescript-sms-webservice)

If the spec and these handlers ever disagree, the spec wins — report it as a bug
rather than guessing.
