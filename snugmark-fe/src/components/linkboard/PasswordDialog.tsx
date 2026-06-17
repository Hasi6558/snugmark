import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

export function PasswordDialog({
  open, onOpenChange, title, description, confirmLabel = "Unlock", onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  onSubmit: (password: string) => boolean | Promise<boolean>;
}) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setPw(""); setError(null); }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const ok = await onSubmit(pw);
    if (!ok) setError("Incorrect password.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Lock className="h-5 w-5" />
          </div>
          <DialogTitle className="text-center">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-center">{description}</DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="lock-password">Account password</Label>
            <Input
              id="lock-password" type="password" autoFocus required
              value={pw} onChange={(e) => setPw(e.target.value)}
              placeholder="••••••••" className="rounded-xl"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl">{confirmLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
