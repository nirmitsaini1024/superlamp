"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import { ClientOnly } from "@/components/ui/client-only";
import Link from "next/link";
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import { Server, Store } from 'lucide-react';

function DashboardLink() {
  const { isSignedIn } = useUser();

  if (!isSignedIn) {
    return null;
  }

  return (
    <Link href="/dashboard">
      <Button variant="ghost" size="sm" className="flex items-center gap-2">
        <Server className="w-4 h-4" />
        Dashboard
      </Button>
    </Link>
  );
}

function MarketplaceLink() {
  return (
    <Link href="/marketplace">
      <Button variant="ghost" size="sm" className="flex items-center gap-2">
        <Store className="w-4 h-4" />
        Market Place
      </Button>
    </Link>
  );
}

function ProfileSection() {
  const { isAuthenticated, loading } = useAuth();

  if (!loading && isAuthenticated) {
    return <UserButton />;
  }

  return (
    <div className="flex items-center gap-2">
      <SignInButton mode="modal">
        <Button variant="ghost" size="sm">
          Sign In
        </Button>
      </SignInButton>
      <SignUpButton mode="modal">
        <Button size="sm">
          Sign Up
        </Button>
      </SignUpButton>
    </div>
  );
}

export default function Navbar() {
  return (
    <nav className="bg-sidebar border-b border-sidebar-border px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left side - Logo/Brand */}
        <div className="flex items-center">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <h1 className="text-sidebar-foreground text-xl font-semibold cursor-pointer">
              Super Lamp
            </h1>
          </Link>
        </div>

        {/* Right side - Navigation, Theme Toggle and Profile */}
        <div className="flex items-center gap-4">
          <ClientOnly
            fallback={<div className="w-8 h-8 bg-sidebar-accent rounded-full animate-pulse" />}
          >
            <DashboardLink />
          </ClientOnly>
          <ClientOnly
            fallback={null}
          >
            <MarketplaceLink />
          </ClientOnly>
          <ThemeToggleButton
            variant="gif"
            url="https://media.giphy.com/media/5PncuvcXbBuIZcSiQo/giphy.gif?cid=ecf05e47j7vdjtytp3fu84rslaivdun4zvfhej6wlvl6qqsz&ep=v1_stickers_search&rid=giphy.gif&ct=s"
            duration={2}
          />{" "}
          <ClientOnly
            fallback={
              <div className="w-8 h-8 bg-sidebar-accent rounded-full animate-pulse" />
            }
          >
            <ProfileSection />
          </ClientOnly>
        </div>
      </div>
    </nav>
  );
}
