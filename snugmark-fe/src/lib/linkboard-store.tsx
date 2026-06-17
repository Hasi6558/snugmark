import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Tag = { id: string; name: string; colorIndex: number };

export type Link = {
  id: string;
  collectionId: string;
  url: string;
  title: string;
  description: string;
  favicon: string;
  isFavourite: boolean;
  position: number;
  tagIds: string[];
  visitCount: number;
  lastVisitedAt: number | null;
  isRead: boolean;
};

export type Collection = {
  id: string;
  parentId: string | null;
  name: string;
  order: number;
  locked?: boolean;
};

export type View = "home" | "collection";

type Ctx = {
  collections: Collection[];
  links: Link[];
  tags: Tag[];
  view: View;
  selectedCollectionId: string | null;
  goHome: () => void;
  setSelectedCollectionId: (id: string | null) => void;
  addCollection: (name: string, parentId: string | null) => void;
  renameCollection: (id: string, name: string) => void;
  deleteCollection: (id: string) => void;
  reorderCollections: (next: Collection[]) => void;
  addLink: (data: Omit<Link, "id" | "position" | "visitCount" | "lastVisitedAt" | "isRead">) => void;
  updateLink: (id: string, data: Partial<Link>) => void;
  deleteLink: (id: string) => void;
  toggleFavourite: (id: string) => void;
  toggleRead: (id: string) => void;
  recordVisit: (id: string) => void;
  moveLink: (id: string, targetCollectionId: string) => void;
  reorderLinks: (collectionId: string, next: Link[]) => void;
  addTag: (name: string) => Tag;
  lockCollection: (id: string, password: string) => boolean;
  removeLock: (id: string, password: string) => boolean;
  unlockCollection: (id: string, password: string) => boolean;
  isUnlocked: (id: string) => boolean;
  verifyPassword: (password: string) => boolean;
};

const StoreCtx = createContext<Ctx | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10);

const seedTags: Tag[] = [
  { id: "t1", name: "design", colorIndex: 1 },
  { id: "t2", name: "reading", colorIndex: 2 },
  { id: "t3", name: "tools", colorIndex: 3 },
  { id: "t4", name: "inspiration", colorIndex: 5 },
];

const seedCollections: Collection[] = [
  { id: "c1", parentId: null, name: "Reading list", order: 0 },
  { id: "c2", parentId: null, name: "Design", order: 1 },
  { id: "c3", parentId: "c2", name: "Typography", order: 0 },
  { id: "c4", parentId: "c2", name: "Color", order: 1 },
  { id: "c5", parentId: null, name: "Dev tools", order: 2 },
];

