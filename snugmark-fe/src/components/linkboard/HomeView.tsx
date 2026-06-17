import { useMemo, useState } from "react";
import { useStore, type Link } from "@/lib/linkboard-store";
import { LinkCard } from "./LinkCard";
import { ConfirmDialog } from "./ConfirmDialog";
import { LinkModal } from "./LinkModal";
import { FilterBar, applyFilters, emptyFilters, isFiltersActive, type Filters } from "./FilterBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Clock, TrendingUp, Inbox } from "lucide-react";

const SECTION_LIMIT = 5;

export function HomeView() {
  const { links, tags, collections, isUnlocked, deleteLink } = useStore();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [showAllVisited, setShowAllVisited] = useState(false);
  const [editing, setEditing] = useState<Link | null>(null);
  const [delTarget, setDelTarget] = useState<Link | null>(null);

  const hiddenCollectionIds = useMemo(() => {
    const set = new Set<string>();
    collections.forEach((c) => {
      if (c.locked && !isUnlocked(c.id)) {
        set.add(c.id);
        collections.forEach((cc) => { if (cc.parentId === c.id) set.add(cc.id); });
      }
    });
    return set;
  }, [collections, isUnlocked]);

  const visibleLinks = useMemo(
    () => links.filter((l) => !hiddenCollectionIds.has(l.collectionId)),
    [links, hiddenCollectionIds]
  );

  const filtered = useMemo(
    () => applyFilters(links, filters, query, hiddenCollectionIds, tags),
    [links, filters, query, hiddenCollectionIds, tags]
  );

  const showFiltered = query.trim().length > 0 || isFiltersActive(filters);

  const recent = useMemo(
    () => [...visibleLinks]
      .filter((l) => l.lastVisitedAt)
      .sort((a, b) => (b.lastVisitedAt ?? 0) - (a.lastVisitedAt ?? 0)),
    [visibleLinks]
  );
  const mostVisited = useMemo(
    () => [...visibleLinks]
      .filter((l) => l.visitCount > 0)
      .sort((a, b) => b.visitCount - a.visitCount),
    [visibleLinks]
  );

  return (
    <div className="flex h-full flex-col">
      <header className="border-b px-8 pt-6 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Jump back in or search across every collection.
        </p>

        <div className="relative mt-5">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, description, tag, or URL…"
            className="h-11 rounded-2xl pl-10 text-sm"
          />
        </div>

        <div className="mt-3">
          <FilterBar filters={filters} onChange={setFilters} showCollection />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-soft px-8 py-6">
        <div className="mx-auto max-w-3xl">
          {showFiltered ? (
            <FilteredResults
              results={filtered}
              query={query}
              onEdit={(l) => setEditing(l)}
              onDelete={(l) => setDelTarget(l)}
            />
          ) : (
            <div className="space-y-8">
              <Section
                title="Recently Viewed"
                icon={<Clock className="h-4 w-4" />}
                items={recent}
                expanded={showAllRecent}
                onToggle={() => setShowAllRecent((v) => !v)}
                emptyMessage="Links you open will appear here."
                onEdit={(l) => setEditing(l)}
                onDelete={(l) => setDelTarget(l)}
              />
              <Section
                title="Most Visited"
                icon={<TrendingUp className="h-4 w-4" />}
                items={mostVisited}
                expanded={showAllVisited}
                onToggle={() => setShowAllVisited((v) => !v)}
                emptyMessage="Your top links will show up here once you start visiting them."
                onEdit={(l) => setEditing(l)}
                onDelete={(l) => setDelTarget(l)}
              />
            </div>
          )}
        </div>
      </div>

      {editing && (
        <LinkModal
          open={!!editing}
          onOpenChange={(v) => !v && setEditing(null)}
          collectionId={editing.collectionId}
          editing={editing}
        />
      )}

      <ConfirmDialog
        open={!!delTarget}
        onOpenChange={(v) => !v && setDelTarget(null)}
        title="Delete this link?"
        description={delTarget?.title ? `"${delTarget.title}" will be removed.` : ""}
        onConfirm={() => { if (delTarget) deleteLink(delTarget.id); setDelTarget(null); }}
      />
    </div>
  );
}

function Section({
  title, icon, items, expanded, onToggle, emptyMessage, onEdit, onDelete,
}: {
  title: string;
  icon: React.ReactNode;
  items: Link[];
  expanded: boolean;
  onToggle: () => void;
  emptyMessage: string;
  onEdit: (l: Link) => void;
  onDelete: (l: Link) => void;
}) {
  const visible = expanded ? items : items.slice(0, SECTION_LIMIT);
  const hasMore = items.length > SECTION_LIMIT;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            {icon}
          </span>
          {title}
          <span className="text-xs font-normal text-muted-foreground">({items.length})</span>
        </h2>
        {hasMore && (
          <Button variant="ghost" size="sm" className="rounded-lg text-xs" onClick={onToggle}>
            {expanded ? "Show less" : `View all (${items.length})`}
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/40 px-6 py-10 text-center">
          <Inbox className="mx-auto h-5 w-5 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {visible.map((l) => (
            <li key={l.id}>
              <LinkCard
                link={l} draggable={false}
                onEdit={() => onEdit(l)}
                onDelete={() => onDelete(l)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FilteredResults({
  results, query, onEdit, onDelete,
}: {
  results: Link[];
  query: string;
  onEdit: (l: Link) => void;
  onDelete: (l: Link) => void;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          {query.trim() ? `Results for "${query.trim()}"` : "Filtered results"}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {results.length} {results.length === 1 ? "link" : "links"}
          </span>
        </h2>
      </div>
      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/40 px-6 py-14 text-center">
          <Search className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No matches</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try a different search or clear the filters.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {results.map((l) => (
            <li key={l.id}>
              <LinkCard
                link={l} draggable={false}
                onEdit={() => onEdit(l)}
                onDelete={() => onDelete(l)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
