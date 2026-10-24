"""
FastAPI Backend Server for NebiusProofLine Studio.
Serves the interactive 3-Tier Nemotron + Tavily 2-Stage + Deterministic Proof Gate War Room
and REST endpoints for `/api/health`, `/api/scenarios`, and `/api/run`.
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.proofline_engine import (
    NEBIUS_BASE_URL,
    NEMOTRON_TIERS,
    SCENARIOS,
    TAVILY_EXTRACT_URL,
    TAVILY_SEARCH_URL,
    run_proofline_pipeline,
)

ROOT_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DIR = ROOT_DIR / "public"

app = FastAPI(
    title="NebiusProofLine Studio API",
    version="1.0.0",
    description="3-Tier NVIDIA Nemotron Router on Nebius Token Factory + Tavily 2-Stage Grounding + Deterministic Citation Proof Gate",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class RunPipelineRequest(BaseModel):
    scenario_id: str = "k8s_gpu_oom"
    custom_query: Optional[str] = None
    nebius_api_key: Optional[str] = None
    tavily_api_key: Optional[str] = None


@app.get("/api/health")
def get_health():
    return {
        "status": "ok",
        "service": "NebiusProofLine Studio",
        "nebius_endpoint": NEBIUS_BASE_URL,
        "tavily_endpoints": [TAVILY_SEARCH_URL, TAVILY_EXTRACT_URL],
        "nemotron_tiers": list(NEMOTRON_TIERS.keys()),
        "participating_city": "Seoul",
    }


@app.get("/api/scenarios")
def list_scenarios():
    return {
        "scenarios": [
            {
                "id": k,
                "title": v["title"],
                "domain": v["domain"],
                "prompt": v["prompt"],
            }
            for k, v in SCENARIOS.items()
        ]
    }


@app.post("/api/run")
def execute_pipeline(req: RunPipelineRequest):
    return run_proofline_pipeline(
        scenario_id=req.scenario_id,
        custom_query=req.custom_query,
        nebius_api_key=req.nebius_api_key,
        tavily_api_key=req.tavily_api_key,
    )


if PUBLIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(PUBLIC_DIR)), name="assets")


@app.get("/")
def serve_index():
    return FileResponse(str(PUBLIC_DIR / "index.html"))


@app.get("/{filename:path}")
def serve_static(filename: str):
    target = PUBLIC_DIR / filename
    if target.exists() and target.is_file():
        return FileResponse(str(target))
    return FileResponse(str(PUBLIC_DIR / "index.html"))
