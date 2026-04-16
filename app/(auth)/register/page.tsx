import type { Metadata } from "next"
import Link from "next/link"
import { RegisterForm } from "./register-form"

export const metadata: Metadata = { title: "Create Account" }

export default function RegisterPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create your account</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Start grinding smarter today
        </p>
      </div>

      <RegisterForm />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </>
  )
}
