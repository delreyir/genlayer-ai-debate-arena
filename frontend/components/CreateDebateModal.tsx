"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useCreateDebate } from "@/lib/hooks/useDebates";
import { useWallet } from "@/lib/genlayer/wallet";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

export function CreateDebateModal() {
  const { isConnected } = useWallet();
  const { createDebateAsync, isPending } = useCreateDebate();

  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [stance, setStance] = useState<"FOR" | "AGAINST">("FOR");
  const [argument, setArgument] = useState("");
  const [stake, setStake] = useState("");

  const reset = () => {
    setTopic("");
    setStance("FOR");
    setArgument("");
    setStake("");
  };

  const canSubmit = topic.trim() && argument.trim() && isConnected && !isPending;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      await createDebateAsync({ topic: topic.trim(), stance, argument: argument.trim(), stakeGen: stake });
      reset();
      setOpen(false);
    } catch {
      /* errors surfaced via toast */
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient">
          <Plus className="w-4 h-4 mr-2" />
          New Debate
        </Button>
      </DialogTrigger>
      <DialogContent className="brand-card border-2 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Start a Debate</DialogTitle>
          <DialogDescription>
            State your position and stake GEN. A challenger argues the other side, then
            GenLayer&apos;s AI validators judge the winner by consensus.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              placeholder="e.g. Remote work is better than office work"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Your stance</Label>
            <div className="flex gap-2">
              {(["FOR", "AGAINST"] as const).map((s) => (
                <Button
                  key={s}
                  type="button"
                  variant={stance === s ? "gradient" : "outline"}
                  className="flex-1"
                  onClick={() => setStance(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="argument">Your argument</Label>
            <textarea
              id="argument"
              rows={5}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Make your strongest case..."
              value={argument}
              onChange={(e) => setArgument(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stake">Stake (GEN, optional)</Label>
            <Input
              id="stake"
              type="number"
              min="0"
              step="0.0001"
              placeholder="0"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The challenger must match this stake. Winner takes the whole pot.
            </p>
          </div>

          {!isConnected && (
            <p className="text-xs text-yellow-500">Connect your wallet to create a debate.</p>
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
                Creating...
              </>
            ) : (
              "Create Debate"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
