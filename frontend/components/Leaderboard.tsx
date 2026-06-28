"use client";

import { Trophy, Loader2 } from "lucide-react";
import { useLeaderboard } from "@/lib/hooks/useDebates";
import { AddressDisplay } from "./AddressDisplay";

export function Leaderboard() {
  const { data: entries, isLoading } = useLeaderboard();

  return (
    <div className="brand-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-accent" />
        <h2 className="text-xl font-bold">Leaderboard</h2>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Loading…
        </div>
      ) : !entries || entries.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No winners yet. Win a debate to appear here.
        </p>
      ) : (
        <ol className="space-y-2">
          {entries.map((entry, i) => (
            <li
              key={entry.address}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-6 text-center font-bold ${
                    i === 0 ? "text-accent" : "text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </span>
                <AddressDisplay address={entry.address} maxLength={14} />
              </div>
              <span className="text-sm font-semibold text-accent">
                {entry.wins} {entry.wins === 1 ? "win" : "wins"}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
