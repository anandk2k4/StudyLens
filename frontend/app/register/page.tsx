"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { registerAction } from "@/actions/auth.actions";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

function getPasswordStrength(pw: string): { score: number; label: string; cls: string } {
  if (!pw)         return { score: 0, label: "",        cls: "" };
  if (pw.length < 6) return { score: 1, label: "Weak",   cls: "weak" };
  const hasUpper  = /[A-Z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  const score = [pw.length >= 8, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  if (score <= 2) return { score: 2, label: "Fair",     cls: "medium" };
  if (score === 3) return { score: 3, label: "Good",    cls: "medium" };
  return           { score: 4, label: "Strong",          cls: "strong" };
}

export default function RegisterPage() {
  const [isPending, startTransition] = useTransition();
  const [globalError, setGlobalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const strength = getPasswordStrength(password);

  function validate(name: string, email: string, pw: string): boolean {
    const errors: FieldErrors = {};
    if (!name || name.trim().length < 2)  errors.name  = "Name must be at least 2 characters";
    if (!email)                            errors.email = "Email is required";
    if (email && !/\S+@\S+\.\S+/.test(email)) errors.email = "Enter a valid email address";
    if (!pw)                               errors.password = "Password is required";
    if (pw && pw.length < 8)              errors.password = "Password must be at least 8 characters";
    if (pw && !/[A-Z]/.test(pw))          errors.password = "Must contain an uppercase letter";
    if (pw && !/[0-9]/.test(pw))          errors.password = "Must contain a number";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGlobalError("");
    const form = e.currentTarget;
    const name     = (form.elements.namedItem("name")     as HTMLInputElement).value;
    const email    = (form.elements.namedItem("email")    as HTMLInputElement).value;
    const pw       = (form.elements.namedItem("password") as HTMLInputElement).value;
    if (!validate(name, email, pw)) return;
    startTransition(async () => {
      const result = await registerAction(new FormData(form));
      if (result?.error) setGlobalError(result.error);
    });
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start building your AI learning workspace">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>

        {globalError && (
          <div className="auth-error-banner">
            <span>⚠</span><span>{globalError}</span>
          </div>
        )}

        {/* Name */}
        <div className="field">
          <label className="field-label" htmlFor="name">Full name</label>
          <input
            id="name" name="name" type="text"
            autoComplete="name" placeholder="Your name"
            className={`field-input ${fieldErrors.name ? "error-input" : ""}`}
            onChange={() => setFieldErrors((e) => ({ ...e, name: undefined }))}
          />
          {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
        </div>

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
              autoComplete="new-password" placeholder="Min. 8 characters"
              className={`field-input ${fieldErrors.password ? "error-input" : ""}`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((err) => ({ ...err, password: undefined }));
              }}
            />
            <button
              type="button" className="password-toggle"
              onClick={() => setShowPassword((v) => !v)} tabIndex={-1}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}

          {/* Strength meter */}
          {password && (
            <>
              <div className="pw-strength">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`pw-bar ${
                      i <= strength.score
                        ? `active-${strength.cls}`
                        : ""
                    }`}
                  />
                ))}
              </div>
              <span className={`pw-label ${strength.cls}`}>{strength.label}</span>
            </>
          )}
        </div>

        <button type="submit" className="auth-submit" disabled={isPending}>
          {isPending
            ? <><span className="spin">⟳</span> Creating account…</>
            : "Create account →"}
        </button>

        <p style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", lineHeight: 1.5 }}>
          By creating an account you agree to our terms of service.
        </p>

      </form>

      <p className="auth-footer">
        Already have an account?{" "}
        <Link href="/login">Log in</Link>
      </p>
    </AuthLayout>
  );
}