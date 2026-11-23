---
name: review-security
description: "How to review the security of a pull request: check authentication and authorization on the entry points the diff adds or changes, secrets in code, config, logs and errors, input crafted to attack the code, network and TLS settings, sensitive data at rest, and permissions, with Android cases such as exported components, intents, deep links, Keystore and WebView settings, and grade each finding fail or note by impact and reach. Use when checking whether a PR's changes open a security hole. Do NOT use when a person asks for a code review or for feedback on a diff, or to audit a whole codebase for vulnerabilities."
---

# Review: security

Check the code the diff adds or changes, and existing code it exposes to new input or callers,
for: auth, secrets, hostile input, network and TLS, data at rest, and permissions.

An issue is a finding only when you can name **who can reach it** (anyone on the internet, a
signed-in user, another app on the device, someone on the same network, someone holding the
device or a backup) and **what they gain** (others' data, acting as someone else, running code or
queries, a secret, taking the service down). Departing from hardening advice with nothing to gain
is not a finding. Android and Kotlin APIs below are examples: check the equivalent in the PR's
stack.

Before you start, list the entry points the diff adds or changes and who can reach each (routes,
handlers, webhooks, queue consumers, parsed files; on Android, exported components, intents,
deep links, `PendingIntent`s, `WebView` JS interfaces). Find the project's mechanisms for auth,
ownership checks, secrets and encrypted storage: code that goes around them is where to look
first. Code that only reaches debug builds (`src/debug/`, `debug-overrides`, `BuildConfig.DEBUG`)
is not a finding.

Out of this review: input that is merely empty or malformed by a bug (edge cases), timeouts and
retries, logging conventions, and where in the architecture a check lives.

## Authentication and authorization

- **Authenticated.** Each entry point serving non-public data or actions sits behind the
  project's auth, not on a public-path list. A JWT has signature, issuer, audience and expiry
  checked; decoded-only or `alg: none` authenticates nobody.
- **Allowed on this object.** `findById(id)` with no owner or tenant check lets any user reach
  any record. Roles or flags from the request (`isAdmin`) are untrusted; a body bound straight to
  a model lets callers set `role` or `ownerId`.
- **Enforced server-side**, before the data is touched. Hiding a button protects nothing.
- **Sessions.** Rotated at sign-in, invalidated server-side at sign-out; reset and invite tokens
  expire and work once.
- **Android.** Exported components that act or return data need a `signature` permission or a
  caller check, or are not exported. Implicit intents carrying sensitive data name a package. A
  `PendingIntent` with an implicit base intent and `FLAG_MUTABLE` can be redirected. Deep links
  that act for the user need in-app confirmation; links carrying tokens need a verified App Link.
  Biometrics without a `CryptoObject` are only a UI event.

## Secrets

Passwords, API keys, private and signing keys, keystores, OAuth client secrets, tokens,
connection strings with credentials.

- **In code and config:** key-shaped values (`AKIA…`, `sk_live_…`, `ghp_…`,
  `-----BEGIN PRIVATE KEY-----`), passwords in config files, committed `*.jks`, `*.p12`, `.env`,
  removed `.gitignore` lines. Fake test values are fine.
- **In the client:** everything compiled in (`BuildConfig`, resources, constants) can be
  extracted. Server keys, payment secret keys and admin tokens never belong there; public keys
  restricted by package and certificate are fine.
- **In logs, analytics, errors and URLs:** tokens, `Authorization` and `Cookie` headers, full
  bodies, personal data; an OkHttp `HttpLoggingInterceptor` at `BODY` or `HEADERS` outside debug;
  stack traces or SQL errors returned to the client; tokens in query strings.

## Hostile input

Follow each untrusted value to where it is used. Client-side validation protects nothing on a
server.

- **Queries** built by string concatenation (`rawQuery`, `execSQL`, a `ContentProvider` passing
  `selection` through). Use bound parameters.
- **Commands and deserialization:** input in `sh -c` or `shell=True`; `eval` or server-side
  templates; `ObjectInputStream` or `getSerializableExtra` in an exported component.
