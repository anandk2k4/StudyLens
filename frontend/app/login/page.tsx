"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Eye, EyeOff, ArrowRight } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { loginAction } from "@/actions/auth.actions";
import Image from "next/image";

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
    if (!email) errors.email = "Email is required";
    if (!password) errors.password = "Password is required";
    if (email && !/\S+@\S+\.\S+/.test(email)) errors.email = "Enter a valid email address";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGlobalError("");
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    if (!validate(email, password)) return;
    startTransition(async () => {
      const result = await loginAction(new FormData(form));
      if (result?.error) setGlobalError(result.error);
    });
  }

  return (
    <AuthLayout 
      variant="login"
      title="Welcome back" 
      subtitle="Log in to continue learning"
    >
      <div className="mb-6">
        <button
          type="button"
          className="w-full flex items-center justify-center gap-3 rounded-lg border border-[#1A2830] bg-[#0D1519] h-11 text-sm font-medium text-white transition-colors hover:bg-[#111A1F] hover:border-[#4A5B62]"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#1A2830]"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[#05090B] px-4 text-[#4A5B62]">— or continue with email —</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {globalError && (
          <div className="flex items-center gap-2 rounded-xl border border-[#FF3347]/40 bg-[#FF3347]/10 p-3 text-sm text-[#FF3347]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{globalError}</span>
          </div>
        )}

        {/* Email */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#8B9A9D]" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            className={`w-full rounded-lg border bg-[#0D1519] px-4 h-11 text-sm text-white placeholder:text-[#4A5B62] outline-none transition-colors focus:border-[#00D9C0] focus:ring-1 focus:ring-[#00D9C0] ${
              fieldErrors.email ? "border-[#FF3347]" : "border-[#1A2830]"
            }`}
            onChange={() => setFieldErrors((e) => ({ ...e, email: undefined }))}
          />
          {fieldErrors.email && (
            <span className="text-xs font-medium text-[#FF3347]">{fieldErrors.email}</span>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[#8B9A9D]" htmlFor="password">
              Password
            </label>
            <Link href="#" className="text-xs font-medium text-[#00D9C0] hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              className={`w-full rounded-lg border bg-[#0D1519] px-4 h-11 pr-10 text-sm text-white placeholder:text-[#4A5B62] outline-none transition-colors focus:border-[#00D9C0] focus:ring-1 focus:ring-[#00D9C0] ${
                fieldErrors.password ? "border-[#FF3347]" : "border-[#1A2830]"
              }`}
              onChange={() => setFieldErrors((e) => ({ ...e, password: undefined }))}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A5B62] hover:text-[#8B9A9D]"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {fieldErrors.password && (
            <span className="text-xs font-medium text-[#FF3347]">{fieldErrors.password}</span>
          )}
        </div>

        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 rounded border-[#1A2830] bg-[#0D1519] text-[#00D9C0] accent-[#00D9C0] focus:ring-[#00D9C0] focus:ring-offset-[#05090B]"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-[#8B9A9D]">
            Remember me
          </label>
        </div>

        <button
          type="submit"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#00D9C0] h-11 text-sm font-semibold text-[#05090B] transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Logging in…</span>
            </>
          ) : (
            <>
              <span>Log in</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-[#8B9A9D]">
        Don't have an account?{" "}
        <Link href="/register" className="font-semibold text-[#00D9C0] hover:underline">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}