"use client";

import { Loader2, MessagesSquare } from "lucide-react";
import { useDebates } from "@/lib/hooks/useDebates";
import { DebateCard } from "./DebateCard";

export function DebatesList() {
  const { data: debates, isLoading, isError } = useDebates();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-6 h-6 mr-2 animate-spin" />
        Loading debates…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="brand-card p-8 text-center text-muted-foreground">
        Could not load debates. Make sure the contract address is configured and the
        network is reachable.
      </div>
    );
  }

  if (!debates || debates.length === 0) {
    return (
      <div className="brand-card p-10 text-center space-y-3">
        <MessagesSquare className="w-10 h-10 mx-auto text-accent" />
        <h3 className="text-xl font-bold">No debates yet</h3>
        <p className="text-sm text-muted-foreground">
          Be the first to open a debate and challenge the arena.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {debates.map((debate) => (
        <DebateCard key={debate.id} debate={debate} />
      ))}
    </div>
  );
}
