<div align="center">

<a href="https://payam-resan.com">
  <img src=".github/assets/logo.svg" width="64" height="64" alt="Payam Resan">
</a>

<h1>Next.js examples for the Payam Resan SMS web service</h1>

Talk to the <a href="https://payam-resan.com"><b>Payam Resan SMS panel</b></a> from Next.js<br>
One route per API method, with a key that never reaches the browser

[![API](https://img.shields.io/badge/API-V3-0a7cbd)](https://payam-resan.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)](tsconfig.json)
[![License](https://img.shields.io/badge/license-MIT-6e7781)](LICENSE)

<a href="README.md">فارسی</a> · <b>English</b>

</div>

<sub>Looking for another language? The same examples exist for the others at
[github.com/Mojeshahr](https://github.com/Mojeshahr).</sub>

---

## Quick start

This repository is not a Next.js application. It is a set of route handlers
ready to be copied. Drop each file into the matching path in your own project:

```bash
cp examples/v3/send-token-single.ts ~/my-app/app/api/sms/send-token-single/route.ts
cp lib/session.ts                   ~/my-app/lib/session.ts
```

Then put the key in your project's `.env.local` and point the browser at that
route. `lib/session.ts` is deliberately unimplemented — replace it with your own
session check.

Start with `account-info`. It sends nothing and spends no credit.

## Before you send for real

A sandbox server answers like the production one but sends no message and spends
no credit. Replace `V3` in the URL with `V3SandBox`. The one exception is
`TokenList`, which is not implemented there.

Treat the sandbox as a simulator, not a mirror of your account. Its credit is
always `1234567`, its sender lines are made up, and it accepts any key. Success
there says nothing about whether your key is valid.

## Methods

| Example | Method | What it does |
|---|---|---|
| [account-info.ts](examples/v3/account-info.ts) | `AccountInfo` | credit and active sender lines |
| [send.ts](examples/v3/send.ts) | `Send` | simple send over `GET` |
| [send-bulk.ts](examples/v3/send-bulk.ts) | `SendBulk` | one text to many recipients, with your own trace id |
| [send-multiple.ts](examples/v3/send-multiple.ts) | `SendMultiple` | a different text per recipient |
| [token-list.ts](examples/v3/token-list.ts) | `TokenList` | template list and approval status |
| [send-token-single.ts](examples/v3/send-token-single.ts) | `SendTokenSingle` | template to one number |
| [send-token-single-get.ts](examples/v3/send-token-single-get.ts) | `SendTokenSingle` | the same, over `GET` |
| [send-token-single-concat-param.ts](examples/v3/send-token-single-concat-param.ts) | `SendTokenSingleConcatParam` | Server-generated code in the `p` string |
| [send-token-single-concat-param-get.ts](examples/v3/send-token-single-concat-param-get.ts) | `SendTokenSingleConcatParam` | The same, using upstream `GET` |
| [send-token-multi.ts](examples/v3/send-token-multi.ts) | `SendTokenMulti` | one template, many recipients |
| [status-by-id.ts](examples/v3/status-by-id.ts) | `StatusById` | delivery status by system id |
| [status-by-user-trace-id.ts](examples/v3/status-by-user-trace-id.ts) | `StatusByUserTraceId` | delivery status by your own id |
| [get-inbox.ts](examples/v3/get-inbox.ts) | `GetInbox` | incoming messages |

Five functions in these files are empty on purpose and return nothing:
`lookupOrders`, `lookupShipments`, `ownedMessageIds`, `ownedTraceIds` and
`storeInbox`. They are where your database query goes, and until you write them
no message is sent. That is deliberate.

## Two traps specific to Next.js

The other sample repositories teach you how to call the service. Calling it is
the easy part. There are two Next.js-specific traps here, and either one on its
own empties your account.

**The `NEXT_PUBLIC_` prefix ships the key to the browser.** Any environment variable whose name starts with `NEXT_PUBLIC_` gets **inlined
into the client JavaScript bundle**. That is a feature, meant for things like an
analytics URL.

Name your key `NEXT_PUBLIC_PAYAM_RESAN_API_KEY` and the first build writes it
into `.next/static/chunks/`, where View Source will find it. Nothing errors.
Everything works, right up until the invoice arrives.

The correct name is plain `PAYAM_RESAN_API_KEY`. An unprefixed variable is
readable only on the server, and if you reach for it in a client component by
mistake you get `undefined` rather than the key.

**A route handler is not a proxy.** The tempting conclusion is that once the key sits on the server, you are done.
But `/api/sms/send` is a public URL on your site. Anyone who finds it can call
it, and if the handler forwards whatever arrived in the body, you have published
a free SMS gateway. The key never leaked. The credit is gone anyway.

The handlers here follow two rules, and both are code rather than commentary:

**They ask who is calling.** The first line of every handler is `requireUser`.
[`lib/session.ts`](lib/session.ts) is deliberately unimplemented and throws in
production, so nobody ships on top of the stub by accident.

**They never take the message text from the browser.** In all thirteen handlers
the text is composed on the server. Text arriving in the request body means
anyone can send anything from your sender line.

The recipient has two cases, and both are in the examples. In
[`send-bulk.ts`](examples/v3/send-bulk.ts),
[`send-multiple.ts`](examples/v3/send-multiple.ts) and
[`send-token-multi.ts`](examples/v3/send-token-multi.ts) the browser sends an
order id and the server looks up whether that order belongs to this user and
what the phone number is.

In [`send-token-single.ts`](examples/v3/send-token-single.ts) the number
necessarily comes from the user — somebody signing up is not in your database
yet. The rule there is different: validate the format, and **generate the code
on the server and never return it**. If the code came from the request body, a
user could choose their own and then verify it. Rate limiting is your job there
too, or the route becomes a way to text other people.

## Using them in your own project
Each file is self-contained and depends on nothing in this repository except
[`lib/session.ts`](lib/session.ts). Copying a file to the matching path is all
there is to it:

```bash
cp examples/v3/send-bulk.ts ~/my-app/app/api/sms/send-bulk/route.ts
```

If your project does not define the `@/` alias, change only the `import` line to
a relative path. The rest of the code works unchanged.

`Envelope` is declared in each file and is not imported from anywhere. If you
use every method, declaring it once in your own project is the natural thing to
do.

## Things you will run into

**Inspect the HTTP status and the `Success` field.** Normal V3 operations return
`200`; the GET and POST `SendTokenSingleConcatParam` operations also document
`429` and `default` responses, which may lack the normal envelope. HTTP success
alone does not establish API success; inspect `Success` when an envelope is present.
The response envelope in each handler is a discriminated
union on `Success`, so removing the check stops the build.

**Recipient numbers carry no leading zero.** Use `9121112222`, or
`989121112222` with the country code. The `normalize` function in the examples
handles this, because users type `0912…`.

**Ninety-nine recipients per request is the ceiling.** The examples catch it
before going to the network.

**`UserTraceId` is always `null` in `SendTokenSingle`**, because that method
takes no such input. If you need a trace id, `SendTokenMulti` works for a single
recipient too.

**Each `GetInbox` call retrieves the entire current inbox and permanently removes
the returned messages. A later call cannot retrieve them again.** Do not wire the
`get-inbox` route to a page: every load consumes unread messages and they do
not come back. It belongs in a scheduled job that writes the result to your
own database.

## Keeping the key secret
The key is a secret. It does not belong in a source repository, in browser
JavaScript, or inside a mobile app bundle. It belongs in an environment variable
on the server.

Next.js adds one way to leak it that other frameworks do not have: any variable
whose name starts with `NEXT_PUBLIC_` is written into the browser bundle. That
is covered above.

If a key leaks, issue a new one from the panel. A deleted key never comes back.

## Layout

| Path | What it holds |
|---|---|
| `examples/v3/` | One self-contained handler per service operation |
| `lib/session.ts` | The authorization stub you replace in your own project |
| `.env.example` | The environment variables the handlers read |

The `v3` in the path is deliberate. A new service version means a new
`examples/v<n>/`, with the existing folder left alone.

## Documentation and support

The full guide to the web service is at
[docs.payam-resan.com](https://docs.payam-resan.com), and the machine-readable
OpenAPI description is in
[sms-webservice-spec](https://github.com/Mojeshahr/sms-webservice-spec).

Question or bug? [Open an issue](https://github.com/Mojeshahr/nextjs-sms-webservice/issues)
or contact [support](https://payam-resan.com).

## License

Released under the MIT license. Full text in [`LICENSE`](LICENSE).

<br>
<div align="center">
  <sub>
    <img src=".github/assets/logo.svg" width="16" height="16" alt="" align="top">
    &nbsp;<b>Payam Resan SMS Panel - Moje Shahr</b>&nbsp;
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset=".github/assets/mojeshahr-dark.svg">
      <img src=".github/assets/mojeshahr-light.svg" width="16" height="16" alt="" align="top">
    </picture>
  </sub>
  <br>
  <sub>
    <a href="https://payam-resan.com">payam-resan.com</a>
    &nbsp;·&nbsp;
    <a href="https://mojeshahr.ir">mojeshahr.ir</a>
  </sub>
</div>
