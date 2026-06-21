// Copyright (c) 2026 Hasindu Shehan Liyanage. All Rights Reserved.
// This code may not be copied, modified, distributed, or used in production without written permission.

import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { LinkboardProvider, useStore } from "@/lib/linkboard-store";
import { Sidebar } from "@/components/linkboard/Sidebar";
import { CollectionView } from "@/components/linkboard/CollectionView";
import { HomeView } from "@/components/linkboard/HomeView";
import { Toaster } from "@/components/ui/sonner";
import { api, getToken, clearToken } from "@/lib/api/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Snugmark — A calm place for your links" },
      {
        name: "description",
        content:
          "Save, organize, and revisit the web's best with collections, tags, and favourites.",
      },
      { property: "og:title", content: "Snugmark" },
      { property: "og:description", content: "A calm place for your links." },
    ],
  }),
  component: Home,
});

function Home() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setAuthed(false);
      return;
    }

    api
      .get("/auth/me")
      .then(() => setAuthed(true))
      .catch(() => {
        clearToken();
        setAuthed(false);
      });
  }, []);

  if (authed === null) return null;
  if (!authed) return <Navigate to="/login" />;

  return (
    <LinkboardProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <MainArea />
        </main>
        <Toaster />
      </div>
    </LinkboardProvider>
  );
}

function MainArea() {
  const { view } = useStore();
  return view === "home" ? <HomeView /> : <CollectionView />;
}
