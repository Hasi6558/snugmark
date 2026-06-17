import { useEffect, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useStore, type Link } from "@/lib/linkboard-store";
import { TagPill } from "./TagPill";
import { Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  collectionId: string;
  editing?: Link | null;
};

function mockFetchMeta(url: string): Promise<{ title: string; favicon: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        const u = new URL(url);
        const host = u.hostname.replace(/^www\./, "");
        const title = host
          .split(".")[0]
          .replace(/-/g, " ")
          .replace(/^\w/, (c) => c.toUpperCase()) +
          (u.pathname && u.pathname !== "/" ? " — " + decodeURIComponent(u.pathname.split("/").filter(Boolean).pop() || "").replace(/[-_]/g, " ") : "");
        resolve({
          title: title.trim(),
          favicon: `https://www.google.com/s2/favicons?domain=${host}&sz=64`,
        });
      } catch {
        resolve({ title: "", favicon: "" });
      }
    }, 450);
  });
}

export function LinkModal({ open, onOpenChange, collectionId, editing }: Props) {
  const { tags, addTag, addLink, updateLink } = useStore();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [favicon, setFavicon] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [fetching, setFetching] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const tagWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setUrl(editing.url);
      setTitle(editing.title);
      setDescription(editing.description);
      setFavicon(editing.favicon);
      setTagIds(editing.tagIds);
    } else {
      setUrl(""); setTitle(""); setDescription(""); setFavicon(""); setTagIds([]);
    }
    setTagInput("");
  }, [open, editing]);

  const handleFetchMeta = async () => {
    if (!url.trim()) return;
    setFetching(true);
    const meta = await mockFetchMeta(url);
    setFetching(false);
    if (!title && meta.title) setTitle(meta.title);
    if (meta.favicon) setFavicon(meta.favicon);
  };

  const selectedTags = tagIds
    .map((id) => tags.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const suggestions = tags.filter(
    (t) =>
      !tagIds.includes(t.id) &&
      t.name.toLowerCase().includes(tagInput.toLowerCase().trim())
  );

  const commitTagInput = () => {
    const name = tagInput.trim();
    if (!name) return;
    const t = addTag(name);
    if (!tagIds.includes(t.id)) setTagIds((p) => [...p, t.id]);
    setTagInput("");
  };

  const handleSave = () => {
    if (!url.trim() || !title.trim()) return;
    if (editing) {
      updateLink(editing.id, { url, title, description, favicon, tagIds });
    } else {
      addLink({
        collectionId, url, title, description,
        favicon: favicon || `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`,
        isFavourite: false, tagIds,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {editing ? "Edit link" : "Add link"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="url">URL</Label>
            <div className="relative">
              <Input
                id="url" placeholder="https://example.com" value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleFetchMeta}
                onPaste={(e) => {
                  const v = e.clipboardData.getData("text");
                  setUrl(v);
                  setTimeout(handleFetchMeta, 0);
                }}
                className="rounded-xl"
              />
              {fetching && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Auto-filled from URL" className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc" value={description} rows={3}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short note for future you"
              className="resize-none rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Tags</Label>
            <div
              ref={tagWrapRef}
              className="relative flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border bg-card px-2 py-1.5"
            >
              {selectedTags.map((t) => (
                <TagPill key={t.id} tag={t} onRemove={() =>
                  setTagIds((p) => p.filter((id) => id !== t.id))} />
              ))}
              <input
                value={tagInput}
                onChange={(e) => { setTagInput(e.target.value); setShowSuggest(true); }}
                onFocus={() => setShowSuggest(true)}
                onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); commitTagInput(); }
                  if (e.key === "Backspace" && !tagInput && tagIds.length) {
                    setTagIds((p) => p.slice(0, -1));
                  }
                }}
                placeholder={selectedTags.length ? "" : "Add tags…"}
                className="flex-1 min-w-[100px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {showSuggest && (suggestions.length > 0 || tagInput.trim()) && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-auto rounded-xl border bg-popover p-1 shadow-sm">
                  {suggestions.map((t) => (
                    <button
                      key={t.id} type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setTagIds((p) => [...p, t.id]);
                        setTagInput("");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-accent"
                    >
                      <TagPill tag={t} />
                    </button>
                  ))}
                  {tagInput.trim() && !tags.some((t) => t.name.toLowerCase() === tagInput.trim().toLowerCase()) && (
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); commitTagInput(); }}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent"
                    >
                      Create "<span className="font-medium text-foreground">{tagInput.trim()}</span>"
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="ghost" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="rounded-xl" onClick={handleSave} disabled={!url.trim() || !title.trim()}>
            {editing ? "Save changes" : "Add link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
