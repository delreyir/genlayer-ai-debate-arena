"use client";

import { useState } from "react";
import { Swords, Loader2 } from "lucide-react";
import { formatEther } from "viem";
import { useJoinDebate } from "@/lib/hooks/useDebates";
import { useWallet } from "@/lib/genlayer/wallet";
import type { Debate } from "@/lib/contracts/types";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

export function JoinDebateModal({ debate }: { debate: Debate }) {
  const { isConnected } = useWallet();
  const { joinDebateAsync, isPending } = useJoinDebate();

  const [open, setOpen] = useState(false);
  const [argument, setArgument] = useState("");

  const stakeGen = formatEther(BigInt(debate.stake || "0"));
  const canSubmit = argument.trim() && isConnected && !isPending;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      await joinDebateAsync({ debateId: debate.id, argument: argument.trim(), stakeGen });
      setArgument("");
      setOpen(false);
    } catch {
      /* errors surfaced via toast */
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient" size="sm">
          <Swords className="w-4 h-4 mr-2" />
          Accept &amp; Argue
        </Button>
      </DialogTrigger>
      <DialogContent className="brand-card border-2 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Join Debate</DialogTitle>
          <DialogDescription>{debate.topic}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="brand-card p-3 space-y-1">
            <p className="text-xs text-muted-foreground">
              Creator&apos;s stance: <span className="text-accent font-semibold">{debate.creator_stance}</span>
            </p>
            <p className="text-sm">{debate.creator_argument}</p>
          </div>

          <p className="text-sm">
            You will argue{" "}
            <span className="text-accent font-semibold">{debate.opponent_stance}</span>.
          </p>

          <div className="space-y-2">
            <Label htmlFor="counter">Your counter-argument</Label>
            <textarea
              id="counter"
              rows={5}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Rebut and make your case..."
              value={argument}
              onChange={(e) => setArgument(e.target.value)}
            />
          </div>

          <div className="brand-card p-3">
            <p className="text-sm text-muted-foreground">
              Required stake:{" "}
              <span className="text-accent font-semibold">{stakeGen} GEN</span>
            </p>
          </div>

          {!isConnected && (
            <p className="text-xs text-yellow-500">Connect your wallet to join.</p>
          )}

          <Button
            variant="gradient"
            className="w-full h-12"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              "Join & Stake"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
