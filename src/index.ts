import MailChecker from "mailchecker";
import type { BetterAuthPlugin } from "better-auth";
import { createAuthMiddleware, APIError } from "better-auth/api";

export interface NoDisposableEmailsOptions {
  /**
   * Custom error message to return when a disposable email is detected.
   * @default "Disposable email addresses are not allowed."
   */
  errorMessage?: string;
  /**
   * Additional domains to block beyond the mailchecker defaults.
   */
  customBlockedDomains?: string[];
  /**
   * Auth paths to intercept and check for disposable emails.
   * @default ["/sign-up/email"]
   */
  paths?: string[];
}

export const noDisposableEmails = (
  options?: NoDisposableEmailsOptions
): BetterAuthPlugin => {
  const errorMessage =
    options?.errorMessage ?? "Disposable email addresses are not allowed.";

  const customBlockedSet = new Set(
    (options?.customBlockedDomains ?? []).map((d) => d.toLowerCase())
  );

  const hookedPaths = new Set(options?.paths ?? ["/sign-up/email"]);

  function isEmailAllowed(email: string): boolean {
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return false;
    if (customBlockedSet.has(domain)) return false;
    return MailChecker.isValid(email);
  }

  return {
    id: "noDisposableEmails",
    hooks: {
      before: [
        {
          matcher(ctx) {
            return ctx.path ? hookedPaths.has(ctx.path) : false;
          },
          handler: createAuthMiddleware(async (ctx) => {
            const email: string | undefined =
              ctx.body && typeof ctx.body === "object" && "email" in ctx.body
                ? (ctx.body as { email: string }).email
                : undefined;

            if (!email) return;

            if (!isEmailAllowed(email)) {
              throw new APIError("BAD_REQUEST", {
                message: errorMessage,
                code: "DISPOSABLE_EMAIL_NOT_ALLOWED",
              });
            }
          }),
        },
      ],
    },
    $ERROR_CODES: {
      DISPOSABLE_EMAIL_NOT_ALLOWED: {
        code: "DISPOSABLE_EMAIL_NOT_ALLOWED",
        message: errorMessage,
      },
    },
  };
};
