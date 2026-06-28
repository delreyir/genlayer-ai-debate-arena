"use client";

import { Gavel, Loader2, Trophy, Scale } from "lucide-react";
import { formatEther } from "viem";
import { useJudgeDebate } from "@/lib/hooks/useDebates";
import { useWallet } from "@/lib/genlayer/wallet";
import type { Debate } from "@/lib/contracts/types";
import { ZERO_ADDRESS } from "@/lib/contracts/types";
import { AddressDisplay } from "./AddressDisplay";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { JoinDebateModal } from "./JoinDebateModal";

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "JUDGED") return "default";
  if (status === "READY") return "secondary";
  return "outline";
}

function Side({
  label,
  stance,
  address,
  argument,
  score,
  judged,
  isWinner,
}: {
  label: string;
  stance: string;
  address: string;
  argument: string;
  score: number;
  judged: boolean;
  isWinner: boolean;
}) {
  return (
    <div
      className={`flex-1 rounded-lg border p-4 space-y-2 ${
        isWinner ? "border-accent bg-accent/10" : "border-white/10 bg-white/5"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold flex items-center gap-1">
          {label}
          {isWinner && <Trophy className="w-4 h-4 text-accent" />}
        </span>
        <Badge variant="outline">{stance}</Badge>
      </div>
      {address && address !== ZERO_ADDRESS ? (
        <AddressDisplay address={address} maxLength={12} />
      ) : (
        <span className="text-xs text-muted-foreground">Waiting for challenger…</span>
      )}
      <p className="text-sm text-foreground/90 whitespace-pre-wrap">{argument || "—"}</p>
      {judged && (
        <p className="text-xs text-muted-foreground">
          Score: <span className="text-accent font-semibold">{score}</span>/100
        </p>
      )}
    </div>
  );
}

export function DebateCard({ debate }: { debate: Debate }) {
  const { address } = useWallet();
  const { judgeDebate, isPending } = useJudgeDebate();

  const judged = debate.status === "JUDGED";
  const me = (address || "").toLowerCase();
  const isCreator = me && debate.creator.toLowerCase() === me;
  const tie = judged && (!debate.winner || debate.winner === ZERO_ADDRESS);
  const creatorWon = judged && !tie && debate.winner.toLowerCase() === debate.creator.toLowerCase();
  const opponentWon = judged && !tie && debate.winner.toLowerCase() === debate.opponent.toLowerCase();

  const pot = formatEther(BigInt(debate.pot || "0"));

  return (
    <div className="brand-card p-5 space-y-4 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold leading-snug">{debate.topic}</h3>
        <Badge variant={statusVariant(debate.status)}>{debate.status}</Badge>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <Side
          label="Debater 1"
          stance={debate.creator_stance}
          address={debate.creator}
          argument={debate.creator_argument}
          score={debate.creator_score}
          judged={judged}
          isWinner={creatorWon}
        />
        <Side
          label="Debater 2"
          stance={debate.opponent_stance}
          address={debate.opponent}
          argument={debate.opponent_argument}
          score={debate.opponent_score}
          judged={judged}
          isWinner={opponentWon}
        />
      </div>

      {judged && (
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {tie ? <Scale className="w-4 h-4 text-accent" /> : <Trophy className="w-4 h-4 text-accent" />}
            {tie ? "Tie — stakes refunded" : "Winner decided by AI consensus"}
          </div>
          {debate.verdict && (
            <p className="text-sm text-muted-foreground italic">“{debate.verdict}”</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-muted-foreground">
          Pot: <span className="text-accent font-semibold">{pot} GEN</span>
        </span>

        {debate.status === "OPEN" && !isCreator && <JoinDebateModal debate={debate} />}
        {debate.status === "OPEN" && isCreator && (
          <span className="text-xs text-muted-foreground">Waiting for a challenger…</span>
        )}
        {debate.status === "READY" && (
          <Button variant="gradient" size="sm" disabled={isPending} onClick={() => judgeDebate(debate.id)}>
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Judging…
              </>
            ) : (
              <>
                <Gavel className="w-4 h-4 mr-2" />
                Judge with AI
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
