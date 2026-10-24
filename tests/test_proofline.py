"""
Unit tests for NebiusProofLine Studio 3-Tier Nemotron Router, Tavily 2-Stage Corpus,
and Deterministic Citation & Numerical Proof Gate.
"""

from backend.proofline_engine import (
    SCENARIOS,
    extract_numbers,
    run_proofline_pipeline,
    verify_claim_against_corpus,
)


def test_extract_numbers_precision():
    nums = extract_numbers("Bandwidth reaches 8 TB/s across 192 GB with 68.4% savings and 2.1x growth.")
    assert "8" in nums
    assert "192" in nums
    assert "68.4%" in nums
    assert "2.1x" in nums


def test_deterministic_proof_gate_catches_hallucinated_numbers():
    sources = SCENARIOS["k8s_gpu_oom"]["tavily_sources"]
    # Valid claim
    valid = verify_claim_against_corpus(
        claim_id="TEST-1",
        category="VRAM",
        statement="vLLM pre-allocates 90% of GPU VRAM and NCCL requires 4.2 GB per rank; lowering to 0.84 and 128 prevents OOM.",
        cited_source_id="SRC-01",
        sources=sources,
    )
    assert valid.proof_status.startswith("VERIFIED")

    # Hallucinated number claim
    invalid = verify_claim_against_corpus(
        claim_id="TEST-2",
        category="Hallucination",
        statement="Setting --gpu-memory-utilization to 0.99 saves 19.5 GB per rank.",
        cited_source_id="SRC-01",
        sources=sources,
    )
    assert invalid.proof_status == "REJECTED_STRIKETHROUGH"
    assert "0.99" in invalid.proof_reason or "19.5" in invalid.proof_reason


def test_full_pipeline_3tier_finops_and_proof_summary():
    for sid in ("k8s_gpu_oom", "hbm3e_supply_chain", "token_factory_finops"):
        res = run_proofline_pipeline(sid)
        assert res["proof_gate_summary"]["verified_claims"] >= 1
        assert res["proof_gate_summary"]["rejected_strikethrough_claims"] >= 1
        assert res["proof_gate_summary"]["hallucination_leak_rate"] == "0.0%"
        assert res["finops_telemetry"]["cost_savings_pct"] > 50.0
