import { createClient } from "genlayer-js";
import { genlayerChain } from "../genlayer/client";
import type { Debate, LeaderboardEntry, TransactionReceipt } from "./types";
import {
  estimateWriteFeePreset,
  feePresetToTransactionFees,
  type FeePresetEstimate,
  type FeePresetLevel,
} from "../genlayer/fees";

/** Recursively convert genlayer-js Map results into plain objects. */
function decode(value: any): any {
  if (value instanceof Map) {
    const obj: Record<string, any> = {};
    for (const [k, v] of value.entries()) obj[k] = decode(v);
    return obj;
  }
  if (Array.isArray(value)) return value.map(decode);
  return value;
}

function toDebate(id: string, raw: any): Debate {
  const d = decode(raw) as Record<string, any>;
  return {
    id: String(d.id ?? id),
    topic: d.topic ?? "",
    status: d.status ?? "OPEN",
    creator: d.creator ?? "",
    opponent: d.opponent ?? "",
    creator_stance: d.creator_stance ?? "",
    opponent_stance: d.opponent_stance ?? "",
    creator_argument: d.creator_argument ?? "",
    opponent_argument: d.opponent_argument ?? "",
    stake: String(d.stake ?? "0"),
    pot: String(d.pot ?? "0"),
    winner: d.winner ?? "",
    verdict: d.verdict ?? "",
    creator_score: Number(d.creator_score ?? 0),
    opponent_score: Number(d.opponent_score ?? 0),
  };
}

/**
 * Client wrapper for the AI Debate Arena Intelligent Contract.
 */
class DebateArena {
  private contractAddress: `0x${string}`;
  private client: any;

  constructor(contractAddress: string, address?: string | null) {
    // Lowercase the address: GenLayer chains use EIP-1191 (chain-specific)
    // checksums, so an EIP-55-checksummed string can fail viem validation.
    // A lowercase address has no checksum and is accepted on any chain.
    this.contractAddress = (contractAddress || "").trim().toLowerCase() as `0x${string}`;
    const config: any = { chain: genlayerChain };
    const rpc = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL;
    if (rpc) config.endpoint = rpc;
    if (address) config.account = address as `0x${string}`;
    this.client = createClient(config);
  }

  // ----------------------------- reads ----------------------------------- //

  async getDebates(): Promise<Debate[]> {
    const result: any = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_debates",
      args: [],
    });

    const out: Debate[] = [];
    if (result instanceof Map) {
      for (const [id, raw] of result.entries()) out.push(toDebate(String(id), raw));
    } else if (result && typeof result === "object") {
      for (const [id, raw] of Object.entries(result)) out.push(toDebate(id, raw));
    }
    // newest first
    return out.sort((a, b) => Number(b.id) - Number(a.id));
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const result: any = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_leaderboard",
      args: [],
    });
    const obj = decode(result) || {};
    return Object.entries(obj)
      .map(([address, wins]) => ({ address, wins: Number(wins) }))
      .sort((a, b) => b.wins - a.wins);
  }

  async getPlayerWins(address: string | null): Promise<number> {
    if (!address) return 0;
    try {
      const wins = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_player_wins",
        args: [address],
      });
      return Number(wins) || 0;
    } catch (error) {
      console.error("Error fetching player wins:", error);
      return 0;
    }
  }

  // ----------------------------- writes ---------------------------------- //

  private async write(
    functionName: string,
    args: unknown[],
    value: bigint,
    level: FeePresetLevel = "standard"
  ): Promise<TransactionReceipt> {
    let feePreset: FeePresetEstimate | undefined;
    try {
      feePreset = await estimateWriteFeePreset(
        this.client,
        { address: this.contractAddress, functionName, args, value },
        level
      );
    } catch {
      feePreset = undefined;
    }
    const fees = feePresetToTransactionFees(feePreset);

    const txHash = await this.client.writeContract({
      address: this.contractAddress,
      functionName,
      args,
      value,
      ...(fees ? { fees } : {}),
    });

    const receipt = await this.client.waitForTransactionReceipt({
      hash: txHash,
      status: "ACCEPTED" as any,
      retries: 30,
      interval: 5000,
    });
    return receipt as TransactionReceipt;
  }

  createDebate(
    topic: string,
    stance: string,
    argument: string,
    stakeWei: bigint = BigInt(0)
  ): Promise<TransactionReceipt> {
    return this.write("create_debate", [topic, stance, argument], stakeWei);
  }

  joinDebate(
    debateId: string,
    argument: string,
    stakeWei: bigint = BigInt(0)
  ): Promise<TransactionReceipt> {
    return this.write("join_debate", [debateId, argument], stakeWei);
  }

  judgeDebate(debateId: string): Promise<TransactionReceipt> {
    return this.write("judge_debate", [debateId], BigInt(0));
  }
}

export default DebateArena;
