"use client";

import { createClient } from "genlayer-js";
import {
  localnet,
  studionet,
  testnetAsimov,
  testnetBradbury,
} from "genlayer-js/chains";
import type { GenLayerChain } from "genlayer-js/types";

// ---------------------------------------------------------------------------
// Chain selection
//
// The app targets GenLayer Testnet Bradbury by default. Override with
// NEXT_PUBLIC_GENLAYER_CHAIN = bradbury | asimov | studionet | localnet
// ---------------------------------------------------------------------------
const CHAINS: Record<string, GenLayerChain> = {
  bradbury: testnetBradbury as GenLayerChain,
  asimov: testnetAsimov as GenLayerChain,
  studionet: studionet as GenLayerChain,
  localnet: localnet as GenLayerChain,
};

// Read env vars and strip any stray whitespace/CR (e.g. introduced by CLI piping).
const ENV_CHAIN = (process.env.NEXT_PUBLIC_GENLAYER_CHAIN || "").trim();
const ENV_RPC = (process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || "").trim();
const ENV_CHAIN_ID = (process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID || "").trim();
const ENV_CHAIN_NAME = (process.env.NEXT_PUBLIC_GENLAYER_CHAIN_NAME || "").trim();
const ENV_SYMBOL = (process.env.NEXT_PUBLIC_GENLAYER_SYMBOL || "").trim();

const SELECTED = (ENV_CHAIN || "bradbury").toLowerCase();
export const genlayerChain: GenLayerChain = CHAINS[SELECTED] ?? (testnetBradbury as GenLayerChain);

// Network metadata (env overrides win, otherwise fall back to the chain object).
export const GENLAYER_CHAIN_ID = parseInt(
  ENV_CHAIN_ID || String((genlayerChain as any).id ?? 4221)
);
export const GENLAYER_CHAIN_ID_HEX = `0x${GENLAYER_CHAIN_ID.toString(16)}`;

const DEFAULT_RPC =
  (genlayerChain as any)?.rpcUrls?.default?.http?.[0] || "https://rpc-bradbury.genlayer.com";

export const GENLAYER_NETWORK = {
  chainId: GENLAYER_CHAIN_ID_HEX,
  chainName: ENV_CHAIN_NAME || "GenLayer Testnet Bradbury",
  nativeCurrency: {
    name: ENV_SYMBOL || "GEN",
    symbol: ENV_SYMBOL || "GEN",
    decimals: 18,
  },
  rpcUrls: [ENV_RPC || DEFAULT_RPC],
  blockExplorerUrls: ["https://explorer-bradbury.genlayer.com"],
};

interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export function getRpcUrl(): string {
  return ENV_RPC || DEFAULT_RPC;
}

export function getContractAddress(): string {
  return (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "").trim();
}

export function isMetaMaskInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.ethereum?.isMetaMask;
}

export function getEthereumProvider(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  return window.ethereum || null;
}

export async function requestAccounts(): Promise<string[]> {
  const provider = getEthereumProvider();
  if (!provider) throw new Error("MetaMask is not installed");
  try {
    return await provider.request({ method: "eth_requestAccounts" });
  } catch (error: any) {
    if (error.code === 4001) throw new Error("User rejected the connection request");
    throw new Error(`Failed to connect to MetaMask: ${error.message}`);
  }
}

export async function getAccounts(): Promise<string[]> {
  const provider = getEthereumProvider();
  if (!provider) return [];
  try {
    return await provider.request({ method: "eth_accounts" });
  } catch (error) {
    console.error("Error getting accounts:", error);
    return [];
  }
}

export async function getCurrentChainId(): Promise<string | null> {
  const provider = getEthereumProvider();
  if (!provider) return null;
  try {
    return await provider.request({ method: "eth_chainId" });
  } catch (error) {
    console.error("Error getting chain ID:", error);
    return null;
  }
}

export async function addGenLayerNetwork(): Promise<void> {
  const provider = getEthereumProvider();
  if (!provider) throw new Error("MetaMask is not installed");
  try {
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [GENLAYER_NETWORK],
    });
  } catch (error: any) {
    if (error.code === 4001) throw new Error("User rejected adding the network");
    throw new Error(`Failed to add GenLayer network: ${error.message}`);
  }
}

export async function switchToGenLayerNetwork(): Promise<void> {
  const provider = getEthereumProvider();
  if (!provider) throw new Error("MetaMask is not installed");
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: GENLAYER_CHAIN_ID_HEX }],
    });
  } catch (error: any) {
    if (error.code === 4902) {
      await addGenLayerNetwork();
    } else if (error.code === 4001) {
      throw new Error("User rejected switching the network");
    } else {
      throw new Error(`Failed to switch network: ${error.message}`);
    }
  }
}

export async function isOnGenLayerNetwork(): Promise<boolean> {
  const chainId = await getCurrentChainId();
  if (!chainId) return false;
  return parseInt(chainId, 16) === GENLAYER_CHAIN_ID;
}

export async function connectMetaMask(): Promise<string> {
  if (!isMetaMaskInstalled()) throw new Error("MetaMask is not installed");
  const accounts = await requestAccounts();
  if (!accounts || accounts.length === 0) throw new Error("No accounts found");
  if (!(await isOnGenLayerNetwork())) {
    await switchToGenLayerNetwork();
  }
  return accounts[0];
}

export async function switchAccount(): Promise<string> {
  const provider = getEthereumProvider();
  if (!provider) throw new Error("MetaMask is not installed");
  try {
    await provider.request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }],
    });
    const accounts = await provider.request({ method: "eth_accounts" });
    if (!accounts || accounts.length === 0) throw new Error("No account selected");
    return accounts[0];
  } catch (error: any) {
    if (error.code === 4001) throw new Error("User rejected account switch");
    if (error.code === -32002) throw new Error("Account switch request already pending");
    throw new Error(`Failed to switch account: ${error.message}`);
  }
}

/**
 * Create a GenLayer client bound to the selected chain (and account if connected).
 */
export function createGenLayerClient(address?: string) {
  const config: any = { chain: genlayerChain };
  if (ENV_RPC) config.endpoint = ENV_RPC;
  if (address) config.account = address as `0x${string}`;
  try {
    return createClient(config);
  } catch (error) {
    console.error("Error creating GenLayer client:", error);
    return createClient({ chain: genlayerChain });
  }
}

export async function getClient() {
  const accounts = await getAccounts();
  return createGenLayerClient(accounts[0]);
}
