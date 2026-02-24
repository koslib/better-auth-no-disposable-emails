# better-auth-no-disposable-emails

A [better-auth](https://www.better-auth.com/) plugin that blocks disposable (temporary) email addresses from signing up to your app, powered by the [mailchecker](https://github.com/FGRibreau/mailchecker) package.

## Installation

```bash
npm install better-auth-no-disposable-emails
```

## Usage

Add the plugin to your `better-auth` configuration:

```typescript
import { betterAuth } from "better-auth";
import { noDisposableEmails } from "better-auth-no-disposable-emails";

export const auth = betterAuth({
  // ... your other config
  plugins: [
    noDisposableEmails(),
  ],
});
```

### With options

```typescript
import { betterAuth } from "better-auth";
import { noDisposableEmails } from "better-auth-no-disposable-emails";

export const auth = betterAuth({
  plugins: [
    noDisposableEmails({
      // Optional: custom error message returned to the client
      errorMessage: "We do not accept temporary email addresses.",

      // Optional: add extra domains to block beyond mailchecker's defaults
      customBlockedDomains: ["acmespam.com", "throwaway-mail.io"],
    }),
  ],
});
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `errorMessage` | `string` | `"Disposable email addresses are not allowed."` | The error message returned to the client when a disposable email is detected. |
| `customBlockedDomains` | `string[]` | `[]` | Additional email domains to block, on top of the [mailchecker defaults](https://github.com/FGRibreau/mailchecker). |

## How it works

The plugin registers a `before` hook that intercepts the following endpoints:

- `POST /sign-up/email`
- `POST /sign-in/email`
- `POST /sign-in/magic-link`
- `POST /email-otp/send-verification-otp`

When an email is provided, it is checked using `MailChecker.isValid()`. If the email belongs to a known disposable email provider, a `400 BAD_REQUEST` error is returned with the error code `DISPOSABLE_EMAIL_NOT_ALLOWED`.

## Usage with Next.js

```typescript
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";
import { noDisposableEmails } from "better-auth-no-disposable-emails";

export const auth = betterAuth({
  database: /* your database adapter */,
  emailAndPassword: { enabled: true },
  plugins: [
    noDisposableEmails({
      errorMessage: "Please use a permanent email address to sign up.",
    }),
  ],
});
```

## License

ISC
