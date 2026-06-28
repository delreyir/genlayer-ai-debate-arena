# 🏛️ AI Debate Arena — on GenLayer

A decentralized debate platform where the **judge is a decentralized panel of AI validators**.

Two debaters stake GEN and submit written arguments on a topic. A panel of [GenLayer](https://genlayer.com)
validators — each running an LLM — independently evaluate which argument is stronger and reach **consensus on the
verdict through the Equivalence Principle**. The winner takes the whole pot. No oracle, no human referee, no
centralized moderator.

This is something a traditional smart contract simply cannot do: the outcome is a **subjective judgment** over
natural-language input. That judgment is exactly what GenLayer's Intelligent Contracts make trustless and on-chain.

> Built on GenLayer Testnet **Bradbury**.

## 🔴 Live demo

- **App:** https://genlayer-ai-debate-arena-frontend.vercel.app
- **Contract (GenLayer Studionet):** `0x2a7E3d047fBeC5D4DE75665464A4fEcCF66b2453`

> The hosted demo currently runs against GenLayer **Studionet** (instant, built-in faucet, real LLMs). For the persistent **Bradbury** deployment, follow [Deploy to Bradbury](#2-deploy-to-bradbury).

---

## Why GenLayer is central

The core of the app — deciding who won a debate — is a non-deterministic, subjective decision executed *inside the
contract*:

```python
verdict_json = gl.eq_principle.prompt_comparative(
    judge_fn,                       # each validator runs an LLM to score both arguments
    principle="The 'winner' field must be identical ...",
)
```

Validators may phrase their reasoning differently, but consensus requires them to **agree on the declared winner**.
Remove GenLayer and there is no app — there is no other way to put an impartial, AI-driven verdict on-chain without a
trusted third party.

---

## How it works

1. **Open a debate** — `create_debate(topic, stance, argument)` *(payable)*. Any GEN sent becomes the stake.
2. **A challenger joins** — `join_debate(debate_id, argument)` *(payable)*. Must match the stake and argues the
   opposite stance.
3. **AI consensus judges** — `judge_debate(debate_id)` runs the LLM equivalence-principle block. The winner is paid the
   pot (`gl.chain.Account(winner).emit_transfer(pot)`); a tie refunds both stakes. Wins are recorded on an on-chain
   leaderboard.

Debate lifecycle: `OPEN → READY → JUDGED`.

### Contract API (`contracts/debate_arena.py`)

| Method | Type | Description |
|---|---|---|
| `create_debate(topic, stance, argument)` | write · payable | Open a debate, stake = sent value |
| `join_debate(debate_id, argument)` | write · payable | Join as opponent, must match stake |
| `judge_debate(debate_id)` | write | Run AI-validator consensus, pay the winner |
| `get_debates()` | view | All debates |
| `get_debate(debate_id)` | view | A single debate |
| `get_leaderboard()` | view | `{address: wins}` |
| `get_player_wins(address)` | view | Wins for one player |

---

## Tech stack

- **Intelligent Contract:** Python (GenLayer SDK, GenVM)
- **Frontend:** Next.js 16 · React 19 · TypeScript · Tailwind CSS · TanStack Query · `genlayer-js` · MetaMask
- **Tooling:** `genvm-linter`, `genlayer-test` (direct + integration), GenLayer CLI

---

## Project structure

```
contracts/            debate_arena.py        # the Intelligent Contract
deploy/               deployScript.ts        # deploy via genlayer-js
tests/
  direct/             test_debate_arena.py   # fast in-memory tests (LLM/web mocked)
  integration/        test_debate_arena.py   # full tests against a live network
frontend/             Next.js app (lib/genlayer, lib/contracts, lib/hooks, components)
gltest.config.yaml    network config (localnet / studionet / asimov / bradbury)
```

---

## Getting started

### 1. Contract: lint & test

Requires **Python 3.12+**.

```bash
python -m venv .venv
.venv/Scripts/activate            # Windows
# source .venv/bin/activate       # macOS/Linux
pip install -r requirements.txt pytest

genvm-lint check contracts/debate_arena.py
pytest tests/direct/ -v
```

> **Windows note:** run with `PYTHONUTF8=1` so the linter's ✓ output doesn't crash the console.

### 2. Deploy to Bradbury

```bash
npm install
genlayer network        # select testnet_bradbury
genlayer deploy         # deploys contracts/debate_arena.py
```

Copy the deployed contract address into `frontend/.env`.

### 3. Frontend

```bash
cp frontend/.env.example frontend/.env   # set NEXT_PUBLIC_CONTRACT_ADDRESS
cd frontend
npm run dev                              # http://localhost:3000
```

Connect MetaMask (it will prompt to add the GenLayer Bradbury network), then create, join, and judge debates.

---

## Network — Testnet Bradbury

| Setting | Value |
|---|---|
| GenLayer RPC | `https://rpc-bradbury.genlayer.com` |
| Chain ID | `4221` |
| Currency | `GEN` |
| Explorer | https://explorer-bradbury.genlayer.com |
| Faucet | https://testnet-faucet.genlayer.foundation |

---

## Security notes

- **Prompt injection:** debate arguments are untrusted user input. The judge prompt explicitly instructs the model to
  treat them as data and ignore embedded instructions. Adversarial inputs remain an inherent risk of LLM-based judging.
- **No off-chain trust:** judging happens inside the contract via validator consensus; the frontend only reads/writes
  state and never decides outcomes.
- **Value handling:** payouts are guarded (`pot > 0`) and use `emit_transfer` on finalization.

---

## Verification status

- ✅ `genvm-lint` passes (0 warnings) — `DebateArena`, 7 methods (4 view, 3 write).
- ✅ `pytest tests/direct/` — 16 tests passing (create / join / judge / leaderboard / reverts, LLM mocked).
- ✅ Frontend `tsc --noEmit` and `next build` pass.
- ⏳ On-chain value-transfer payout is exercised on a live network (Bradbury); direct tests cover the judging logic with
  zero-stake debates.

---

## License

MIT
