// Copyright (c) 2026 Hasindu Shehan Liyanage. All Rights Reserved.
// This code may not be copied, modified, distributed, or used in production without written permission.

import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useStore, type Collection } from "@/lib/linkboard-store";
import { FolderTree, Search, Check } from "lucide-react";

export function MoveLinkDialog({
  open, onOpenChange, currentCollectionId, onMove,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentCollectionId: string;
  onMove: (targetId: string) => void;
}) {
  const { collections } = useStore();
  const [query, setQuery] = useState("");

  const tree = useMemo(() => buildTree(collections, query.trim().toLowerCase()), [collections, query]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setQuery(""); onOpenChange(v); }}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FolderTree className="h-4 w-4" /> Move to collection
          </DialogTitle>
          <DialogDescription>Choose a destination collection.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search collections…" className="rounded-xl pl-9"
          />
        </div>

        <div className="max-h-72 overflow-y-auto scrollbar-soft -mx-2 px-2">
          {tree.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No collections match "{query}"
            </p>
          ) : (
            <ul className="space-y-0.5">
              {tree.map((node) => (
                <TreeRow
                  key={node.id} node={node}
                  currentId={currentCollectionId}
                  onPick={(id) => onMove(id)}
                />
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

type Node = Collection & { children: Node[]; depth: number };

function buildTree(collections: Collection[], q: string): Node[] {
  const byParent = new Map<string | null, Collection[]>();
  collections.forEach((c) => {
    const arr = byParent.get(c.parentId) ?? [];
    arr.push(c);
    byParent.set(c.parentId, arr);
  });
  byParent.forEach((arr) => arr.sort((a, b) => a.order - b.order));

  const build = (parent: string | null, depth: number): Node[] =>
    (byParent.get(parent) ?? []).map((c) => ({
      ...c, depth, children: build(c.id, depth + 1),
    }));

  let nodes = build(null, 0);
  if (q) {
    const flat: Node[] = [];
    const walk = (ns: Node[]) => {
      ns.forEach((n) => {
        if (n.name.toLowerCase().includes(q)) flat.push({ ...n, children: [] });
        walk(n.children);
      });
    };
    walk(nodes);
    nodes = flat;
  }
  return nodes;
}

function TreeRow({
  node, currentId, onPick,
}: {
  node: Node;
  currentId: string;
  onPick: (id: string) => void;
}) {
  const isCurrent = node.id === currentId;
  return (
    <>
      <li>
        <button
          disabled={isCurrent}
          onClick={() => onPick(node.id)}
          style={{ paddingLeft: `${0.5 + node.depth * 1.1}rem` }}
          className={`flex w-full items-center justify-between gap-2 rounded-lg py-2 pr-2 text-left text-sm transition-colors ${
            isCurrent
              ? "cursor-not-allowed bg-accent/60 text-muted-foreground"
              : "hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          <span className="truncate font-medium">{node.name}</span>
          {isCurrent && (
            <span className="inline-flex items-center gap-1 text-xs">
              <Check className="h-3 w-3" /> current
            </span>
          )}
        </button>
      </li>
      {node.children.map((c) => (
        <TreeRow key={c.id} node={c} currentId={currentId} onPick={onPick} />
      ))}
    </>
  );
}
