import { describe, it, expect } from "vitest";
import { getTestInstance } from "better-auth/test";
import { noDisposableEmails } from "../index";

const TEST_USER = {
  email: "testuser@gmail.com",
  password: "securepassword123",
  name: "Test User",
};

describe("noDisposableEmails plugin", () => {
  it("should allow sign-up with a legitimate email", async () => {
    const { client } = await getTestInstance(
      { plugins: [noDisposableEmails()] },
      { testUser: TEST_USER }
    );

    const result = await client.signUp.email({
      email: "newuser@gmail.com",
      password: "securepassword123",
      name: "New User",
    });

    expect(result.error).toBeNull();
    expect(result.data?.user.email).toBe("newuser@gmail.com");
  });

  it("should reject sign-up with a disposable email", async () => {
    const { client } = await getTestInstance(
      { plugins: [noDisposableEmails()] },
      { testUser: TEST_USER }
    );

    const result = await client.signUp.email({
      email: "user@mailinator.com",
      password: "securepassword123",
      name: "Test User",
    });

    expect(result.error).not.toBeNull();
    expect(result.error?.status).toBe(400);
    expect(result.error?.message).toBe(
      "Disposable email addresses are not allowed."
    );
  });

  it("should use a custom error message when provided", async () => {
    const customMessage = "We do not accept temporary email addresses.";
    const { client } = await getTestInstance(
      { plugins: [noDisposableEmails({ errorMessage: customMessage })] },
      { testUser: TEST_USER }
    );

    const result = await client.signUp.email({
      email: "user@guerrillamail.com",
      password: "securepassword123",
      name: "Test User",
    });

    expect(result.error).not.toBeNull();
    expect(result.error?.message).toBe(customMessage);
  });

  it("should block a custom domain added via customBlockedDomains", async () => {
    const { client } = await getTestInstance(
      {
        plugins: [
          noDisposableEmails({ customBlockedDomains: ["myspammydomain.xyz"] }),
        ],
      },
      { testUser: TEST_USER }
    );

    const result = await client.signUp.email({
      email: "user@myspammydomain.xyz",
      password: "securepassword123",
      name: "Test User",
    });

    expect(result.error).not.toBeNull();
    expect(result.error?.status).toBe(400);
  });

  it("should not block sign-in by default", async () => {
    const { client } = await getTestInstance(
      { plugins: [noDisposableEmails()] },
      { testUser: TEST_USER }
    );

    const result = await client.signIn.email({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });

    expect(result.error).toBeNull();
  });

  it("should block sign-in when paths include /sign-in/email", async () => {
    const { client } = await getTestInstance(
      {
        plugins: [
          noDisposableEmails({
            paths: ["/sign-up/email", "/sign-in/email"],
          }),
        ],
      },
      { testUser: TEST_USER }
    );

    const result = await client.signIn.email({
      email: "user@mailinator.com",
      password: "securepassword123",
    });

    expect(result.error).not.toBeNull();
    expect(result.error?.status).toBe(400);
  });
});
