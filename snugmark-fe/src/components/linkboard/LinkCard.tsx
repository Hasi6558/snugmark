import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { useStore, type Link } from "@/lib/linkboard-store";
import { TagPill } from "./TagPill";
import { MoveLinkDialog } from "./MoveLinkDialog";
import { Heart, Pencil, Trash2, GripVertical, FolderInput, Circle, CheckCircle2 } from "lucide-react";

export function LinkCard({
  link, onEdit, onDelete, draggable = true,
}: {
  link: Link;
  onEdit: () => void;
  onDelete: () => void;
  draggable?: boolean;
}) {
  const { tags, collections, toggleFavourite, toggleRead, recordVisit, moveLink } = useStore();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: link.id, disabled: !draggable });

  const [moveOpen, setMoveOpen] = useState(false);
  const [exiting, setExiting] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : exiting ? 0 : 1,
  };

  const linkTags = link.tagIds
    .map((id) => tags.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 rounded-2xl border bg-card px-4 py-3.5 transition-all duration-200 hover:border-ring/40 hover:shadow-[0_2px_12px_rgb(0_0_0_/_0.03)] ${
        exiting ? "scale-95" : ""
      } ${link.isRead ? "" : "ring-1 ring-primary/10"}`}
    >
      {draggable ? (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-muted-foreground/40 opacity-0 hover:text-muted-foreground group-hover:opacity-100 active:cursor-grabbing"
          aria-label="Drag"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      ) : (
        <span className="w-4" />
      )}

      <a
        href={link.url} target="_blank" rel="noreferrer"
        onClick={() => recordVisit(link.id)}
        className="flex flex-1 items-center gap-3 min-w-0"
      >
        <img
          src={link.favicon} alt=""
          className="h-7 w-7 flex-shrink-0 rounded-md bg-muted object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.visibility = "hidden"; }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="truncate font-semibold text-foreground">{link.title}</h3>
            {!link.isRead && (
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary" aria-label="Unread" />
            )}
            {linkTags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {linkTags.map((t) => <TagPill key={t.id} tag={t} />)}
              </div>
            )}
          </div>
          {link.description && (
            <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
              {link.description}
            </p>
          )}
        </div>
      </a>

      <div className="flex items-center gap-0.5">
        <IconBtn
          label={link.isRead ? "Mark unread" : "Mark read"}
          onClick={() => toggleRead(link.id)}
        >
          {link.isRead
            ? <CheckCircle2 className="h-4 w-4" />
            : <Circle className="h-4 w-4" />}
        </IconBtn>
        <IconBtn
          label="Favourite"
          onClick={() => toggleFavourite(link.id)}
          active={link.isFavourite}
        >
          <Heart
            className="h-4 w-4"
            fill={link.isFavourite ? "currentColor" : "none"}
            style={link.isFavourite ? { color: "var(--favourite)" } : undefined}
          />
        </IconBtn>
        <IconBtn label="Move" onClick={() => setMoveOpen(true)}>
          <FolderInput className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="Edit" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="Delete" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </IconBtn>
      </div>

      <MoveLinkDialog
        open={moveOpen}
        onOpenChange={setMoveOpen}
        currentCollectionId={link.collectionId}
        onMove={(targetId) => {
          const target = collections.find((c) => c.id === targetId);
          setMoveOpen(false);
          setExiting(true);
          setTimeout(() => {
            moveLink(link.id, targetId);
            toast.success(`Moved to "${target?.name ?? "collection"}"`);
          }, 180);
        }}
      />
    </div>
  );
}

function IconBtn({
  children, onClick, label, active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-accent-foreground ${active ? "text-foreground" : ""}`}
    >
      {children}
    </button>
  );
}
