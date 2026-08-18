"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/brand/logo";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Could not create the account.");
      setPending(false);
      return;
    }
    await signIn("credentials", {
      email: String(formData.get("email")),
      password: String(formData.get("password")),
      callbackUrl: "/app",
    });
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-16">
      <Logo />
      <h1 className="mt-8 text-2xl font-semibold text-navy">Get started</h1>
      <p className="mt-2 text-sm text-muted">Create an account during payment, or now if you prefer.</p>
      <form action={onSubmit} className="mt-6 space-y-3">
        <label className="block text-sm">
          Name
          <Input name="name" required className="mt-1" />
        </label>
        <label className="block text-sm">
          Email
          <Input name="email" type="email" required className="mt-1" />
        </label>
        <label className="block text-sm">
          Password
          <Input name="password" type="password" minLength={8} required className="mt-1" />
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          Create account
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        Already have an account? <Link href="/login" className="text-accent">Login</Link>
      </p>
    </div>
  );
}
