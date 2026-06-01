"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { loginAction } from "@/actions/auth.actions";

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [globalError, setGlobalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  function validate(email: string, password: string): boolean {
    const errors: FieldErrors = {};
    if (!email)    errors.email    = "Email is required";
    if (!password) errors.password = "Password is required";
    if (email && !/\S+@\S+\.\S+/.test(email)) errors.email = "Enter a valid email address";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGlobalError("");
    const form = e.currentTarget;
    const email    = (form.elements.namedItem("email")    as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    if (!validate(email, password)) return;
    startTransition(async () => {
      const result = await loginAction(new FormData(form));
      if (result?.error) setGlobalError(result.error);
    });
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue your learning sessions">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>

        {globalError && (
          <div className="auth-error-banner">
            <span>⚠</span><span>{globalError}</span>
          </div>
        )}

        {/* Email */}
        <div className="field">
          <label className="field-label" htmlFor="email">Email address</label>
          <input
            id="email" name="email" type="email"
            autoComplete="email" placeholder="you@example.com"
            className={`field-input ${fieldErrors.email ? "error-input" : ""}`}
            onChange={() => setFieldErrors((e) => ({ ...e, email: undefined }))}
          />
          {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
        </div>

        {/* Password */}
        <div className="field">
          <label className="field-label" htmlFor="password">Password</label>
          <div className="password-wrap">
            <input
              id="password" name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password" placeholder="Enter your password"
              className={`field-input ${fieldErrors.password ? "error-input" : ""}`}
              onChange={() => setFieldErrors((e) => ({ ...e, password: undefined }))}
            />
            <button
              type="button" className="password-toggle"
              onClick={() => setShowPassword((v) => !v)} tabIndex={-1}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
        </div>

        <button type="submit" className="auth-submit" disabled={isPending}>
          {isPending ? <><span className="spin">⟳</span> Logging in…</> : "Log in →"}
        </button>

      </form>

      <p className="auth-footer">
        Don't have an account?{" "}
        <Link href="/register">Create one free</Link>
      </p>
    </AuthLayout>
  );
}