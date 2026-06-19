import { createContext, useContext, useState, useMemo, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api/client";

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

// The API returns ISO date strings; normalize to timestamps for the frontend.
type ApiLink = Omit<Link, "lastVisitedAt"> & { lastVisitedAt: string | null };

function normalizeLink(l: ApiLink): Link {
  return {
    ...l,
    lastVisitedAt: l.lastVisitedAt ? new Date(l.lastVisitedAt).getTime() : null,
  };
}

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
  addLink: (
    data: Omit<Link, "id" | "position" | "visitCount" | "lastVisitedAt" | "isRead">,
  ) => void;
  updateLink: (id: string, data: Partial<Link>) => void;
  deleteLink: (id: string) => void;
  toggleFavourite: (id: string) => void;
  toggleRead: (id: string) => void;
  recordVisit: (id: string) => void;
  moveLink: (id: string, targetCollectionId: string) => void;
  reorderLinks: (collectionId: string, next: Link[]) => void;
  addTag: (name: string) => Promise<Tag>;
  lockCollection: (id: string, password: string) => Promise<boolean>;
  removeLock: (id: string, password: string) => Promise<boolean>;
  unlockCollection: (id: string, password: string) => Promise<boolean>;
  isUnlocked: (id: string) => boolean;
  verifyPassword: (password: string) => Promise<boolean>;
};

const StoreCtx = createContext<Ctx | null>(null);

