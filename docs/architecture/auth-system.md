# Auth System — Complete Reference

> Assumes zero prior knowledge of this project. Read top to bottom.

---

## Overview

Auth is split across three layers:

| Layer | What it does | Where it lives |
|---|---|---|
| **Firebase Web SDK** (client) | Authenticates user, holds ID token, auto-refreshes it | `src/features/auth/lib/` |
| **Server Actions** (bridge) | Exchanges Firebase ID token for an `__session` HTTP-only cookie | `src/features/auth/actions/session.ts` |
| **Firebase Admin SDK** (server) | Verifies session cookie on every request, owns the `__session` cookie | `src/server/adapters/firebase/auth/` |

**Key invariant:** the browser never holds a Firebase ID token for auth purposes — only the short-lived token used to mint the `__session` cookie. All real session state lives in the `__session` HTTP-only cookie, invisible to JavaScript.

---

## Architecture — High-Level Flow

```mermaid
flowchart TD
    Browser["Browser\n(React client)"]
    FirebaseSDK["Firebase Web SDK\n(client-side)"]
    ServerAction["Server Action\nloginWithIdToken()"]
    FirebaseAdmin["Firebase Admin SDK\n(server-side)"]
    Cookie["__session cookie\nHttpOnly · Secure · 5 days"]
    ServerComponent["Server Component\ngetSession()"]
    Firestore["Firestore"]
    AuditLog["Audit Log"]

    Browser -->|"1. email/password or Google popup"| FirebaseSDK
    FirebaseSDK -->|"2. ID token (short-lived JWT)"| ServerAction
    ServerAction -->|"3. verifyIdToken + createSessionCookie"| FirebaseAdmin
    FirebaseAdmin -->|"4. Set-Cookie __session"| Cookie
    Cookie -->|"5. Sent on every request (browser automatic)"| ServerComponent
    ServerComponent -->|"6. verifySessionCookie → AuthenticatedUser"| FirebaseAdmin
    ServerComponent -->|"7. Authenticated queries"| Firestore
    ServerAction -->|"side-effect"| AuditLog
```

---

## Sign-In — Sequence Diagrams

### Email & Password Login

```mermaid
sequenceDiagram
    actor User
    participant SignInForm
    participant useAuthSession
    participant FirebaseSDK as Firebase Web SDK
    participant loginAction as Server Action<br/>loginWithIdToken()
    participant FirebaseAdmin as Firebase Admin SDK
    participant Cookie as __session cookie

    User->>SignInForm: submits email + password
    SignInForm->>useAuthSession: signInWithEmail(email, password)
    useAuthSession->>FirebaseSDK: signInWithEmailAndPassword()
    FirebaseSDK-->>useAuthSession: UserCredential + ID token
    useAuthSession->>loginAction: pushIdTokenToServer(idToken)
    loginAction->>FirebaseAdmin: verifyIdToken(idToken)
    FirebaseAdmin-->>loginAction: decoded claims (uid, email, roles)
    loginAction->>FirebaseAdmin: createSessionCookie(idToken, {expiresIn: 5d})
    FirebaseAdmin-->>loginAction: session cookie string
    loginAction->>Cookie: Set-Cookie __session (HttpOnly, Secure, SameSite=lax)
    loginAction-->>useAuthSession: ActionResult { ok: true }
    loginAction->>AuditLog: auth.login (actorId: uid)
    useAuthSession-->>SignInForm: success
    SignInForm->>Browser: router.refresh() → redirect to next param or /
```

### Google OAuth Login

```mermaid
sequenceDiagram
    actor User
    participant SignInForm
    participant useAuthSession
    participant FirebaseSDK as Firebase Web SDK
    participant Google as Google OAuth
    participant loginAction as Server Action<br/>loginWithIdToken()
    participant FirebaseAdmin as Firebase Admin SDK
    participant Cookie as __session cookie

    User->>SignInForm: clicks "Sign in with Google"
    SignInForm->>useAuthSession: signInWithGoogle()
    useAuthSession->>FirebaseSDK: signInWithPopup(GoogleAuthProvider)
    FirebaseSDK->>Google: OAuth popup
    Google-->>FirebaseSDK: OAuth credential
    FirebaseSDK-->>useAuthSession: UserCredential + ID token
    useAuthSession->>loginAction: pushIdTokenToServer(idToken)
    loginAction->>FirebaseAdmin: verifyIdToken + createSessionCookie
    FirebaseAdmin-->>loginAction: session cookie string
    loginAction->>Cookie: Set-Cookie __session
    loginAction->>AuditLog: auth.login (actorId: uid)
    loginAction-->>useAuthSession: ActionResult { ok: true }
    useAuthSession-->>SignInForm: success
    SignInForm->>Browser: router.refresh() → redirect
```

