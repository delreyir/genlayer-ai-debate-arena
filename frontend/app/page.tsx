"use client";

import { Navbar } from "@/components/Navbar";
import { DebatesList } from "@/components/DebatesList";
import { Leaderboard } from "@/components/Leaderboard";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-20 pb-12 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              AI Debate Arena
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Stake GEN, argue your case, and let a decentralized panel of GenLayer
              AI validators decide the winner — by consensus, on-chain.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            <div className="lg:col-span-8 animate-slide-up">
              <DebatesList />
            </div>
            <div className="lg:col-span-4 animate-slide-up" style={{ animationDelay: "100ms" }}>
              <Leaderboard />
            </div>
          </div>

          <div className="mt-8 glass-card p-6 md:p-8 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <h2 className="text-2xl font-bold mb-4">How it Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="text-accent font-bold text-lg">1. Open a Debate</div>
                <p className="text-sm text-muted-foreground">
                  Pick a topic, choose your side, write your argument, and stake GEN.
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-accent font-bold text-lg">2. A Challenger Joins</div>
                <p className="text-sm text-muted-foreground">
                  An opponent matches your stake and argues the opposite side.
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-accent font-bold text-lg">3. AI Consensus Judges</div>
                <p className="text-sm text-muted-foreground">
                  GenLayer validators each run an LLM and agree on the winner via the
                  Equivalence Principle. The winner takes the pot.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 py-2">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <a href="https://genlayer.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
              Powered by GenLayer
            </a>
            <a href="https://docs.genlayer.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
              Docs
            </a>
            <a href="https://explorer-bradbury.genlayer.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
              Bradbury Explorer
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
