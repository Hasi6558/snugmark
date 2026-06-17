import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bookmark } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Linkboard" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("linkboard.auth", JSON.stringify({ email }));
    localStorage.setItem("linkboard.password", password);
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Bookmark className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your Linkboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email" type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password" type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" className="rounded-xl"
            />
          </div>
          <Button type="submit" className="w-full rounded-xl">Sign in</Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          No account yet?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
