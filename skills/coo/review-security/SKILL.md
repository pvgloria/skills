---
name: review-security
description: "How to review the security of a pull request: check authentication and authorization on the entry points the diff adds or changes, secrets in code, config, logs and error messages, validation of input crafted to attack the code, network and TLS settings, sensitive data at rest, and the permissions it requests and grants, with Android cases such as exported components, intents, network security config, Keystore and WebView settings, and grade each finding blocker, should-fix or nit by impact and reach. Use when checking whether a PR's changes open a security hole. Do NOT use when a person asks for a code review or for feedback on a diff, or to audit a whole codebase for vulnerabilities."
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

Before you start:

- **List the entry points** the diff adds or changes, and who can reach each: routes, RPC and
  GraphQL handlers, queue consumers, webhooks, CLI commands, parsed files; on Android, exported
  components, intents and deep links, `PendingIntent`s handed out, `WebView` JS interfaces,
  shared-storage files.
- **Find the project's mechanisms** for auth, ownership checks, secrets and encrypted storage.
  Code that goes around them is where to look first.
- **Note which builds each file reaches.** `src/debug/`, `debug-overrides` and
  `BuildConfig.DEBUG` branches never reach release; only debug is not a finding. Read `minSdk`
  and `targetSdk`: from API 28 cleartext is blocked by default; up to API 30 a component with an
  intent filter and no `android:exported` is exported.

Out of this review: input that is merely empty or malformed by a bug (edge cases), schema
upgrades, timeouts and retries, logging conventions, and where in the architecture
a check lives. Whether the check runs, server-side, before the data is touched, is in scope.

## Authentication and authorization

For each entry point serving non-public data or actions:

- **Authenticated.** Behind the project's auth middleware, guard or annotation, not added to a
  public-path list. A JWT must have signature, issuer, audience and expiry checked; decoded-only
  or `alg: none` authenticates nobody.
- **Allowed on this object.** `findById(id)` with no owner or tenant check lets any user reach
  any record. Roles or flags from the request (`isAdmin`) are untrusted. A request body bound
  straight to a model lets callers set `role` or `ownerId`.
- **Enforced where the data lives.** Hiding a button protects nothing.
- **Sessions.** Session rotated at sign-in, invalidated server-side at sign-out; reset and invite
  tokens expire and work once.

Android:

- **Exported components** that act or return data need a `signature` permission or a caller
  check; if nothing outside needs them, they are not exported.
- **Intents.** Implicit intents with sensitive data need a package or component. An exported
  activity that starts an `Intent` from an extra exposes non-exported components. A
  `PendingIntent` with an implicit base intent and `FLAG_MUTABLE` can be redirected.
- **Deep links** that act for the user (sign in, pay, change settings) need in-app confirmation.
  Links carrying tokens need a verified App Link (`autoVerify` + `assetlinks.json`); a custom
  scheme can be hijacked.
- **Biometrics** without a `CryptoObject` are only a UI event. Keys guarding secrets use
  `setUserAuthenticationRequired(true)` through the `CryptoObject`.

## Secrets

Passwords, API keys, private and signing keys, keystores and their passwords, OAuth client
secrets, tokens, connection strings with credentials, encryption keys.

- **In code and config:** key-shaped values (`AKIA…`, `sk_live_…`, `ghp_…`, `xoxb-…`,
  `-----BEGIN PRIVATE KEY-----`), passwords in `application.yml`, `.env`, `gradle.properties`,
  a literal `storePassword`, committed `*.jks`, `*.keystore`, `*.p12`, `.env`, removed
  `.gitignore` lines. Fake test values are fine.
- **In the client:** everything compiled in (`BuildConfig`, `strings.xml`, constants, native
  libs, obfuscated strings) can be extracted. Server keys, payment secret keys and admin tokens
  never belong there. Public keys restricted by package and certificate (Maps, Firebase config)
  are fine.
- **In logs and analytics:** passwords, tokens, `Authorization` and `Cookie` headers, full
  bodies, personal data in `Log`, `Timber`, `println`, crash-reporter keys and breadcrumbs, or an
  OkHttp `HttpLoggingInterceptor` at `BODY`/`HEADERS` outside debug.
- **In errors and URLs:** stack traces, SQL errors, paths or config returned to the client;
  tokens in exception messages or query strings.

## Hostile input

Follow each untrusted value to where it is used. Client-side validation protects nothing on a
server.

- **Queries:** SQL, NoSQL or search built by string concatenation (`rawQuery`, `execSQL`,
  `SimpleSQLiteQuery` from strings, a `ContentProvider` passing `selection` through). Use bound
  parameters.
- **Commands, code, deserialization:** input in `sh -c`, `shell=True`, `child_process.exec`, or
  as an argument that can start with `-`; `eval` or server-side templates; `ObjectInputStream`,
  `getSerializableExtra` in an exported component, Jackson default typing, unsafe YAML loaders.
- **Paths:** `File(dir, name)` with `../`, archive entries extracted by name (Zip Slip),
  providers serving a path from the URI. Resolve the canonical path and check it stays inside.
- **URLs:** server fetches of input URLs (SSRF, metadata endpoint), redirects to input URLs
  (open redirect), intent or deep-link URLs loaded into a `WebView`.
- **WebView and HTML:** JavaScript on content the app does not control; `addJavascriptInterface`
  (every loaded page can call it); `setAllowFileAccess`, `…FromFileURLs`, `…UniversalAccess…`;
  `shouldOverrideUrlLoading` letting `intent://`, `file://`, `javascript:` through; `innerHTML`,
  `dangerouslySetInnerHTML`, raw template output.
