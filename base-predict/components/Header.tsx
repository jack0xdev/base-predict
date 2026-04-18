"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton } from "./SignInButton";
import { Trophy, User, Crosshair } from "lucide-react";

interface HeaderProps {
  sessionAddress: string | null;
  streak?: number;
  onAuthChange?: () => void;
}

const NAV_ITEMS = [
  { href: "/", label: "Today", icon: Crosshair },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
];

export function Header({ sessionAddress, streak = 0, onAuthChange }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="relative z-10 border-b border-hairline">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-base-blue flex items-center justify-center">
            <span className="text-white font-clash font-700 text-sm leading-none">B</span>
          </div>
          <span className="font-clash font-700 text-lg tracking-tight text-bone hidden sm:block">
            BASE PREDICT
          </span>
        </Link>

        {/* Nav — desktop */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-satoshi font-500
                  transition-colors duration-200
                  ${active
                    ? "bg-surface-2 text-bone"
                    : "text-bone-muted hover:text-bone hover:bg-surface-2/50"
                  }
                `}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Auth */}
        <SignInButton
          sessionAddress={sessionAddress}
          streak={streak}
          onAuthChange={onAuthChange}
        />
      </div>

      {/* Mobile nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-0/95 backdrop-blur-lg border-t border-hairline"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around h-14">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex flex-col items-center gap-0.5 px-4 py-1 text-xs font-satoshi font-500
                  transition-colors
                  ${active ? "text-acid" : "text-bone-muted"}
                `}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={20} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