---

## Sign-Up (Registration)

```mermaid
sequenceDiagram
    actor User
    participant SignUpForm
    participant useAuthSession
    participant FirebaseSDK as Firebase Web SDK
    participant signUpAction as Server Action<br/>signUpWithIdToken()
    participant FirebaseAdmin as Firebase Admin SDK
    participant Cookie as __session cookie
    participant EmailService as Firebase Email

    User->>SignUpForm: fills email, password, confirms, accepts terms
    SignUpForm->>useAuthSession: signUpWithEmail(email, password)
    useAuthSession->>FirebaseSDK: createUserWithEmailAndPassword()
    FirebaseSDK-->>useAuthSession: UserCredential + ID token
    useAuthSession->>signUpAction: pushSignUpIdTokenToServer(idToken)
    signUpAction->>FirebaseAdmin: verifyIdToken + createSessionCookie
    FirebaseAdmin-->>signUpAction: session cookie string
    signUpAction->>Cookie: Set-Cookie __session
    signUpAction->>AuditLog: auth.signup (actorId: uid)
    signUpAction-->>useAuthSession: ActionResult { ok: true }
    useAuthSession->>FirebaseSDK: sendEmailVerification(user) [best-effort, never blocks]
    FirebaseSDK->>EmailService: sends verification email
    useAuthSession-->>SignUpForm: success
    SignUpForm->>Browser: router.refresh() → redirect
```

> **Note:** `sendEmailVerification` failures are silently swallowed — signup always succeeds even if the verification email fails.

---

## Logout

```mermaid
sequenceDiagram
    actor User
    participant AuthBadge
    participant useAuthSession
    participant signOutAction as Server Action<br/>signOut()
    participant FirebaseAdmin as Firebase Admin SDK
    participant Cookie as __session cookie
    participant FirebaseSDK as Firebase Web SDK

    User->>AuthBadge: clicks "Sign out"
    AuthBadge->>useAuthSession: signOut()
    Note over useAuthSession: Server-first order — ensures<br/>server is cleaned up even if<br/>client step fails
    useAuthSession->>signOutAction: signOutAction()
    signOutAction->>FirebaseAdmin: getSession() → decode uid
    signOutAction->>FirebaseAdmin: revokeRefreshTokens(uid)
    Note over FirebaseAdmin: All active sessions on ALL devices invalidated
    signOutAction->>Cookie: delete __session cookie
    signOutAction->>AuditLog: auth.logout (actorId: uid)
    signOutAction-->>useAuthSession: ActionResult { ok: true }
    useAuthSession->>FirebaseSDK: signOut(auth) [client-side]
    useAuthSession->>useAuthSession: setServerSession(UNKNOWN)
    useAuthSession-->>AuthBadge: done
    AuthBadge->>Browser: router.refresh()
```

---

## Session Persistence & Token Refresh

```mermaid
sequenceDiagram
    participant FirebaseSDK as Firebase Web SDK
    participant useAuthSession
    participant loginAction as Server Action<br/>loginWithIdToken()
    participant FirebaseAdmin as Firebase Admin SDK
    participant Cookie as __session cookie

    Note over FirebaseSDK: Firebase silently refreshes<br/>ID tokens every ~1 hour
    FirebaseSDK->>useAuthSession: onIdTokenChanged(newUser)
    alt user still signed in
        useAuthSession->>FirebaseSDK: user.getIdToken()
        FirebaseSDK-->>useAuthSession: fresh ID token
        useAuthSession->>loginAction: loginWithIdToken(freshToken)
        loginAction->>FirebaseAdmin: verifyIdToken + createSessionCookie
        FirebaseAdmin-->>loginAction: new session cookie
        loginAction->>Cookie: Set-Cookie __session (refreshed, new 5-day TTL)
        loginAction-->>useAuthSession: { ok: true }
    else user signed out
        useAuthSession->>useAuthSession: setStatus("anonymous")
    end
```

