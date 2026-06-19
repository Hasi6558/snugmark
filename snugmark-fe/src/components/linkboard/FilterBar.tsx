import { useStore, type Tag } from "@/lib/linkboard-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { TagPill } from "./TagPill";
import { Heart, Tag as TagIcon, FolderTree, X, BookOpen } from "lucide-react";

export type Filters = {
  tagIds: string[];
  collectionId: string | null;
  favouriteOnly: boolean;
  readState: "all" | "read" | "unread";
};

export const emptyFilters: Filters = {
  tagIds: [],
  collectionId: null,
  favouriteOnly: false,
  readState: "all",
};

export function isFiltersActive(f: Filters) {
  return f.tagIds.length > 0 || f.collectionId !== null || f.favouriteOnly || f.readState !== "all";
}

export function FilterBar({
  filters,
  onChange,
  showCollection = false,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  showCollection?: boolean;
}) {
  const { tags, collections } = useStore();
  const active = isFiltersActive(filters);

  const selectedTags = filters.tagIds
    .map((id) => tags.find((t) => t.id === id))
    .filter((t): t is Tag => Boolean(t));
  const selectedCollection = collections.find((c) => c.id === filters.collectionId);

  const toggleTag = (id: string) => {
    onChange({
      ...filters,
      tagIds: filters.tagIds.includes(id)
        ? filters.tagIds.filter((t) => t !== id)
        : [...filters.tagIds, id],
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
              <TagIcon className="h-3.5 w-3.5" />
              Tag
              {filters.tagIds.length > 0 && (
                <span className="ml-0.5 rounded-full bg-accent px-1.5 text-xs text-accent-foreground">
                  {filters.tagIds.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="rounded-xl w-56">
            <DropdownMenuLabel>Filter by tag</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {tags.length === 0 && (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">No tags yet.</p>
            )}
            {tags.map((t) => (
              <DropdownMenuCheckboxItem
                key={t.id}
                checked={filters.tagIds.includes(t.id)}
                onCheckedChange={() => toggleTag(t.id)}
                onSelect={(e) => e.preventDefault()}
              >
                <TagPill tag={t} />
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {showCollection && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
                <FolderTree className="h-3.5 w-3.5" />
                {selectedCollection ? selectedCollection.name : "Collection"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="rounded-xl max-h-72 overflow-auto">
              <DropdownMenuRadioGroup
                value={filters.collectionId ?? "__all"}
                onValueChange={(v) =>
                  onChange({ ...filters, collectionId: v === "__all" ? null : v })
                }
              >
                <DropdownMenuRadioItem value="__all">All collections</DropdownMenuRadioItem>
                <DropdownMenuSeparator />
                {collections.map((c) => (
                  <DropdownMenuRadioItem key={c.id} value={c.id}>
                    {c.parentId ? "↳ " : ""}
                    {c.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button
          variant={filters.favouriteOnly ? "default" : "outline"}
          size="sm"
          className="rounded-xl gap-1.5"
          onClick={() => onChange({ ...filters, favouriteOnly: !filters.favouriteOnly })}
        >
          <Heart className="h-3.5 w-3.5" fill={filters.favouriteOnly ? "currentColor" : "none"} />
          Favourite
        </Button>

        <div className="inline-flex items-center rounded-xl border bg-card p-0.5">
          <BookOpen className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
          {(["all", "unread", "read"] as const).map((s) => (
            <button
              key={s}
              onClick={() => onChange({ ...filters, readState: s })}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize ${
                filters.readState === s
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {active && (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl text-muted-foreground"
            onClick={() => onChange(emptyFilters)}
          >
            Clear all
          </Button>
        )}
      </div>

      {active && (
        <div className="flex flex-wrap items-center gap-1.5">
          {selectedTags.map((t) => (
            <Chip key={t.id} onRemove={() => toggleTag(t.id)}>
              <TagPill tag={t} />
            </Chip>
          ))}
          {selectedCollection && (
            <Chip onRemove={() => onChange({ ...filters, collectionId: null })}>
              <FolderTree className="h-3 w-3" /> {selectedCollection.name}
            </Chip>
          )}
          {filters.favouriteOnly && (
            <Chip onRemove={() => onChange({ ...filters, favouriteOnly: false })}>
              <Heart className="h-3 w-3" fill="currentColor" /> Favourites
            </Chip>
          )}
          {filters.readState !== "all" && (
            <Chip onRemove={() => onChange({ ...filters, readState: "all" })}>
              <BookOpen className="h-3 w-3" /> {filters.readState}
            </Chip>
          )}
        </div>
      )}
    </div>
  );
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border bg-card px-2 py-0.5 text-xs text-foreground">
      {children}
      <button
        onClick={onRemove}
        aria-label="Remove filter"
        className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

export function applyFilters(
  links: import("@/lib/linkboard-store").Link[],
  filters: Filters,
  query: string,
  hiddenCollectionIds: Set<string>,
  tags: import("@/lib/linkboard-store").Tag[],
) {
  const q = query.trim().toLowerCase();
  return links.filter((l) => {
    if (hiddenCollectionIds.has(l.collectionId)) return false;
    if (filters.favouriteOnly && !l.isFavourite) return false;
    if (filters.readState === "read" && !l.isRead) return false;
    if (filters.readState === "unread" && l.isRead) return false;
    if (filters.collectionId && l.collectionId !== filters.collectionId) return false;
    if (filters.tagIds.length && !filters.tagIds.every((id) => l.tagIds.includes(id))) return false;
    if (q) {
      const tagNames = l.tagIds.map((id) => tags.find((t) => t.id === id)?.name ?? "").join(" ");
      const hay = `${l.title} ${l.description} ${l.url} ${tagNames}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
