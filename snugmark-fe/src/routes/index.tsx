import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { LinkboardProvider, useStore } from "@/lib/linkboard-store";
import { Sidebar } from "@/components/linkboard/Sidebar";
import { CollectionView } from "@/components/linkboard/CollectionView";
import { HomeView } from "@/components/linkboard/HomeView";
import { Toaster } from "@/components/ui/sonner";

const AUTH_KEY = "linkboard.auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Linkboard — A calm place for your links" },
      { name: "description", content: "Save, organize, and revisit the web's best with collections, tags, and favourites." },
      { property: "og:title", content: "Linkboard" },
      { property: "og:description", content: "A calm place for your links." },
    ],
  }),
  component: Home,
});

function Home() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    setAuthed(typeof window !== "undefined" && !!localStorage.getItem(AUTH_KEY));
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
