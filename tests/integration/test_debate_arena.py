"""Integration tests — require a running GenLayer network (Studio / localnet / testnet).

Run with: gltest tests/integration/ -v -s
"""

import pytest
from gltest import get_contract_factory, default_account
from gltest.assertions import tx_execution_succeeded


@pytest.mark.integration
def test_debate_arena_full_flow():
    factory = get_contract_factory("DebateArena")
    contract = factory.deploy(args=[])

    # Empty initial state
    assert contract.get_debates(args=[]) == {}
    assert contract.get_leaderboard(args=[]) == {}

    # Create a debate (stake 0 so no value is required)
    create_res = contract.create_debate(
        args=["AI will benefit humanity", "FOR", "AI accelerates science and medicine."],
        wait_interval=10000,
        wait_retries=15,
    )
    assert tx_execution_succeeded(create_res)

    debates = contract.get_debates(args=[])
    assert "0" in debates
    assert debates["0"]["status"] == "OPEN"
    assert debates["0"]["creator"] == default_account.address

    # Join the debate as the opponent
    join_res = contract.join_debate(
        args=["0", "AI concentrates power and creates systemic risk."],
        wait_interval=10000,
        wait_retries=15,
    )
    assert tx_execution_succeeded(join_res)
    assert contract.get_debates(args=[])["0"]["status"] == "READY"

    # Judge the debate — real LLM consensus determines the winner
    judge_res = contract.judge_debate(args=["0"], wait_interval=15000, wait_retries=20)
    assert tx_execution_succeeded(judge_res)
    assert contract.get_debates(args=[])["0"]["status"] == "JUDGED"
