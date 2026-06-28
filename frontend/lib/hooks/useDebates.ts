"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { parseEther } from "viem";
import DebateArena from "../contracts/DebateArena";
import { getContractAddress } from "../genlayer/client";
import { useWallet } from "../genlayer/wallet";
import { success, error, configError } from "../utils/toast";
import type { Debate, LeaderboardEntry } from "../contracts/types";

export function useDebateArenaContract(): DebateArena | null {
  const { address } = useWallet();
  const contractAddress = getContractAddress();

  return useMemo(() => {
    if (!contractAddress) {
      configError(
        "Setup Required",
        "Contract address not configured. Set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file."
      );
      return null;
    }
    return new DebateArena(contractAddress, address);
  }, [contractAddress, address]);
}

export function useDebates() {
  const contract = useDebateArenaContract();
  return useQuery<Debate[], Error>({
    queryKey: ["debates"],
    queryFn: () => (contract ? contract.getDebates() : Promise.resolve([])),
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract,
  });
}

export function useLeaderboard() {
  const contract = useDebateArenaContract();
  return useQuery<LeaderboardEntry[], Error>({
    queryKey: ["leaderboard"],
    queryFn: () => (contract ? contract.getLeaderboard() : Promise.resolve([])),
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract,
  });
}

export function usePlayerWins(address: string | null) {
  const contract = useDebateArenaContract();
  return useQuery<number, Error>({
    queryKey: ["playerWins", address],
    queryFn: () => (contract ? contract.getPlayerWins(address) : Promise.resolve(0)),
    enabled: !!address && !!contract,
    staleTime: 2000,
  });
}

function useInvalidateAll() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["debates"] });
    queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    queryClient.invalidateQueries({ queryKey: ["playerWins"] });
  };
}

export function useCreateDebate() {
  const contract = useDebateArenaContract();
  const { address } = useWallet();
  const invalidate = useInvalidateAll();

  const mutation = useMutation({
    mutationFn: async ({
      topic,
      stance,
      argument,
      stakeGen,
    }: {
      topic: string;
      stance: string;
      argument: string;
      stakeGen?: string;
    }) => {
      if (!contract) throw new Error("Contract not configured.");
      if (!address) throw new Error("Connect your wallet to create a debate.");
      const stakeWei = stakeGen && Number(stakeGen) > 0 ? parseEther(stakeGen) : BigInt(0);
      return contract.createDebate(topic, stance, argument, stakeWei);
    },
    onSuccess: () => {
      invalidate();
      success("Debate created!", { description: "Your debate is open for a challenger." });
    },
    onError: (err: any) =>
      error("Failed to create debate", { description: err?.message || "Please try again." }),
  });

  return { ...mutation, createDebate: mutation.mutate, createDebateAsync: mutation.mutateAsync };
}

export function useJoinDebate() {
  const contract = useDebateArenaContract();
  const { address } = useWallet();
  const invalidate = useInvalidateAll();

  const mutation = useMutation({
    mutationFn: async ({
      debateId,
      argument,
      stakeGen,
    }: {
      debateId: string;
      argument: string;
      stakeGen?: string;
    }) => {
      if (!contract) throw new Error("Contract not configured.");
      if (!address) throw new Error("Connect your wallet to join a debate.");
      const stakeWei = stakeGen && Number(stakeGen) > 0 ? parseEther(stakeGen) : BigInt(0);
      return contract.joinDebate(debateId, argument, stakeWei);
    },
    onSuccess: () => {
      invalidate();
      success("Joined debate!", { description: "Both arguments are in — time to judge." });
    },
    onError: (err: any) =>
      error("Failed to join debate", { description: err?.message || "Please try again." }),
  });

  return { ...mutation, joinDebate: mutation.mutate, joinDebateAsync: mutation.mutateAsync };
}

export function useJudgeDebate() {
  const contract = useDebateArenaContract();
  const { address } = useWallet();
  const invalidate = useInvalidateAll();

  const mutation = useMutation({
    mutationFn: async (debateId: string) => {
      if (!contract) throw new Error("Contract not configured.");
      if (!address) throw new Error("Connect your wallet to trigger judging.");
      return contract.judgeDebate(debateId);
    },
    onSuccess: () => {
      invalidate();
      success("Verdict reached!", {
        description: "GenLayer validators judged the debate by AI consensus.",
      });
    },
    onError: (err: any) =>
      error("Failed to judge debate", { description: err?.message || "Please try again." }),
  });

  return { ...mutation, judgeDebate: mutation.mutate, judgeDebateAsync: mutation.mutateAsync };
}
