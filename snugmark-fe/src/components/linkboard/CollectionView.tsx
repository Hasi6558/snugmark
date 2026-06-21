// Copyright (c) 2026 Hasindu Shehan Liyanage. All Rights Reserved.
// This code may not be copied, modified, distributed, or used in production without written permission.

import { useMemo, useState } from "react";
import { useStore, type Link } from "@/lib/linkboard-store";
import {
  DndContext, PointerSensor, useSensor, useSensors, closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { LinkCard } from "./LinkCard";
import { LinkModal } from "./LinkModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { FilterBar, applyFilters, emptyFilters, isFiltersActive, type Filters } from "./FilterBar";
import { ArrowUpDown, Heart, Plus, Bookmark, Lock } from "lucide-react";

export function CollectionView() {
  const { collections, links, tags, selectedCollectionId, reorderLinks, deleteLink, isUnlocked } = useStore();
  const collection = collections.find((c) => c.id === selectedCollectionId) || null;
  const isLockedHidden = !!collection?.locked && !isUnlocked(collection.id);

  const [favouriteSort, setFavouriteSort] = useState(false);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Link | null>(null);
  const [delTarget, setDelTarget] = useState<Link | null>(null);

  const filtersActive = isFiltersActive(filters);

  const collectionLinks = useMemo(() => {
    if (!collection) return [];
    const inCollection = links
      .filter((l) => l.collectionId === collection.id);

    // Apply tag/favourite/read filters (no query, no hidden collections)
    const filtered = filtersActive
      ? applyFilters(inCollection, filters, "", new Set(), tags)
      : inCollection;

    const sorted = [...filtered].sort((a, b) => a.position - b.position);
    if (favouriteSort) {
      return [...sorted].sort((a, b) => Number(b.isFavourite) - Number(a.isFavourite));
    }
    return sorted;
  }, [links, collection, favouriteSort, filters, filtersActive, tags]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const draggable = !favouriteSort && !filtersActive;

  const handleDragEnd = (e: DragEndEvent) => {
    if (!draggable || !collection) return;
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = collectionLinks.findIndex((l) => l.id === active.id);
    const newIndex = collectionLinks.findIndex((l) => l.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    reorderLinks(collection.id, arrayMove(collectionLinks, oldIndex, newIndex));
  };

  if (!collection) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center px-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <Bookmark className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-lg font-semibold">Pick a collection</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select one from the sidebar — or head to Home to search across all of them.
        </p>
      </div>
    );
  }

  if (isLockedHidden) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center px-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-lg font-semibold">"{collection.name}" is locked</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Click the lock icon next to this collection in the sidebar and enter your password to view it.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b px-8 py-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{collection.name}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {collectionLinks.length} {collectionLinks.length === 1 ? "link" : "links"}
              {filtersActive && " match your filters"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setFavouriteSort((v) => !v)}
              className={`rounded-xl gap-1.5 ${favouriteSort ? "bg-accent text-accent-foreground" : ""}`}
            >
              {favouriteSort ? <Heart className="h-4 w-4" fill="currentColor" style={{ color: "var(--favourite)" }} /> : <ArrowUpDown className="h-4 w-4" />}
              {favouriteSort ? "Favourites first" : "Sort"}
            </Button>
            <Button
              onClick={() => { setEditing(null); setModalOpen(true); }}
              className="rounded-xl gap-1.5"
            >
              <Plus className="h-4 w-4" /> Add link
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <FilterBar filters={filters} onChange={setFilters} />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-soft px-8 py-6">
        {collectionLinks.length === 0 ? (
          filtersActive ? (
            <div className="mx-auto max-w-md py-16 text-center">
              <h3 className="text-sm font-semibold">No links match these filters</h3>
              <p className="mt-1 text-sm text-muted-foreground">Try clearing some to see more.</p>
            </div>
          ) : (
            <EmptyState onAdd={() => { setEditing(null); setModalOpen(true); }} />
          )
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={collectionLinks.map((l) => l.id)} strategy={verticalListSortingStrategy}>
              <ul className="mx-auto max-w-3xl space-y-2.5">
                {collectionLinks.map((l) => (
                  <li key={l.id}>
                    <LinkCard
                      link={l}
                      draggable={draggable}
                      onEdit={() => { setEditing(l); setModalOpen(true); }}
                      onDelete={() => setDelTarget(l)}
                    />
                  </li>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <LinkModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        collectionId={collection.id}
        editing={editing}
      />

      <ConfirmDialog
        open={!!delTarget}
        onOpenChange={(v) => !v && setDelTarget(null)}
        title="Delete this link?"
        description={delTarget?.title ? `"${delTarget.title}" will be removed from this collection.` : ""}
        onConfirm={() => { if (delTarget) deleteLink(delTarget.id); setDelTarget(null); }}
      />
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <Bookmark className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-lg font-semibold">Nothing here yet</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Save your first link to this collection — paste any URL and we'll do the rest.
      </p>
      <Button onClick={onAdd} className="mt-5 rounded-xl gap-1.5">
        <Plus className="h-4 w-4" /> Add your first link
      </Button>
    </div>
  );
}
