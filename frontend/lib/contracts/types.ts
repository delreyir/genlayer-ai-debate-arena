/**
 * TypeScript types for the GenLayer AI Debate Arena contract.
 */

export type DebateStatus = "OPEN" | "READY" | "JUDGED";

export interface Debate {
  id: string;
  topic: string;
  status: DebateStatus | string;
  creator: string;
  opponent: string;
  creator_stance: string;
  opponent_stance: string;
  creator_argument: string;
  opponent_argument: string;
  stake: string;
  pot: string;
  winner: string;
  verdict: string;
  creator_score: number;
  opponent_score: number;
}

export interface LeaderboardEntry {
  address: string;
  wins: number;
}

export interface TransactionReceipt {
  status: string;
  hash: string;
  blockNumber?: number;
  [key: string]: any;
}

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