export function LinkboardProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>("home");
  const [selectedCollectionId, setSelectedCollectionIdState] = useState<string | null>(null);
  // Maps collectionId → signed unlock token (1 h JWT). Used as the X-Unlock-Tokens header.
  const [unlockedTokens, setUnlockedTokens] = useState<Map<string, string>>(new Map());

  // Stable comma-separated string for use as part of the links query key and header.
  const tokenHeader = useMemo(
    () => Array.from(unlockedTokens.values()).join(","),
    [unlockedTokens],
  );

  // ── Queries ───────────────────────────────────────────────────────────────

  const { data: collectionsData } = useQuery({
    queryKey: ["collections"],
    queryFn: () => api.get<{ collections: Collection[] }>("/collections"),
  });

  const { data: linksData } = useQuery({
    queryKey: ["links", tokenHeader],
    queryFn: () =>
      api.get<{ links: ApiLink[] }>(
        "/links",
        tokenHeader ? { "X-Unlock-Tokens": tokenHeader } : undefined,
      ),
  });

  const { data: tagsData } = useQuery({
    queryKey: ["tags"],
    queryFn: () => api.get<{ tags: Tag[] }>("/tags"),
  });

  const collections = collectionsData?.collections ?? [];
  const links = (linksData?.links ?? []).map(normalizeLink);
  const tags = tagsData?.tags ?? [];

  const linksKey = ["links", tokenHeader] as const;

  // ── Collection mutations ──────────────────────────────────────────────────

  const addCollectionMutation = useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId: string | null }) =>
      api.post<{ collection: Collection }>("/collections", { name, parentId }),
    onSuccess: ({ collection }) => {
      void queryClient.invalidateQueries({ queryKey: ["collections"] });
      setSelectedCollectionIdState(collection.id);
      setView("collection");
    },
  });

  const renameCollectionMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.patch(`/collections/${id}`, { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["collections"] }),
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/collections/${id}`),
    onSuccess: (_data, id) => {
      const cols =
        queryClient.getQueryData<{ collections: Collection[] }>(["collections"])?.collections ?? [];
      const toRemove = new Set([id, ...cols.filter((c) => c.parentId === id).map((c) => c.id)]);
      if (selectedCollectionId && toRemove.has(selectedCollectionId)) {
        setSelectedCollectionIdState(null);
        setView("home");
      }
      void queryClient.invalidateQueries({ queryKey: ["collections"] });
      void queryClient.invalidateQueries({ queryKey: ["links"] });
    },
  });

  const reorderCollectionsMutation = useMutation({
    mutationFn: (orderedIds: string[]) => api.patch("/collections/reorder", { orderedIds }),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: ["collections"] });
      const prev = queryClient.getQueryData(["collections"]);
      queryClient.setQueryData(
        ["collections"],
        (old: { collections: Collection[] } | undefined) => ({
          collections: orderedIds
            .map((id, i) => {
              const c = old?.collections.find((c) => c.id === id);
              return c ? { ...c, order: i } : null;
            })
            .filter(Boolean) as Collection[],
        }),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["collections"], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["collections"] }),
  });

  const lockMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      api.post(`/collections/${id}/lock`, { password }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["collections"] }),
  });

  const removeLockMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      api.post(`/collections/${id}/remove-lock`, { password }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["collections"] }),
  });

  const unlockMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      api.post<{ valid: boolean; unlockToken: string }>(`/collections/${id}/unlock`, { password }),
  });

  // ── Link mutations ────────────────────────────────────────────────────────

  const addLinkMutation = useMutation({
    mutationFn: (data: Omit<Link, "id" | "position" | "visitCount" | "lastVisitedAt" | "isRead">) =>
      api.post("/links", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["links"] }),
  });

  const updateLinkMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Link> }) =>
      api.patch(`/links/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["links"] }),
  });

  const deleteLinkMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/links/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["links"] }),
  });

  const toggleFavouriteMutation = useMutation({
    mutationFn: ({ id, isFavourite }: { id: string; isFavourite: boolean }) =>
      api.patch(`/links/${id}`, { isFavourite }),
    onMutate: async ({ id, isFavourite }) => {
      await queryClient.cancelQueries({ queryKey: linksKey });
      const prev = queryClient.getQueryData(linksKey);
      queryClient.setQueryData(linksKey, (old: { links: ApiLink[] } | undefined) => ({
        links: old?.links.map((l) => (l.id === id ? { ...l, isFavourite } : l)) ?? [],
      }));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(linksKey, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["links"] }),
  });

  const toggleReadMutation = useMutation({
    mutationFn: ({ id, isRead }: { id: string; isRead: boolean }) =>
      api.patch(`/links/${id}`, { isRead }),
    onMutate: async ({ id, isRead }) => {
      await queryClient.cancelQueries({ queryKey: linksKey });
      const prev = queryClient.getQueryData(linksKey);
      queryClient.setQueryData(linksKey, (old: { links: ApiLink[] } | undefined) => ({
        links: old?.links.map((l) => (l.id === id ? { ...l, isRead } : l)) ?? [],
      }));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(linksKey, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["links"] }),
  });

  const recordVisitMutation = useMutation({
    mutationFn: (id: string) => api.post(`/links/${id}/visit`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["links"] }),
  });

  const moveLinkMutation = useMutation({
    mutationFn: ({ id, targetCollectionId }: { id: string; targetCollectionId: string }) =>
      api.patch(`/links/${id}/move`, { targetCollectionId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["links"] }),
  });

  const reorderLinksMutation = useMutation({
    mutationFn: ({ collectionId, orderedIds }: { collectionId: string; orderedIds: string[] }) =>
      api.patch("/links/reorder", { collectionId, orderedIds }),
    onMutate: async ({ collectionId, orderedIds }) => {
      await queryClient.cancelQueries({ queryKey: linksKey });
      const prev = queryClient.getQueryData(linksKey);
      queryClient.setQueryData(linksKey, (old: { links: ApiLink[] } | undefined) => {
        const others = old?.links.filter((l) => l.collectionId !== collectionId) ?? [];
        const reordered = orderedIds
          .map((id, i) => {
            const l = old?.links.find((l) => l.id === id);
            return l ? { ...l, position: i } : null;
          })
          .filter(Boolean) as ApiLink[];
        return { links: [...others, ...reordered] };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(linksKey, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["links"] }),
  });

  // ── Tag mutations ─────────────────────────────────────────────────────────

  const addTagMutation = useMutation({
    mutationFn: (name: string) => api.post<{ tag: Tag }>("/tags", { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tags"] }),
  });

  // ── Context value ─────────────────────────────────────────────────────────

  const value: Ctx = {
    collections,
    links,
    tags,
    view,
    selectedCollectionId,

    goHome: () => {
      setView("home");
      setSelectedCollectionIdState(null);
    },
    setSelectedCollectionId: (id) => {
      setSelectedCollectionIdState(id);
      if (id) setView("collection");
    },

    addCollection: (name, parentId) => addCollectionMutation.mutate({ name, parentId }),
    renameCollection: (id, name) => renameCollectionMutation.mutate({ id, name }),
    deleteCollection: (id) => deleteCollectionMutation.mutate(id),
    reorderCollections: (next) => reorderCollectionsMutation.mutate(next.map((c) => c.id)),

    addLink: (data) => addLinkMutation.mutate(data),
    updateLink: (id, data) => updateLinkMutation.mutate({ id, data }),
    deleteLink: (id) => deleteLinkMutation.mutate(id),
    toggleFavourite: (id) => {
      const current = queryClient
        .getQueryData<{ links: ApiLink[] }>(linksKey)
        ?.links.find((l) => l.id === id);
      if (current) toggleFavouriteMutation.mutate({ id, isFavourite: !current.isFavourite });
    },
    toggleRead: (id) => {
      const current = queryClient
        .getQueryData<{ links: ApiLink[] }>(linksKey)
        ?.links.find((l) => l.id === id);
      if (current) toggleReadMutation.mutate({ id, isRead: !current.isRead });
    },
    recordVisit: (id) => recordVisitMutation.mutate(id),
    moveLink: (id, targetCollectionId) => moveLinkMutation.mutate({ id, targetCollectionId }),
    reorderLinks: (collectionId, next) =>
      reorderLinksMutation.mutate({ collectionId, orderedIds: next.map((l) => l.id) }),

    addTag: async (name) => {
      const { tag } = await addTagMutation.mutateAsync(name);
      return tag;
    },

    lockCollection: async (id, password) => {
      try {
        await lockMutation.mutateAsync({ id, password });
        setUnlockedTokens((prev) => {
          const n = new Map(prev);
          n.delete(id);
          return n;
        });
        return true;
      } catch {
        return false;
      }
    },
    removeLock: async (id, password) => {
      try {
        await removeLockMutation.mutateAsync({ id, password });
        setUnlockedTokens((prev) => {
          const n = new Map(prev);
          n.delete(id);
          return n;
        });
        return true;
      } catch {
        return false;
      }
    },
    unlockCollection: async (id, password) => {
      try {
        const { unlockToken } = await unlockMutation.mutateAsync({ id, password });
        setUnlockedTokens((prev) => new Map(prev).set(id, unlockToken));
        return true;
      } catch {
        return false;
      }
    },
    isUnlocked: (id) => unlockedTokens.has(id),

    verifyPassword: async (password) => {
      try {
        const { valid } = await api.post<{ valid: boolean }>("/auth/verify-password", { password });
        return valid;
      } catch {
        return false;
      }
    },
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within LinkboardProvider");
  return ctx;
}