const fav = (domain: string) =>
  `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

const now = Date.now();
const mkLink = (l: Omit<Link, "visitCount" | "lastVisitedAt" | "isRead"> & Partial<Pick<Link, "visitCount" | "lastVisitedAt" | "isRead">>): Link => ({
  visitCount: 0, lastVisitedAt: null, isRead: false, ...l,
});

const seedLinks: Link[] = [
  mkLink({
    id: "l1", collectionId: "c1", url: "https://paulgraham.com/greatwork.html",
    title: "How to Do Great Work", description: "Paul Graham's long essay on doing meaningful work.",
    favicon: fav("paulgraham.com"), isFavourite: true, position: 0, tagIds: ["t2", "t4"],
    visitCount: 12, lastVisitedAt: now - 1000 * 60 * 60 * 2, isRead: true,
  }),
  mkLink({
    id: "l2", collectionId: "c1", url: "https://every.to/",
    title: "Every — Writing about business, AI and the internet",
    description: "A bundle of thoughtful newsletters worth a slow morning read.",
    favicon: fav("every.to"), isFavourite: false, position: 1, tagIds: ["t2"],
    visitCount: 3, lastVisitedAt: now - 1000 * 60 * 60 * 26,
  }),
  mkLink({
    id: "l3", collectionId: "c3", url: "https://practicaltypography.com/",
    title: "Butterick's Practical Typography",
    description: "A free book on type that genuinely changes how you set text.",
    favicon: fav("practicaltypography.com"), isFavourite: true, position: 0, tagIds: ["t1"],
    visitCount: 8, lastVisitedAt: now - 1000 * 60 * 30, isRead: true,
  }),
  mkLink({
    id: "l4", collectionId: "c4", url: "https://oklch.com/",
    title: "OKLCH Color Picker & Converter",
    description: "Pick perceptually uniform colors with live previews.",
    favicon: fav("oklch.com"), isFavourite: false, position: 0, tagIds: ["t1", "t3"],
    visitCount: 15, lastVisitedAt: now - 1000 * 60 * 10,
  }),
  mkLink({
    id: "l5", collectionId: "c5", url: "https://github.com/features/copilot",
    title: "GitHub Copilot",
    description: "AI pair programmer that lives in your editor.",
    favicon: fav("github.com"), isFavourite: false, position: 0, tagIds: ["t3"],
    visitCount: 5, lastVisitedAt: now - 1000 * 60 * 60 * 5,
  }),
  mkLink({
    id: "l6", collectionId: "c5", url: "https://raycast.com/",
    title: "Raycast — Your shortcut to everything",
    description: "A keyboard-first launcher that replaces a dozen tools.",
    favicon: fav("raycast.com"), isFavourite: true, position: 1, tagIds: ["t3"],
    visitCount: 22, lastVisitedAt: now - 1000 * 60 * 60 * 1, isRead: true,
  }),
];

export function LinkboardProvider({ children }: { children: ReactNode }) {
  const [collections, setCollections] = useState<Collection[]>(seedCollections);
  const [links, setLinks] = useState<Link[]>(seedLinks);
  const [tags, setTags] = useState<Tag[]>(seedTags);
  const [view, setView] = useState<View>("home");
  const [selectedCollectionId, setSelectedCollectionIdState] = useState<string | null>(null);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());

  const verifyPassword = (password: string) => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("linkboard.password");
    if (!stored) return password === "password";
    return password === stored;
  };

  const value: Ctx = useMemo(() => ({
    collections, links, tags, view, selectedCollectionId,
    goHome: () => { setView("home"); setSelectedCollectionIdState(null); },
    setSelectedCollectionId: (id) => {
      setSelectedCollectionIdState(id);
      if (id) setView("collection");
    },
    addCollection: (name, parentId) => {
      const siblings = collections.filter((c) => c.parentId === parentId);
      const next: Collection = { id: uid(), parentId, name, order: siblings.length };
      setCollections((prev) => [...prev, next]);
      setSelectedCollectionIdState(next.id);
      setView("collection");
    },
    renameCollection: (id, name) =>
      setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c))),
    deleteCollection: (id) => {
      const toRemove = new Set<string>([id]);
      collections.forEach((c) => { if (c.parentId === id) toRemove.add(c.id); });
      setCollections((prev) => prev.filter((c) => !toRemove.has(c.id)));
      setLinks((prev) => prev.filter((l) => !toRemove.has(l.collectionId)));
      if (selectedCollectionId && toRemove.has(selectedCollectionId)) {
        setSelectedCollectionIdState(null);
        setView("home");
      }
    },
    reorderCollections: (next) => setCollections(next),
    addLink: (data) => {
      const siblings = links.filter((l) => l.collectionId === data.collectionId);
      setLinks((prev) => [...prev, {
        ...data, id: uid(), position: siblings.length,
        visitCount: 0, lastVisitedAt: null, isRead: false,
      }]);
    },
    updateLink: (id, data) =>
      setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...data } : l))),
    deleteLink: (id) => setLinks((prev) => prev.filter((l) => l.id !== id)),
    toggleFavourite: (id) =>
      setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, isFavourite: !l.isFavourite } : l))),
    toggleRead: (id) =>
      setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, isRead: !l.isRead } : l))),
    recordVisit: (id) =>
      setLinks((prev) => prev.map((l) => (l.id === id
        ? { ...l, visitCount: l.visitCount + 1, lastVisitedAt: Date.now(), isRead: true }
        : l))),
    moveLink: (id, targetCollectionId) => {
      setLinks((prev) => {
        const link = prev.find((l) => l.id === id);
        if (!link || link.collectionId === targetCollectionId) return prev;
        const targetSiblings = prev.filter((l) => l.collectionId === targetCollectionId);
        return prev.map((l) => (l.id === id
          ? { ...l, collectionId: targetCollectionId, position: targetSiblings.length }
          : l));
      });
    },
    reorderLinks: (collectionId, next) => {
      const others = links.filter((l) => l.collectionId !== collectionId);
      const repositioned = next.map((l, i) => ({ ...l, position: i }));
      setLinks([...others, ...repositioned]);
    },
    addTag: (name) => {
      const existing = tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
      if (existing) return existing;
      const t: Tag = { id: uid(), name, colorIndex: ((tags.length % 6) + 1) };
      setTags((prev) => [...prev, t]);
      return t;
    },
    lockCollection: (id, password) => {
      if (!verifyPassword(password)) return false;
      setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, locked: true } : c)));
      setUnlockedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      return true;
    },
    removeLock: (id, password) => {
      if (!verifyPassword(password)) return false;
      setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, locked: false } : c)));
      setUnlockedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      return true;
    },
    unlockCollection: (id, password) => {
      if (!verifyPassword(password)) return false;
      setUnlockedIds((prev) => { const n = new Set(prev); n.add(id); return n; });
      return true;
    },
    isUnlocked: (id) => unlockedIds.has(id),
    verifyPassword,
  }), [collections, links, tags, view, selectedCollectionId, unlockedIds]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within LinkboardProvider");
  return ctx;
}
