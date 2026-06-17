import type { Tag } from "@/lib/linkboard-store";
import { X } from "lucide-react";

export function TagPill({
  tag,
  onRemove,
  onClick,
  className = "",
}: {
  tag: Tag;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
}) {
  const bg = `var(--tag-${tag.colorIndex}-bg)`;
  const fg = `var(--tag-${tag.colorIndex}-fg)`;
  return (
    <span
      onClick={onClick}
      style={{ backgroundColor: bg, color: fg }}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-0.5 rounded-full p-0.5 hover:bg-black/5"
          aria-label={`Remove ${tag.name}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
