"""Direct-mode tests for the AI Debate Arena contract.

Run with: pytest tests/direct/ -v

These use stake=0 debates so no msg.value is required, which exercises the full
create -> join -> judge flow including the mocked LLM verdict and leaderboard.
"""

import json

from tests.direct.conftest import to_hex

CONTRACT = "contracts/debate_arena.py"


def _mock_verdict(vm, winner, score_creator=70, score_opponent=40, reason="Clearer logic."):
    """Register an LLM mock for the judge prompt."""
    vm.mock_llm(
        r".*debate judge.*",
        json.dumps(
            {
                "winner": winner,
                "score_creator": score_creator,
                "score_opponent": score_opponent,
                "reason": reason,
            }
        ),
    )


def _open_and_join(contract, vm, alice, bob, topic="AI will help humanity"):
    vm.sender = alice
    debate_id = contract.create_debate(topic, "FOR", "AI boosts productivity and science.")
    vm.sender = bob
    contract.join_debate(debate_id, "AI concentrates power and risk.")
    return debate_id


# --------------------------------------------------------------------------- #
# create_debate                                                               #
# --------------------------------------------------------------------------- #


def test_create_debate(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice

    debate_id = contract.create_debate("Is X better than Y?", "FOR", "X is faster.")
    assert debate_id == "0"

    debate = contract.get_debate("0")
    assert debate["topic"] == "Is X better than Y?"
    assert debate["status"] == "OPEN"
    assert debate["creator"] == to_hex(direct_alice)
    assert debate["creator_stance"] == "FOR"
    assert debate["opponent_stance"] == "AGAINST"
    assert debate["creator_argument"] == "X is faster."
    assert debate["opponent_argument"] == ""
    assert debate["stake"] == 0
    assert debate["pot"] == 0


def test_create_increments_ids(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice

    assert contract.create_debate("T1", "FOR", "a") == "0"
    assert contract.create_debate("T2", "AGAINST", "b") == "1"
    assert len(contract.get_debates()) == 2


def test_create_empty_topic_fails(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Topic cannot be empty"):
        contract.create_debate("   ", "FOR", "arg")


def test_create_empty_argument_fails(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Argument cannot be empty"):
        contract.create_debate("Topic", "FOR", "")


# --------------------------------------------------------------------------- #
# join_debate                                                                 #
# --------------------------------------------------------------------------- #


def test_join_debate(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT)
    debate_id = _open_and_join(contract, direct_vm, direct_alice, direct_bob)

    debate = contract.get_debate(debate_id)
    assert debate["status"] == "READY"
    assert debate["opponent"] == to_hex(direct_bob)
    assert debate["opponent_argument"] == "AI concentrates power and risk."


def test_creator_cannot_join_own_debate(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    debate_id = contract.create_debate("Topic", "FOR", "arg")
    with direct_vm.expect_revert("Creator cannot join their own debate"):
        contract.join_debate(debate_id, "counter")


def test_join_missing_debate_fails(direct_vm, direct_deploy, direct_bob):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Debate not found"):
        contract.join_debate("999", "counter")


def test_cannot_join_twice(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract = direct_deploy(CONTRACT)
    debate_id = _open_and_join(contract, direct_vm, direct_alice, direct_bob)
    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("Debate is not open to join"):
        contract.join_debate(debate_id, "late argument")


# --------------------------------------------------------------------------- #
# judge_debate                                                                #
# --------------------------------------------------------------------------- #


def test_judge_creator_wins(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT)
    debate_id = _open_and_join(contract, direct_vm, direct_alice, direct_bob)

    _mock_verdict(direct_vm, winner=1, score_creator=82, score_opponent=55)
    contract.judge_debate(debate_id)

    debate = contract.get_debate(debate_id)
    assert debate["status"] == "JUDGED"
    assert debate["winner"] == to_hex(direct_alice)
    assert debate["creator_score"] == 82
    assert debate["opponent_score"] == 55
    assert debate["verdict"] != ""
    assert contract.get_player_wins(to_hex(direct_alice)) == 1
    assert contract.get_player_wins(to_hex(direct_bob)) == 0


def test_judge_opponent_wins(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT)
    debate_id = _open_and_join(contract, direct_vm, direct_alice, direct_bob)

    _mock_verdict(direct_vm, winner=2)
    contract.judge_debate(debate_id)

    debate = contract.get_debate(debate_id)
    assert debate["winner"] == to_hex(direct_bob)
    assert contract.get_leaderboard() == {to_hex(direct_bob): 1}


def test_judge_tie_has_no_winner(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT)
    debate_id = _open_and_join(contract, direct_vm, direct_alice, direct_bob)

    _mock_verdict(direct_vm, winner=0)
    contract.judge_debate(debate_id)

    debate = contract.get_debate(debate_id)
    assert debate["status"] == "JUDGED"
    assert debate["winner"] == "0x" + "0" * 40
    assert contract.get_leaderboard() == {}


def test_cannot_judge_before_ready(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    debate_id = contract.create_debate("Topic", "FOR", "arg")
    _mock_verdict(direct_vm, winner=1)
    with direct_vm.expect_revert("Debate is not ready to be judged"):
        contract.judge_debate(debate_id)


def test_cannot_judge_twice(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT)
    debate_id = _open_and_join(contract, direct_vm, direct_alice, direct_bob)

    _mock_verdict(direct_vm, winner=1)
    contract.judge_debate(debate_id)

    with direct_vm.expect_revert("Debate is not ready to be judged"):
        contract.judge_debate(debate_id)


def test_leaderboard_accumulates_wins(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT)

    # Debate 0: alice wins
    d0 = _open_and_join(contract, direct_vm, direct_alice, direct_bob, topic="Topic A")
    _mock_verdict(direct_vm, winner=1)
    contract.judge_debate(d0)

    # Debate 1: alice wins again
    d1 = _open_and_join(contract, direct_vm, direct_alice, direct_bob, topic="Topic B")
    _mock_verdict(direct_vm, winner=1)
    contract.judge_debate(d1)

    assert contract.get_player_wins(to_hex(direct_alice)) == 2


# --------------------------------------------------------------------------- #
# views                                                                       #
# --------------------------------------------------------------------------- #


def test_empty_state(direct_deploy):
    contract = direct_deploy(CONTRACT)
    assert contract.get_debates() == {}
    assert contract.get_leaderboard() == {}


def test_get_missing_debate_fails(direct_vm, direct_deploy):
    contract = direct_deploy(CONTRACT)
    with direct_vm.expect_revert("Debate not found"):
        contract.get_debate("404")



# --------------------------------------------------------------------------- #
# consensus robustness (validator agreement is winner-only)                   #
# --------------------------------------------------------------------------- #


def test_validator_agrees_when_winner_matches(direct_vm, direct_deploy, direct_alice, direct_bob):
    """A validator whose LLM returns the same winner but DIFFERENT scores/wording
    must still agree — consensus depends only on the normalized winner."""
    contract = direct_deploy(CONTRACT)
    debate_id = _open_and_join(contract, direct_vm, direct_alice, direct_bob)

    _mock_verdict(direct_vm, winner=1, score_creator=80, score_opponent=40, reason="Leader view")
    contract.judge_debate(debate_id)

    # Validator sees the same winner with very different scores and wording.
    direct_vm.clear_mocks()
    _mock_verdict(direct_vm, winner=1, score_creator=51, score_opponent=49, reason="totally different wording")
    assert direct_vm.run_validator() is True


def test_validator_disagrees_when_winner_differs(direct_vm, direct_deploy, direct_alice, direct_bob):
    """A validator only disagrees when the declared winner itself differs."""
    contract = direct_deploy(CONTRACT)
    debate_id = _open_and_join(contract, direct_vm, direct_alice, direct_bob)

    _mock_verdict(direct_vm, winner=1)
    contract.judge_debate(debate_id)

    direct_vm.clear_mocks()
    _mock_verdict(direct_vm, winner=2)
    assert direct_vm.run_validator() is False


def test_judge_normalizes_out_of_range_scores(direct_vm, direct_deploy, direct_alice, direct_bob):
    """Out-of-range / malformed scores from the LLM are sanitized (clamped 0-100)."""
    contract = direct_deploy(CONTRACT)
    debate_id = _open_and_join(contract, direct_vm, direct_alice, direct_bob)

    _mock_verdict(direct_vm, winner=1, score_creator=999, score_opponent=-5)
    contract.judge_debate(debate_id)

    debate = contract.get_debate(debate_id)
    assert debate["creator_score"] == 100
    assert debate["opponent_score"] == 0
    assert debate["winner"] == to_hex(direct_alice)
