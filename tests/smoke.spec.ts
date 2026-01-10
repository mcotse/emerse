import { test, expect } from "@playwright/test";

/**
 * Cross-browser smoke tests for Emerse Photo Explorer
 * Tests basic functionality across desktop and mobile browsers.
 *
 * Note: Auth-protected routes require login which needs CSRF tokens.
 * For now, tests verify the login page and public share pages.
 */

test.describe("Login page", () => {
  test("renders correctly", async ({ page }) => {
    await page.goto("/login");

    // Verify page structure
    await expect(page.getByRole("heading", { name: "Emerse" })).toBeVisible();
    await expect(page.getByPlaceholder("Email")).toBeVisible();
    await expect(page.getByPlaceholder("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();

    // Verify demo credentials hint is shown
    await expect(page.getByText("Demo: demo@emerse.app / demo")).toBeVisible();
  });

  test("form inputs are interactive", async ({ page }) => {
    await page.goto("/login");

    // Fill in the email field
    await page.getByPlaceholder("Email").fill("test@example.com");
    await expect(page.getByPlaceholder("Email")).toHaveValue("test@example.com");

    // Fill in the password field
    await page.getByPlaceholder("Password").fill("password123");
    await expect(page.getByPlaceholder("Password")).toHaveValue("password123");
  });

  test("handles invalid credentials", async ({ page }) => {
    await page.goto("/login");

    // Fill in invalid credentials
    await page.getByPlaceholder("Email").fill("invalid@example.com");
    await page.getByPlaceholder("Password").fill("wrongpassword");

    // Click sign in
    await page.getByRole("button", { name: /sign in/i }).click();

    // After invalid login, should stay on login page (with error state or redirect back)
    // The URL should contain 'login' (either stayed or redirected back with error)
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("login");
  });
});

test.describe("Responsive design", () => {
  test("login page adapts to viewport", async ({ page }) => {
    await page.goto("/login");

    // The form should be visible and centered
    const form = page.locator("form");
    await expect(form).toBeVisible();

    // Heading should be visible
    await expect(page.getByRole("heading", { name: "Emerse" })).toBeVisible();
  });
});

test.describe("Accessibility", () => {
  test("login page has proper form labels", async ({ page }) => {
    await page.goto("/login");

    // Labels should be present (even if visually hidden)
    const emailInput = page.getByPlaceholder("Email");
    await expect(emailInput).toHaveAttribute("id", "email");

    const passwordInput = page.getByPlaceholder("Password");
    await expect(passwordInput).toHaveAttribute("id", "password");
  });

  test("button is properly labeled", async ({ page }) => {
    await page.goto("/login");

    const signInButton = page.getByRole("button", { name: /sign in/i });
    await expect(signInButton).toBeVisible();
    await expect(signInButton).toHaveAttribute("type", "submit");
  });
});

test.describe("Public pages", () => {
  test("unauthenticated users are redirected to login", async ({ page }) => {
    // Try to access home page without auth
    await page.goto("/");

    // Should be redirected to login
    await page.waitForURL(/\/login/, { timeout: 5000 });
    await expect(page.getByRole("heading", { name: "Emerse" })).toBeVisible();
  });
});