- **Paths:** `File(dir, name)` with `../`, archive entries extracted by name (Zip Slip).
- **URLs:** server fetches of input URLs (SSRF), redirects to input URLs, intent or deep-link URLs
  loaded into a `WebView`.
- **WebView:** JavaScript on content the app does not control, `addJavascriptInterface`, file
  access settings, `shouldOverrideUrlLoading` letting `intent://`, `file://` or `javascript:`
  through.
- **Limits:** XML external entities; sizes, counts or decompression with no upper bound.

## Network and TLS

- **No cleartext** to remote hosts: `usesCleartextTraffic="true"`, `cleartextTrafficPermitted`
  on `base-config` or a real host, iOS `NSAllowsArbitraryLoads`.
- **Certificates checked.** No trust-all trust manager, `HostnameVerifier` returning `true`,
  `onReceivedSslError` calling `proceed()`, `verify=False`, `rejectUnauthorized: false`.
  `<certificates src="user"/>` belongs in `debug-overrides`.
- **Pinning:** pins cover the right hosts, have a backup pin and are not expired.
- **Credentials go only to their host.** An interceptor adding the auth header to every request
  leaks it to CDNs and third parties.

## Sensitive data at rest

- **Who else can read it.** Shared storage, the clipboard and backups are open to others;
  app-private storage is not, except through backups. Exclude token and key files from backups
  (`dataExtractionRules`, `fullBackupContent`).
- **Encryption and keys.** Tokens, keys and sensitive personal data encrypted with a Keystore,
  Keychain or KMS key. Look for hard-coded keys, keys stored next to the data, `Random` instead of
  `SecureRandom`, ECB, reused GCM IVs, Base64 as "encryption".
- **Passwords on a server** hashed with bcrypt, scrypt, Argon2 or high-iteration PBKDF2.

## Permissions

- **Requested:** each new `<uses-permission>`, including those merged in by a library, has no
  narrower option (coarse location, photo picker, scoped storage, `<queries>`). OAuth scopes, IAM
  policies, database grants and CI `permissions` are no broader than needed.
- **Granted:** custom permissions guarding something sensitive use `signature`; `FileProvider`
  paths do not use `root-path` or `path="."`; no `debuggable="true"` or
  `setWebContentsDebuggingEnabled(true)` in release; no CORS echoing any origin with credentials,
  no public buckets.

## Grading

Grade by impact and reach.

| Situation | Grade |
|-----------|-------|
| Exploitable as shipped: read or change others' data, act as someone else, run code or queries, take a secret | `fail` |
| A new or exposed entry point with no authentication, or no check that the caller may act on the object | `fail` |
| A real secret committed or compiled into a client | `fail` |
| Certificate checks off, or cleartext allowed, for a host carrying credentials or personal data | `fail` |
| Credentials or personal data in a log, analytics event or error response | `fail` |
| Sensitive data where others can read it, unencrypted, or in backups | `fail` |
| Server passwords not hashed | `fail` |
| A permission, scope or grant broader than needed | `fail` |
| A pin removed, with no backup pin, or expired | `fail` |
| Untrusted input reaches a sink unvalidated, but every current caller validates first | `note` |
| Narrow-reach hardening missing, such as `FLAG_SECURE` on a screen with personal data | `note` |
| A security check with no test | `note` |

Grade one level lower (a `fail` becomes a `note`, a `note` is dropped) when exploiting needs the
victim's unlocked device, root on it, or the victim's help beyond opening a link. Another app on
the same device is ordinary reach.

## Findings

Say who can reach it and what they gain, at the line that opens it. For a secret already
committed or shipped, say it must be rotated: removing it leaves it in history and shipped
builds.

- `server/src/main/kotlin/orders/OrderRoutes.kt:48 - any signed-in user can read any order by changing the id: the handler does not check that the order belongs to the caller`
- `app/build.gradle.kts:40 - ships the payment provider's secret key in BuildConfig, where anyone can extract it; rotate the key and move the call to the server`
