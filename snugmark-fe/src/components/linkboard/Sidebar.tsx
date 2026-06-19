import { useMemo, useState } from "react";
import { useStore, type Collection } from "@/lib/linkboard-store";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Bookmark,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  FolderPlus,
  Lock,
  Unlock,
  LockOpen,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "./ConfirmDialog";
import { PasswordDialog } from "./PasswordDialog";

export function Sidebar() {
  const { collections, selectedCollectionId, view, goHome, addCollection, reorderCollections } =
    useStore();
  const [addingRoot, setAddingRoot] = useState(false);
  const [newName, setNewName] = useState("");

  const topLevel = useMemo(
    () => collections.filter((c) => c.parentId === null).sort((a, b) => a.order - b.order),
    [collections],
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = topLevel.findIndex((c) => c.id === active.id);
    const newIndex = topLevel.findIndex((c) => c.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(topLevel, oldIndex, newIndex).map((c, i) => ({ ...c, order: i }));
    const others = collections.filter((c) => c.parentId !== null);
    reorderCollections([...reordered, ...others]);
  };

  const commitAdd = () => {
    if (newName.trim()) addCollection(newName.trim(), null);
    setNewName("");
    setAddingRoot(false);
  };

  return (
    <aside className="flex h-full w-72 flex-col border-r bg-sidebar">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Bookmark className="h-4 w-4" />
        </div>
        <span className="text-lg font-semibold tracking-tight">Linkboard</span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-soft px-2.5 pb-3">
        <button
          onClick={goHome}
          className={`mb-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
            view === "home"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-foreground hover:bg-sidebar-accent/60"
          }`}
        >
          <Home className="h-4 w-4" /> Home
        </button>

        <p className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Collections
        </p>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={topLevel.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-0.5">
              {topLevel.map((c) => (
                <CollectionRow key={c.id} collection={c} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>

        {addingRoot ? (
          <div className="mt-2 px-2">
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={commitAdd}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitAdd();
                if (e.key === "Escape") {
                  setNewName("");
                  setAddingRoot(false);
                }
              }}
              placeholder="Collection name"
              className="h-9 rounded-lg"
            />
          </div>
        ) : (
          <button
            onClick={() => setAddingRoot(true)}
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Plus className="h-4 w-4" /> Add collection
          </button>
        )}
      </div>

      <div className="border-t px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-semibold">
            S
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">Sam</p>
            <p className="truncate text-xs text-muted-foreground">sam@linkboard.app</p>
          </div>
        </div>
      </div>

      {/* selected used so it re-renders on selection */}
      <span className="sr-only">{selectedCollectionId}</span>
    </aside>
  );
}

function CollectionRow({ collection }: { collection: Collection }) {
  const {
    collections,
    selectedCollectionId,
    setSelectedCollectionId,
    addCollection,
    renameCollection,
    deleteCollection,
    lockCollection,
    removeLock,
    unlockCollection,
    isUnlocked,
  } = useStore();

  const children = useMemo(
    () => collections.filter((c) => c.parentId === collection.id).sort((a, b) => a.order - b.order),
    [collections, collection.id],
  );

  const [open, setOpen] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(collection.name);
  const [confirmDel, setConfirmDel] = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const [childName, setChildName] = useState("");
  const [lockDialog, setLockDialog] = useState<null | "lock" | "unlock" | "remove">(null);
  const isTop = collection.parentId === null;
  const locked = !!collection.locked;
  const unlocked = isUnlocked(collection.id);
  const isHidden = locked && !unlocked;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: collection.id,
    disabled: !isTop,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isActive = selectedCollectionId === collection.id;

  return (
    <li ref={setNodeRef} style={style}>
      <div
        className={`group flex items-center gap-1 rounded-xl pl-1 pr-1.5 ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60"}`}
      >
        {isTop ? (
          isHidden ? (
            <button
              onClick={() => setLockDialog("unlock")}
              className="flex h-7 w-5 items-center justify-center text-muted-foreground"
              aria-label="Unlock"
            >
              <Lock className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex h-7 w-5 items-center justify-center text-muted-foreground"
              aria-label="Toggle"
            >
              <ChevronRight
                className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`}
              />
            </button>
          )
        ) : (
          <span className="w-5" />
        )}

        {renaming ? (
          <Input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={() => {
              renameCollection(collection.id, nameDraft.trim() || collection.name);
              setRenaming(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                renameCollection(collection.id, nameDraft.trim() || collection.name);
                setRenaming(false);
              }
              if (e.key === "Escape") {
                setNameDraft(collection.name);
                setRenaming(false);
              }
            }}
            className="h-7 flex-1 rounded-md"
          />
        ) : (
          <button
            onClick={() => {
              if (isHidden) {
                setLockDialog("unlock");
                return;
              }
              setSelectedCollectionId(collection.id);
            }}
            {...(isTop && !isHidden ? attributes : {})}
            {...(isTop && !isHidden ? listeners : {})}
            className="flex flex-1 items-center gap-1.5 py-1.5 text-left text-sm font-medium truncate"
          >
            <span className="truncate">{collection.name}</span>
            {locked && unlocked && <LockOpen className="h-3 w-3 text-muted-foreground shrink-0" />}
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 hover:bg-sidebar-accent group-hover:opacity-100"
              aria-label="Actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            {isTop && !isHidden && (
              <DropdownMenuItem
                onClick={() => {
                  setAddingChild(true);
                  setOpen(true);
                }}
              >
                <FolderPlus className="mr-2 h-4 w-4" /> Add sub-collection
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => {
                setNameDraft(collection.name);
                setRenaming(true);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" /> Rename
            </DropdownMenuItem>
            {isTop && !locked && (
              <DropdownMenuItem onClick={() => setLockDialog("lock")}>
                <Lock className="mr-2 h-4 w-4" /> Lock collection
              </DropdownMenuItem>
            )}
            {isTop && locked && (
              <DropdownMenuItem onClick={() => setLockDialog("remove")}>
                <Unlock className="mr-2 h-4 w-4" /> Remove lock
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => setConfirmDel(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isTop && open && !isHidden && (
        <ul className="ml-5 mt-0.5 space-y-0.5 border-l pl-2">
          {children.map((c) => (
            <CollectionRow key={c.id} collection={c} />
          ))}
          {addingChild ? (
            <li>
              <Input
                autoFocus
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                onBlur={() => {
                  if (childName.trim()) addCollection(childName.trim(), collection.id);
                  setChildName("");
                  setAddingChild(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (childName.trim()) addCollection(childName.trim(), collection.id);
                    setChildName("");
                    setAddingChild(false);
                  }
                  if (e.key === "Escape") {
                    setChildName("");
                    setAddingChild(false);
                  }
                }}
                placeholder="Sub-collection name"
                className="h-7 rounded-md text-sm"
              />
            </li>
          ) : (
            <li>
              <button
                onClick={() => setAddingChild(true)}
                className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3 w-3" /> Add sub-collection
              </button>
            </li>
          )}
        </ul>
      )}

      <ConfirmDialog
        open={confirmDel}
        onOpenChange={setConfirmDel}
        title={`Delete "${collection.name}"?`}
        description={
          children.length > 0
            ? `This will also delete ${children.length} sub-collection${children.length === 1 ? "" : "s"} and all their links. This cannot be undone.`
            : "All links inside will be deleted. This cannot be undone."
        }
        onConfirm={() => deleteCollection(collection.id)}
      />

      <PasswordDialog
        open={lockDialog !== null}
        onOpenChange={(v) => {
          if (!v) setLockDialog(null);
        }}
        title={
          lockDialog === "lock"
            ? `Lock "${collection.name}"?`
            : lockDialog === "remove"
              ? `Remove lock from "${collection.name}"?`
              : `Unlock "${collection.name}"`
        }
        description={
          lockDialog === "lock"
            ? "Your account password will be required to view this collection."
            : lockDialog === "remove"
              ? "Confirm your password to remove the lock."
              : "Enter your account password to view this collection."
        }
        confirmLabel={
          lockDialog === "lock" ? "Lock" : lockDialog === "remove" ? "Remove lock" : "Unlock"
        }
        onSubmit={async (pw) => {
          let ok = false;
          if (lockDialog === "lock") ok = await lockCollection(collection.id, pw);
          else if (lockDialog === "remove") ok = await removeLock(collection.id, pw);
          else if (lockDialog === "unlock") ok = await unlockCollection(collection.id, pw);
          if (ok) setLockDialog(null);
          return ok;
        }}
      />
    </li>
  );
}
