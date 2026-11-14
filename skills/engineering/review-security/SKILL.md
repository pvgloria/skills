---
name: review-security
description: "How to review the security of a pull request: check authentication and authorization on the entry points the diff adds or changes, secrets in code, config, logs and error messages, validation of input crafted to attack the code, network and TLS settings, sensitive data at rest, and the permissions it requests and grants, with Android cases such as exported components, intents, network security config, Keystore and WebView settings, and grade each finding blocker, should-fix or nit by impact and reach. Use when checking whether a PR's changes open a security hole. Do NOT use when a person asks for a code review or for feedback on a diff, or to audit a whole codebase for vulnerabilities."
---

# Review: security

This review answers six questions about the PR, and only these:

1. Does every entry point the diff adds or changes check who the caller is and what they may do?
2. Does every secret stay out of code, config, logs and error messages?
3. Is untrusted input validated before it reaches anything it could steer?
4. Does network traffic stay encrypted, with certificate checks intact?
5. Is sensitive data stored at rest only where it is protected?
6. Does the diff request only the permissions it needs, and grant others only the access they
   need?

An issue is a finding only when you can name two things: who can reach it, and what they gain.
Who can reach it is anyone on the internet, a signed-in user, another app on the same device,
someone on the same network, or someone holding the device or a backup of it. What they gain is
reading or changing data that is not theirs, acting as someone else, running code or queries,
taking a secret, or taking the service down. A setting that departs from common hardening advice,
with nothing anyone gains from it, is not a finding.

Each check applies to any stack. Where an example names an Android or Kotlin API, check the
equivalent in the stack the PR uses.

## 1. Set the baseline

Before looking for issues, settle what the diff exposes, to whom, and in which builds.

- **Entry points.** List every place the diff adds or changes where input arrives from outside
  the process: an HTTP route, an RPC or GraphQL handler, a queue consumer, a webhook, a CLI
  command, a file or upload the code parses. On Android, also an exported `Activity`, `Service`,
  `BroadcastReceiver` or `ContentProvider` and the intents and deep links it handles, a
  `PendingIntent` the app hands to another app, a JavaScript interface on a `WebView`, and a file
  read from shared storage. For each, note who can reach it: anyone, signed-in users, other apps
  on the device, or only the app itself.
- **Untrusted data.** Everything that arrives through those entry points is untrusted, and so is
  data from a server, a file or another app that the project does not control. Data the app
  wrote to its own private storage is trusted only while nothing else can write there.
- **Sensitive data.** Credentials, tokens, session cookies and keys, and personal data: names,
  contact details, location, health and payment data, and anything the project classes as
  sensitive. Note where the diff reads, writes, sends or logs any of it.
- **The project's security mechanisms.** Find how the project authenticates callers (a
  middleware, an interceptor, an annotation such as `@PreAuthorize`, a route guard), checks
  ownership, keeps secrets out of the repository (a secret manager, CI secrets, a
  `local.properties` that git ignores), and encrypts stored data (a Keystore-backed wrapper,
  Tink, an encrypted database). New code that goes through the mechanism is covered by it; new
  code that goes around it is where to look first. A change to the mechanism itself is checked
  like any other change.
- **Builds and API levels.** Note which builds each changed file reaches. A `src/debug/` source
  set, the `debug-overrides` element of a network security config and a branch on
  `BuildConfig.DEBUG` never reach a release build. On Android, read `minSdk` and `targetSdk`:
  several platform defaults depend on them. An app targeting API 28 or higher blocks cleartext
  traffic unless its config allows it, and an app targeting API 30 or lower exports every
  component that has an intent filter and no `android:exported`.

Review what the diff adds or changes, and the existing code it exposes to new input or new
callers: a newly exported component that passes an extra to an old function that builds a file
path is this diff's issue. A weakness in code the diff neither changes nor exposes is not a
finding.

## 2. Check authentication and authorization

For each entry point from section 1 that serves data or performs an action that is not public:

- **The caller is authenticated.** A new route sits behind the middleware, router group or
  annotation that enforces sign-in, and is not added to a list of public paths. Verifying a token
  means checking its signature, issuer, audience and expiry: a JWT that is only decoded, or that
  is accepted with `alg: none`, authenticates nobody.
- **The caller may act on this object.** The handler checks that the caller may read or change
  the record the request names: the order id, user id or file name in the path or body.
  `findById(id)` with no owner or tenant check lets any signed-in user read or change anyone's
  record. A role or flag taken from the request, such as an `isAdmin` field, is untrusted: read it
  from the verified session. A request body bound straight to a stored model lets the caller set
  fields such as `role` or `ownerId`.