- **Parsers and limits:** XML with external entities; regexes built from input or with nested
  quantifiers; sizes or counts from input with no upper bound; decompression or image decoding
  with no output limit; request bodies with no size limit.

## Network and TLS

- **No cleartext** to remote hosts. Look for `usesCleartextTraffic="true"`,
  `cleartextTrafficPermitted="true"` on `base-config` or a real host's `domain-config`,
  `ConnectionSpec.CLEARTEXT`, iOS `NSAllowsArbitraryLoads`. Local dev exceptions go in debug.
- **Certificates checked.** A trust manager whose `checkServerTrusted` does nothing, a
  `HostnameVerifier` returning `true`, a trust-all `sslSocketFactory`,
  `onReceivedSslError` calling `proceed()`, `verify=False`, `rejectUnauthorized: false`,
  `InsecureSkipVerify: true`. `<certificates src="user"/>` in `base-config` belongs in
  `debug-overrides`.
- **Pinning changes:** pins cover the right hosts, have a backup pin, and the `expiration` is
  not past. Removing a pin leaves only system CAs.
- **Credentials go only to their host.** An interceptor adding the auth header to every request
  leaks it to CDNs, third parties and server-returned URLs.

## Sensitive data at rest

- **Who else can read it.** App-private storage is closed to other apps but copied by backups.
  Shared storage (`MediaStore`, Downloads, external storage) is open. The clipboard is open to
  the keyboard (every app before Android 10); from API 33 mark secrets with
  `ClipDescription.EXTRA_IS_SENSITIVE`. Server buckets or tables readable beyond need.
- **Encryption and keys.** Tokens, keys and sensitive personal data encrypted with a key from
  the Keystore, Keychain or a KMS. Look for hard-coded or constant-derived keys, keys stored next
  to the data, `Random`/`Math.random()` instead of `SecureRandom`, ECB
  (`Cipher.getInstance("AES")`), fixed or reused GCM IVs, Base64 or obfuscation as "encryption".
- **Passwords on a server** use bcrypt, scrypt, Argon2 or high-iteration PBKDF2; never
  encryption, MD5, SHA-1 or one round of SHA-256.
- **Backups.** `allowBackup` defaults to `true`. Exclude token and key files with
  `dataExtractionRules` (API 31+) and `fullBackupContent` (API 30-).
- **What stays behind.** Caches and temp files deleted when done and on sign-out. Screens with
  credentials, payment data or one-time codes set `FLAG_SECURE`.

## Permissions

**Requested by the code:**

- Each new `<uses-permission>`, including those merged in by a new library. A narrower option
  must not exist: coarse instead of fine location, photo picker instead of `READ_MEDIA_IMAGES`,
  scoped storage instead of `MANAGE_EXTERNAL_STORAGE`, `<queries>` instead of
  `QUERY_ALL_PACKAGES`. Background location, `SYSTEM_ALERT_WINDOW`, `REQUEST_INSTALL_PACKAGES`
  only when the feature cannot work without them. Old-API-only permissions carry
  `maxSdkVersion`.
- Elsewhere: OAuth scopes, IAM `"Action": "*"` or `"Resource": "*"`, database grants, root or
  `--privileged` containers, CI `permissions: write-all`, `pull_request_target` running PR code
  with secrets.

**Granted to others:**

- Custom permissions guarding something sensitive use `signature`.
- `FileProvider` paths with `root-path` or `path="."`; URI grants broader than the shared file.
- `debuggable="true"` in release; `setWebContentsDebuggingEnabled(true)` outside debug.
- World-readable or writable files, CORS echoing any origin with credentials, public buckets or
  databases.

## Severity

Grade by impact and reach.

| Situation | Severity |
|-----------|----------|
| Exploitable as shipped: read or change others' data, act as someone else, run code or queries, take a secret | `blocker` |
| A new or exposed entry point with no authentication, or no check that the caller may act on the object | `blocker` |
| A real secret committed or compiled into a client | `blocker` |
| Certificate checks off, or cleartext allowed, for a host carrying credentials or personal data, in release | `blocker` |
| Credentials in a log, crash report, analytics event or error response that leaves the device or server | `blocker` |
| Sensitive data where other apps or users can read it (shared storage, world-readable file, public bucket) | `blocker` |
| Server passwords in plain text or encrypted instead of hashed | `blocker` |
| Credentials only in the device or server's own logs; personal data in any log or analytics | `should-fix` |
| A stack trace, query or internal path shown to the client | `should-fix` |
| Sensitive data in app-only storage but unencrypted, weakly encrypted or in backups | `should-fix` |
| A permission, scope or grant broader than needed, with no exploit beyond the breadth | `should-fix` |
| A pin removed or disabled, with no backup pin, or expired | `should-fix` |
| Untrusted input reaches a sink unvalidated, but every current caller validates first | `nit` |
| Narrow-reach hardening missing: no `FLAG_SECURE` on a personal-data screen, a copied code not marked sensitive | `nit` |

Grade one level lower (a `nit` is dropped) when exploiting needs the victim's unlocked device,
root on it, or the victim's help beyond opening a link. Another app on the same device is
ordinary reach. A security check with no test is graded as a missing test.

## Findings

Say who can reach it and what they gain, at the line that opens it. For a secret already
committed or shipped, say it must be rotated: removing it leaves it in history and shipped
builds.

- `[blocker] server/src/main/kotlin/orders/OrderRoutes.kt:48 - any signed-in user can read any order by changing the id: the handler does not check that the order belongs to the caller`
- `[blocker] app/build.gradle.kts:40 - ships the payment provider's secret key in BuildConfig, where anyone can extract it; rotate the key and move the call to the server`
- `[should-fix] core/network/src/main/kotlin/network/NetworkModule.kt:27 - release builds write every request and response body, tokens included, to the device log`
