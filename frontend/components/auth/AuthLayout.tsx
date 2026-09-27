import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export function AuthLayout({
  children,
  title,
  subtitle,
  variant,
  rightContent,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  variant: "login" | "register";
  rightContent?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#05090B] text-[#F5F7F7] font-sans selection:bg-[#00D9C0]/30 selection:text-white">
      {/* Left Column (Form) */}
      <div className="flex w-full flex-col justify-center px-6 py-12 md:w-1/2 lg:px-20 xl:px-32 bg-[#05090B] relative z-10">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="mb-10 inline-block">
            <Image
              src="/studylens-brand-logo.png"
              alt="StudyLens"
              width={160}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
              {title}
            </h1>
            <p className="text-sm text-[#8B9A9D] mb-8">
              {subtitle}
            </p>
          </motion.div>

          {/* Form Content */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {children}
          </motion.div>
        </div>
      </div>

      {/* Right Column (Branding/Marketing) — uses the abstract background image */}
      <div className="hidden md:flex w-1/2 relative border-l border-[#1A2830] overflow-hidden items-center justify-center p-12">
        {/* Background Image */}
        <Image
          src="/auth-bg.png"
          alt=""
          fill
          className="object-cover"
          priority
        />
        {/* Subtle Dark Overlay */}
        <div className="absolute inset-0 bg-[#05090B]/70 pointer-events-none" />

        <div className="relative z-10 w-full max-w-lg flex flex-col items-center">
          {rightContent ? (
            rightContent
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center text-center"
            >
              {variant === "register" ? (
                <>
                  <h2 className="text-4xl font-bold text-white mb-8 drop-shadow-lg">
                    Start learning smarter today.
                  </h2>
                  <ul className="space-y-6 text-left inline-block">
                    {[
                      "Turn videos into notes",
                      "AI-powered learning tools",
                      "Study anytime, anywhere",
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-center gap-4 text-[#F5F7F7] text-lg font-medium drop-shadow">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#00D9C0]/20 backdrop-blur-sm flex items-center justify-center text-[#00D9C0] border border-[#00D9C0]/30">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="text-center flex flex-col items-center">
                  <Image
                    src="/studylens-brand-logo.png"
                    alt="StudyLens Branding"
                    width={280}
                    height={70}
                    className="mb-8 h-16 w-auto drop-shadow-lg"
                  />
                  <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">
                    Turn your lectures into knowledge you <span className="text-[#00D9C0]">can use</span>.
                  </h2>
                  <p className="text-[#D0D5D6] text-lg drop-shadow max-w-md">
                    AI-powered learning from your videos. Study smarter, learn faster, retain longer.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}