```mermaid
sequenceDiagram
    participant Browser
    participant ServerComponent as Server Component<br/>(any protected page)
    participant getSession as getSession() [React cache]
    participant FirebaseAdmin as Firebase Admin SDK

    Browser->>ServerComponent: GET /protected-page (cookie: __session=...)
    ServerComponent->>getSession: getSession()
    Note over getSession: React cache() deduplicates<br/>within the same request
    getSession->>FirebaseAdmin: verifySessionCookie(cookie, checkRevoked=true)
    alt valid session
        FirebaseAdmin-->>getSession: AuthenticatedUser { uid, email, emailVerified, roles }
        getSession-->>ServerComponent: AuthenticatedUser
        ServerComponent->>ServerComponent: render protected content
    else expired / revoked / invalid
        FirebaseAdmin-->>getSession: throws error
        getSession->>getSession: throws AuthError(kind: session-expired | session-revoked | invalid-session)
        ServerComponent->>Browser: redirect("/ingresar?next=...")
    end
```

---

## Password Recovery

```mermaid
sequenceDiagram
    actor User
    participant ResetPasswordForm
    participant useAuthSession
    participant FirebaseSDK as Firebase Web SDK
    participant EmailService as Firebase Email

    User->>ResetPasswordForm: enters email, submits
    ResetPasswordForm->>useAuthSession: sendPasswordReset(email)
    useAuthSession->>FirebaseSDK: sendPasswordResetEmail(auth, email)
    alt valid registered email
        FirebaseSDK->>EmailService: sends reset link (Firebase-hosted template)
        EmailService-->>User: email with reset link
        FirebaseSDK-->>useAuthSession: void (success)
    else invalid email format
        FirebaseSDK-->>useAuthSession: throws auth/invalid-email
        useAuthSession-->>ResetPasswordForm: validation error shown
    else email not found
        FirebaseSDK-->>useAuthSession: silently succeeds (no enumeration)
    end
    Note over ResetPasswordForm: Always shows same success<br/>message regardless of result<br/>(prevents account enumeration)
    ResetPasswordForm-->>User: "Check your inbox"
```

---

## Route Protection

```mermaid
flowchart TD
    Request["Incoming Request"]
    ProxyTS["proxy.ts\n(Next 16 — locale routing only,\nno auth checks here)"]
    ServerComponent["Server Component\npage.tsx"]
    GetSession["getSession()\nverifySessionCookie()"]

    Authenticated{"Session\nvalid?"}
    Protected{"Protected\nroute?"}

    Redirect["redirect('/ingresar?next=...')"]
    RenderPage["Render protected page"]
    RenderPublic["Render public page"]

    Request --> ProxyTS
    ProxyTS -->|"adds x-locale header"| ServerComponent
    ServerComponent --> Protected
    Protected -->|"Yes: /publicar, /mi-cuenta, etc."| GetSession
    Protected -->|"No: /, /ingresar, /registrarse, etc."| RenderPublic
    GetSession --> Authenticated
    Authenticated -->|"Yes"| RenderPage
    Authenticated -->|"No / expired / revoked"| Redirect
```

### Currently protected routes

| Route | How protected |
|---|---|
| `/[lang]/publicar` | `getSession().catch(() => null)` → redirect if null |
| `/[lang]/mi-cuenta` | `getSession().catch(() => null)` → redirect if null |
| Any Server Action | `requireAuth()` throws `AuthError("no-session")` if no cookie |

> `proxy.ts` handles **locale routing only** — it does not block unauthenticated requests. Auth checks happen at the Server Component level.

---

## Email Verification

```mermaid
flowchart TD
    SignUp["User signs up"]
    SendVerif["sendEmailVerification(user)\nbest-effort — never blocks signup"]
    UserInbox["User receives verification email\n(Firebase-hosted link)"]
    ClickLink["User clicks link"]
    FirebaseVerif["Firebase marks emailVerified = true"]
    TokenRefresh["Next onIdTokenChanged fires\n→ pushIdTokenToServer()\n→ session cookie refreshed"]
    VerifPage["/verificacion page\nreads emailVerified from session"]

    SignUp --> SendVerif
    SendVerif -.->|"may fail silently"| UserInbox
    UserInbox --> ClickLink
    ClickLink --> FirebaseVerif
    FirebaseVerif --> TokenRefresh
    TokenRefresh --> VerifPage
    VerifPage -->|"emailVerified = true"| ApprovedState["shows 'verified' state"]
    VerifPage -->|"emailVerified = false"| PendingState["shows 'pending' state\nCTA: /verificacion/enviar"]
```

---

## Role System

