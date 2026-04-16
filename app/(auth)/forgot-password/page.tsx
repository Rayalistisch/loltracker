import type { Metadata } from "next"
import Link from "next/link"
import { ForgotPasswordForm } from "./forgot-password-form"

export const metadata: Metadata = { title: "Reset Password" }

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Reset password</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send a reset link
        </p>
      </div>

      <ForgotPasswordForm />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          ← Back to sign in
        </Link>
      </p>
    </>
  )
}
