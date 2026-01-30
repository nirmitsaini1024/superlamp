"use client";

import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { ClientOnly } from "@/components/ui/client-only";
import { ChatInterface } from "@/components/chat-interface";

export default function Home() {
  const { loading, isAuthenticated, user } = useAuth();
  const { dbUser, loading: dbLoading, error: dbError } = useUser();

  return (
    <ClientOnly
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-xl text-foreground">Loading...</div>
        </div>
      }
    >
      {loading || dbLoading ? (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-xl text-foreground">
            {dbLoading ? 'Setting up your account...' : 'Loading...'}
          </div>
        </div>
      ) : dbError ? (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-xl text-red-500">
            Error: {dbError}
          </div>
        </div>
      ) : isAuthenticated && user ? (
        <ChatInterface username={user.name || user.login} />
      ) : (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-4xl font-bold text-foreground">
            Welcome to Super Lamp
          </div>
        </div>
      )}
    </ClientOnly>
  );
}
 