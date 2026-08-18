"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { Role } from "@prisma/client";

export function UserMenu({
  name,
  email,
  role,
  staff,
}: {
  name?: string | null;
  email: string;
  role: Role;
  staff: boolean;
}) {
  const [open, setOpen] = useState(false);
  const initials = (name || email).slice(0, 1).toUpperCase();
  return (
    <div className="relative">
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-sm font-medium text-white"
        aria-label="Account menu"
        onClick={() => setOpen((value) => !value)}
      >
        {initials}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-border bg-white p-2 shadow-xl">
          <p className="px-3 py-2 text-sm font-medium text-navy">{name || email}</p>
          <p className="px-3 pb-2 text-xs text-muted">{role}</p>
          <Link className="block rounded-xl px-3 py-2 text-sm hover:bg-accent-soft" href="/app">
            Workspace
          </Link>
          <Link className="block rounded-xl px-3 py-2 text-sm hover:bg-accent-soft" href="/app/account">
            Account
          </Link>
          <Link className="block rounded-xl px-3 py-2 text-sm hover:bg-accent-soft" href="/app/billing">
            Billing
          </Link>
          {staff ? (
            <Link className="block rounded-xl px-3 py-2 text-sm hover:bg-accent-soft" href="/admin">
              Admin
            </Link>
          ) : null}
          <button
            type="button"
            className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-accent-soft"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