```mermaid
sequenceDiagram
    participant ServerAction as Server Action<br/>(e.g. createListingDraft)
    participant RequireAuth as requireAuth()
    participant getSession as getSession()
    participant FirebaseAdmin as Firebase Admin SDK
    participant GrantRole as grantRoleRaw(uid, role)

    ServerAction->>RequireAuth: requireAuth()
    RequireAuth->>getSession: getSession()
    getSession->>FirebaseAdmin: verifySessionCookie → custom claims
    FirebaseAdmin-->>getSession: { uid, roles: ["model"] }
    getSession-->>RequireAuth: AuthenticatedUser
    RequireAuth-->>ServerAction: AuthenticatedUser (or throws)

    Note over ServerAction: After first publish action succeeds:
    ServerAction->>GrantRole: grantRole(uid, "model")
    GrantRole->>FirebaseAdmin: setCustomUserClaims(uid, {roles: [...existing, "model"]})
    Note over FirebaseAdmin: Role additive — never overwrites<br/>Takes effect on next token refresh (~1h)
    FirebaseAdmin->>AuditLog: auth.role_granted
```

---

## File Map

```
src/
├── features/auth/
│   ├── actions/
│   │   └── session.ts              ← Server Actions: loginWithIdToken, signUpWithIdToken, signOut
│   ├── components/
│   │   ├── SignInForm.tsx           ← Email/password + Google sign-in UI
│   │   ├── SignUpForm.tsx           ← Registration UI with password strength meter
│   │   ├── ResetPasswordForm.tsx   ← Password recovery UI
│   │   └── AuthBadge.tsx           ← Header badge: sign-in / avatar + sign-out
│   └── lib/
│       ├── use-auth-session.ts     ← Main auth hook (status, user, all auth methods)
│       └── firebase-client.ts     ← Firebase Web SDK singleton (lazy init)
│
├── server/adapters/firebase/auth/
│   ├── index.ts                    ← Barrel export (getSession, createSession, destroySession, grantRoleRaw)
│   ├── manage-session.ts           ← createSession() + destroySession() — owns __session cookie
│   ├── verify-session.ts           ← getSession() — verifies cookie on every request (React cache'd)
│   └── grant-role.ts              ← grantRoleRaw() — sets Firebase custom claims
│
├── server/security/
│   └── require-auth.ts             ← requireAuth() — throws AuthError if no valid session
│
├── core/config/
│   ├── firebase.ts                 ← Server env vars (FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY…)
│   └── firebase-client.ts         ← Public env vars (NEXT_PUBLIC_FIREBASE_API_KEY…)
│
└── server/mocks/auth/
    └── index.ts                    ← Mock adapter when Firebase not configured (local dev)

src/app/[lang]/
├── ingresar/page.tsx               ← /login route
├── registrarse/page.tsx            ← /register route
├── recuperar/page.tsx              ← /password-reset route
├── verificacion/page.tsx           ← /email-verification status route
├── publicar/page.tsx               ← Protected: redirect if not authenticated
└── mi-cuenta/page.tsx              ← Protected: redirect if not authenticated

proxy.ts                            ← Next 16 proxy (locale routing only — no auth)
```

---

## Cookie Spec

| Property | Value |
|---|---|
| Name | `__session` |
| HttpOnly | `true` |
| Secure | `true` (production), `false` (dev) |
| SameSite | `lax` |
| Path | `/` |
| Max-Age | 5 days (432 000 s) |
| Set by | `src/server/adapters/firebase/auth/manage-session.ts` |
| Read by | `src/server/adapters/firebase/auth/verify-session.ts` |
| Deleted by | `destroySession()` + `revokeRefreshTokens(uid)` on logout |

---

## Sign-In Methods

| Method | Status |
|---|---|
| Email + Password | Enabled |
| Google OAuth (popup) | Enabled |
| Apple, Facebook, etc. | Not configured |

---

## Security Properties

- **No ID token in browser storage** — Firebase SDK holds it in memory; the browser only persists the `__session` cookie.
- **Cookie is HttpOnly** — XSS cannot read it.
- **Revocation on logout** — `revokeRefreshTokens(uid)` invalidates all sessions on all devices immediately.
- **`checkRevoked: true`** on `verifySessionCookie` — detects revoked tokens on every request (1 network call to Firebase, cached per request via React `cache()`).
- **No account enumeration** — password reset always shows the same success message.
- **Audit log** on every auth event (`auth.login`, `auth.signup`, `auth.logout`, `auth.role_granted`).
- **Mock adapter** — when `FIREBASE_*` env vars are absent, all auth functions return safe no-ops (local dev without Firebase).