- **The check runs where the data lives.** A check the client makes, such as hiding a button or
  a screen, protects nothing: the server, or the component that owns the data, must refuse the
  call.
- **Sessions.** In sign-in, sign-out and reset flows the diff changes, the session id or token is
  replaced at sign-in and invalidated on the server at sign-out, and a reset or invite token
  expires and works once.

On Android, also check:

- **Exported components.** A component with `android:exported="true"`, or with an intent filter
  in an app targeting API 30 or lower, can be started or bound by every app on the device. When
  it performs an action or returns data, it needs a permission with
  `android:protectionLevel="signature"`, or a check on the caller, such as
  `checkCallingPermission` or the calling package's signature. When nothing outside the app needs
  it, it is not exported.
- **Intents.** An implicit intent that carries sensitive data reaches any app that declares a
  matching filter: set the package or the component. An exported activity that starts an `Intent`
  taken from an extra (`startActivity(intent.getParcelableExtra("next"))`) lets any app reach the
  app's non-exported components. A `PendingIntent` handed to another app with an implicit base
  intent and `FLAG_MUTABLE` lets that app redirect it, with this app's identity.
- **Deep links.** A deep link that acts on the user's behalf (signs in, pays, changes a setting,
  accepts an invite) without the user confirming in the app can be fired by any web page or app.
  A link that carries a token, such as an OAuth redirect or a sign-in link, needs a verified App
  Link (`android:autoVerify="true"` and the domain's `assetlinks.json`); with a custom scheme,
  another app can register the same scheme and receive the token.
- **Biometrics.** A `BiometricPrompt` with no `CryptoObject` is only a UI event, which a tampered
  device can fake. When the prompt guards a secret, the key that unlocks it is created with
  `setUserAuthenticationRequired(true)` and used through the `CryptoObject`.

Which layer holds an authorization check, and how the code around it is structured, is not part
of this check. Whether the check runs, on the side that owns the data, before the data is read or
the action is taken, is.

## 3. Check secrets

A secret is a value that grants access: a password, an API key, a private or signing key, a
keystore and its passwords, an OAuth client secret, a token, a connection string with
credentials, an encryption key.

- **In code and config.** Look in every added line and file for literal secrets: values shaped
  like keys (`AKIA…`, `sk_live_…`, `ghp_…`, `xoxb-…`, `-----BEGIN PRIVATE KEY-----`), passwords
  in `application.yml`, `.env` or `gradle.properties`, a `signingConfigs` block with a literal
  `storePassword`, and committed `*.jks`, `*.keystore`, `*.p12` or `.env` files. Check the
  `.gitignore` lines the diff removes too. A fake value in a test fixture is not a secret; a value
  that works against a real service is.
- **In the client.** Anyone who installs an app or loads a web bundle can extract what is
  compiled into it: `BuildConfig` fields, `strings.xml`, constants, native libraries, obfuscated
  strings. A key that grants more than the public client should have, such as a server key, a
  payment provider's secret key or an admin token, does not belong in the client in any form. A
  key designed to be public and restricted by package name and signing certificate, such as a
  Maps key or the Firebase config, is not a finding.
- **In logs and analytics.** Check every log, crash-report and analytics call the diff adds for
  passwords, tokens, keys, `Authorization` and `Cookie` headers, full request or response bodies,
  and personal data. On Android that covers `Log`, `Timber` and `println`, custom keys and
  breadcrumbs sent to a crash reporter, and an OkHttp `HttpLoggingInterceptor` at `BODY` or
  `HEADERS` level that is not limited to debug builds. The device log ends up in bug reports;
  crash and analytics events leave the device for a third party.
- **In errors and URLs.** A stack trace, SQL error, file path or config value returned to the
  client or shown to the user; an exception message that embeds a token or personal data; a token
  or password in a URL's query string, which servers, proxies and browser history record.

Whether a log call follows the project's logging conventions is not part of this check. What it
writes, and where that ends up, is.

## 4. Check untrusted input

Here input is hostile: chosen by someone to make the code do what it should not. For each
untrusted value the diff reads, follow it to where it is used and check what it can steer. A
check made only on the client protects nothing on a server, because a caller can skip the client.

- **Queries.** SQL, NoSQL and search queries built by concatenating or templating input:
  `"... WHERE name = '$name'"`, `rawQuery` or `execSQL` with interpolation, a
  `SimpleSQLiteQuery` built from strings for a Room `@RawQuery`, a `ContentProvider` that passes
  the caller's `selection` straight to the database. Input goes in as bound parameters: `?` with
  `selectionArgs`, prepared statements, the query builder's parameters.
- **Commands, code and deserialization.** Input in a shell command (`sh -c` with an interpolated
  string, `subprocess` with `shell=True`, `child_process.exec`), or in an argument list where it
  can start with `-` and be read as an option; input passed to `eval` or rendered as a server-side
  template; untrusted bytes deserialized into types the data chooses, such as Java
  `ObjectInputStream`, `getSerializableExtra` in an exported component, Jackson with default
  typing, or a YAML loader that builds arbitrary objects.
- **Paths.** A file name from input joined to a directory: `File(dir, name)` with `name` set to
  `../shared_prefs/auth.xml`. Each archive entry extracted under its own name (Zip Slip). A
  `ContentProvider` or `FileProvider` that serves a path taken from the URI. The code resolves the
  canonical path and checks that it stays inside the intended directory.
- **URLs and redirects.** A URL from input that the server fetches can reach internal hosts and
  the cloud metadata endpoint (server-side request forgery). A redirect to a URL from input sends
  users, or an OAuth code, to the attacker (open redirect). On Android, a URL from an intent or a
  deep link loaded into a `WebView`.
- **WebView and HTML.** Check the `WebView` settings the diff changes against the content it
  loads: JavaScript enabled with content from a URL the app does not control;
  `addJavascriptInterface`, whose `@JavascriptInterface` methods every page loaded in it can
  call; `setAllowFileAccess(true)`, `setAllowFileAccessFromFileURLs(true)` or
  `setAllowUniversalAccessFromFileURLs(true)`; a `shouldOverrideUrlLoading` that lets
  `intent://`, `file://` or `javascript:` URLs through. On the web, input rendered as HTML without
  escaping: `innerHTML`, `dangerouslySetInnerHTML`, a template's raw-output tag.
- **Parsers and limits.** An XML parser with DTDs or external entities enabled; a regular
  expression built from input, or one with nested quantifiers run against input; a length or
  count from input that sizes a buffer, a page or a loop with no upper bound; an archive or image
  decoded with no limit on its output size; a request body with no size limit.

Input that is empty, null, out of range or malformed by a bug is not part of this check; input
chosen to make the code do what it should not is. When one missing check fails both ways, report
what an attacker gains.

## 5. Check network and TLS

For each connection the diff opens or configures:

- **No cleartext.** URLs for remote hosts use `https://` and `wss://`. On Android, look for
  `android:usesCleartextTraffic="true"` in the manifest, `cleartextTrafficPermitted="true"` in
  the network security config (`res/xml/network_security_config.xml`) on the `base-config` or on a
  `domain-config` for a host the app sends data to, and OkHttp's `ConnectionSpec.CLEARTEXT`. On
  iOS, `NSAllowsArbitraryLoads` in App Transport Security does the same. A cleartext exception for
  a local development host belongs in a debug source set or in `debug-overrides`.
- **Certificates are checked.** Code that replaces the platform's verification usually turns it
  off: an `X509TrustManager` whose `checkServerTrusted` returns without throwing, a
  `HostnameVerifier` that returns `true`, an OkHttp client built with a trust-all
  `sslSocketFactory`, a `WebViewClient.onReceivedSslError` that calls `handler.proceed()`. In
  other stacks: `verify=False` in Python `requests`, `rejectUnauthorized: false` in Node,
  `InsecureSkipVerify: true` in Go. A network security config whose `base-config` trusts
  `<certificates src="user"/>` lets anyone who installs a CA on the device read the app's
  traffic; that belongs in `debug-overrides`.
- **Pinning changes.** When the diff adds, changes or removes certificate pins (a `<pin-set>` in
  the network security config, OkHttp's `CertificatePinner`, a custom trust manager), check that
  the pins cover the hosts they should, that a backup pin exists for the next key rotation, and
  that the pin set's `expiration` is not in the past: after it, the pins are not enforced. A pin
  that is removed or disabled leaves its host with only the system's CAs.
- **Credentials go only to their host.** An interceptor that adds the auth header to every
  request sends the token to every host the client calls: third-party APIs, image CDNs, URLs the
  server returns. Check that it is limited to the API's host.

How the client handles a timeout, a retry or a failed response is not part of this check.
Whether someone on the network can read or change the traffic, or receive the credentials, is.

## 6. Check sensitive data at rest

For each place the diff writes sensitive data (files, preferences, databases, caches, the
clipboard, server tables and buckets):

- **Who else can read it.** On Android, app-private storage (`filesDir`, `SharedPreferences`,
  DataStore, the app's databases) is closed to other apps, but backups copy it and a rooted device
  can read it. Shared storage (`MediaStore`, Downloads, `Environment.getExternalStorageDirectory`)
  is open to other apps. The clipboard is open to the keyboard and the app in focus, and to every
  app before Android 10; from API 33, the app marks a copied password or code with
  `ClipDescription.EXTRA_IS_SENSITIVE` to keep it out of the clipboard preview. On a server, a
  bucket or share with public access, or a table readable by roles that do not need it.
- **Encryption and keys.** Tokens, keys and the personal data the project classes as sensitive
  are encrypted with a key held in the platform's key store: the Android Keystore, the iOS
  Keychain, a KMS on a server, usually through the project's own wrapper. Look for a key written
  in the source or derived from a constant, a key stored next to the data it protects,
  `java.util.Random` or `Math.random()` used for keys, tokens or IVs instead of `SecureRandom`,
  ECB mode (`Cipher.getInstance("AES")` defaults to it), a fixed or reused IV with AES-GCM, and
  Base64 or obfuscation used as if it were encryption.
- **Stored passwords.** A server stores passwords with a slow password hash (bcrypt, scrypt,
  Argon2, or PBKDF2 with a high iteration count): not encrypted, and not hashed with MD5, SHA-1 or
  a single round of SHA-256.
- **Backups.** On Android, `android:allowBackup` is `true` unless the manifest sets it, so
  app-private files go to the user's cloud backup and to device-to-device transfer. Files holding
  tokens or keys are excluded with `android:dataExtractionRules` (API 31 and up) and
  `android:fullBackupContent` (API 30 and down).
- **What stays behind.** Sensitive data the diff caches or writes to a temporary file is deleted
  when it is no longer needed, and on sign-out or account deletion. A screen that shows
  credentials, payment data or one-time codes sets `FLAG_SECURE`; without it, the system keeps
  the screen in screenshots and the recent-apps thumbnail.

The schema of stored data, and how it is upgraded from one app or database version to the next,
is not part of this check. Where sensitive data ends up after the change, and whether it is
protected there, is.

## 7. Check permissions

**Requested.** For each permission, scope or role the diff gives the code itself:

- On Android, each `<uses-permission>` the diff adds, including those a new library merges into
  the manifest: when the diff adds a dependency, check the library's manifest. The permission is
  needed for what the step delivers, and no narrower one does the job: `ACCESS_COARSE_LOCATION`
  instead of fine location, the photo picker instead of `READ_MEDIA_IMAGES`, scoped storage
  instead of `MANAGE_EXTERNAL_STORAGE`, a `<queries>` element instead of `QUERY_ALL_PACKAGES`.
  Background location, `SYSTEM_ALERT_WINDOW` and `REQUEST_INSTALL_PACKAGES` need a feature that
  cannot work without them. A permission needed only on old API levels carries
  `android:maxSdkVersion`.
- In other stacks: the OAuth scopes the app requests, IAM policies with `"Action": "*"` or
  `"Resource": "*"`, database grants, a container that runs as root or with `--privileged`, a CI
  workflow with `permissions: write-all`, and a `pull_request_target` workflow that checks out
  and runs the PR's code with the repository's secrets.

**Granted.** For each access the diff gives to others:

- A custom permission that guards something sensitive uses `android:protectionLevel="signature"`;
  with `normal` or `dangerous`, any app that asks for it can get it.
- A `FileProvider` paths file that shares `root-path`, or `path="."` of a whole directory, and
  `FLAG_GRANT_READ_URI_PERMISSION` or `grantUriPermissions` on URIs broader than the file being
  shared.
- `android:debuggable="true"` in a release build, or `WebView.setWebContentsDebuggingEnabled(true)`
  outside debug builds, gives anyone with USB access the app's private data or the web view's
  content.
- Files created world-readable or world-writable (`MODE_WORLD_READABLE`, `chmod 777`), a CORS
  policy that echoes any request's origin while allowing credentials, and a storage bucket or
  database opened to the public.

Exported components are checked in section 2. How the app asks for a runtime permission, and what
it does when the user refuses, is not part of this check. Whether the permission is needed, and
how broad it is, is.

## 8. Grade each finding

Grade by impact and by reach: what someone gains, and how easily they get there. An issue in code
the PR introduces that someone can exploit as the code ships is the clearest `blocker`.

| Situation | Severity |
|-----------|----------|
| Someone can exploit code the PR introduces, as it ships, to read or change data that is not theirs, act as someone else, run code or queries, or take a secret | `blocker` |
| An entry point the diff adds or exposes serves non-public data or actions with no authentication, or with no check that the caller may act on the object | `blocker` |
| A real secret is committed to the repository or compiled into a client | `blocker` |
| Certificate or hostname checks are off, or cleartext is allowed, for a host that carries credentials or personal data, in a release build | `blocker` |
| Credentials reach a log, crash report, analytics event or error response that leaves the device or the server | `blocker` |
| Sensitive data is written where other apps or other users can read it: shared storage, a world-readable file, a public bucket | `blocker` |
| A server stores passwords in plain text or encrypted, rather than under a password hash | `blocker` |
| Credentials reach only the device log or the server's own logs, or personal data reaches any log, crash report or analytics event | `should-fix` |
| An error shows the client a stack trace, a query or an internal path | `should-fix` |
| Sensitive data sits in storage only the app can read, but unencrypted, under a weak key or algorithm, or included in backups | `should-fix` |
| A permission, scope or grant is broader than the feature needs, with no exploit you can name beyond that breadth | `should-fix` |
| A certificate pin is removed or disabled, or a pin set has no backup pin or an expiration in the past | `should-fix` |
| Untrusted input could reach a sink unvalidated, but every current caller validates it first, such as a raw query whose only caller passes a parsed number | `nit` |
| Hardening is missing where the reach is narrow and the gain small: no `FLAG_SECURE` on a screen with personal data, a copied one-time code not marked sensitive | `nit` |

When exploiting the issue needs the victim's unlocked device in hand, root on the victim's device,
or the victim's help beyond opening a link, such as approving a prompt or pasting what the
attacker sends, grade one level lower: a `blocker` becomes `should-fix`, a `should-fix` becomes
`nit`, a `nit` is dropped. Another app installed on the same device is ordinary reach, not help
from the victim.

A setting or code path that only a debug build reaches is not a finding, unless the diff lets it
reach a release build. A security check the code has, but no test asserts, is graded as a missing
test, not by this table.

## 9. Write the findings

Each finding names, in a few words, who can reach the issue and what they gain. Point the
location at the line that opens it: the route or component declaration, the query, the log call,
the trust manager, the manifest attribute, the `uses-permission`. For a secret that is already
committed or shipped, say that it must be rotated: removing it from the branch leaves it in the
git history and in every build that shipped it.

From check to finding:

- `ShareActivity` is exported, loads `intent.getStringExtra("url")` into a `WebView` with
  JavaScript enabled, and adds a `@JavascriptInterface` method that returns the session token.
  → `[blocker] app/src/main/java/share/ShareActivity.kt:31 - any app on the device can load its own page in ShareActivity and read the session token through the JavaScript interface`
- `GET /orders/{id}` calls `orderRepository.findById(id)` and returns the order.
  → `[blocker] server/src/main/kotlin/orders/OrderRoutes.kt:48 - any signed-in user can read any order by changing the id: the handler does not check that the order belongs to the caller`
- `app/build.gradle.kts` adds a `buildConfigField` holding the payment provider's `sk_live_…`
  key.
  → `[blocker] app/build.gradle.kts:40 - ships the payment provider's secret key in BuildConfig, where anyone who installs the app can extract it; rotate the key and move the call that needs it to the server`
- `src/main/res/xml/network_security_config.xml` sets
  `<base-config cleartextTrafficPermitted="true">`.
  → `[blocker] app/src/main/res/xml/network_security_config.xml:3 - allows cleartext to every host in release builds, so someone on the same Wi-Fi can read and change API calls, auth header included`
- An upload handler runs `subprocess.run(f"convert {upload.filename} thumb.png", shell=True)`.
  → `[blocker] api/uploads/thumbnails.py:22 - the uploaded file's name goes into a shell command, so a name containing ; runs any command on the server`
- The OkHttp client adds `HttpLoggingInterceptor` at `Level.BODY` with no build-type check.
  → `[should-fix] core/network/src/main/kotlin/network/NetworkModule.kt:27 - release builds write every request and response body, passwords and tokens included, to the device log`
- `TokenStore` writes the refresh token with `getSharedPreferences("auth", MODE_PRIVATE)`, while
  the access token goes through the project's Keystore-backed `SecureStorage`.
  → `[should-fix] app/src/main/java/auth/TokenStore.kt:19 - stores the refresh token in plain SharedPreferences, which backups copy, instead of the Keystore-encrypted SecureStorage the access token uses`
- The manifest adds `ACCESS_FINE_LOCATION` for a weather card that shows the user's city.
  → `[should-fix] app/src/main/AndroidManifest.xml:9 - requests fine location where the city-level weather card needs only ACCESS_COARSE_LOCATION`
