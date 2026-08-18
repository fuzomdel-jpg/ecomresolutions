"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/brand/logo";

function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") || "/app";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await signIn("credentials", {
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      redirect: false,
    });
    if (result?.error) {
      setError("That email or password didn't match.");
      setPending(false);
      return;
    }
    window.location.href = next;
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-16">
      <Logo />
      <h1 className="mt-8 text-2xl font-semibold text-navy">Login</h1>
      <p className="mt-2 text-sm text-muted">You can start describing a problem before you create an account.</p>
      <form action={onSubmit} className="mt-6 space-y-3">
        <label className="block text-sm">
          Email
          <Input name="email" type="email" required className="mt-1" />
        </label>
        <label className="block text-sm">
          Password
          <Input name="password" type="password" required className="mt-1" />
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          Continue
        </Button>
      </form>
      <Button
        type="button"
        variant="outline"
        className="mt-3 w-full"
        onClick={() => signIn("google", { callbackUrl: next })}
      >
        Continue with Google
      </Button>
      <p className="mt-4 text-sm text-muted">
        New here? <Link href="/signup" className="text-accent">Get started</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
