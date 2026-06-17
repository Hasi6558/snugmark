import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bookmark } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — Linkboard" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("linkboard.auth", JSON.stringify({ email, name }));
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
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">A calm home for your links.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name" required value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sam" className="rounded-xl"
            />
          </div>
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
              placeholder="At least 8 characters" className="rounded-xl"
            />
          </div>
          <Button type="submit" className="w-full rounded-xl">Create account</Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
