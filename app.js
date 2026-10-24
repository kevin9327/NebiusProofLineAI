const FALLBACK_DATA = {
  k8s_gpu_oom: {
    scenario_id: "k8s_gpu_oom",
    title: "1. K8s GPU Cluster OOMKilled & CVE Root-Cause Audit",
    domain: "DevSecOps / Cloud Infrastructure",
    prompt: "Diagnose recurring CUDA OOMKilled pod crashes on our 8x H100 vLLM inference cluster after upgrading container toolkit, verify active CVEs via Tavily, and generate a proof-gated remediation patch.",
    tier1_nano_trace: {
      model: "nvidia/Nemotron-3-Nano-30B",
      ttft_ms: 148,
      cost_usd: 0.00006,
      intent: "INFRA_INCIDENT_AND_CVE_AUDIT",
      safety_guardrail: "PASSED (No destructive shell injection or secret exfiltration detected)",
      tavily_queries: [
        "vLLM v0.6 CUDA OOMKilled gpu-memory-utilization NCCL P2P bug",
        "NVIDIA Container Toolkit CVE-2024-0132 container escape patch version",
        "Kubernetes Pod Memory QoS vs GPU VRAM eviction policy H100"
      ]
    },
    tier2_super_trace: {
      model: "nvidia/Nemotron-3-Super-120B",
      ttft_ms: 372,
      cost_usd: 0.00119
    },
    tavily_sources: [
      {
        source_id: "SRC-01",
        title: "vLLM Engine Memory Management & KV Cache Allocation Guide",
        url: "https://docs.vllm.ai/en/stable/serving/gpu_memory.html",
        domain: "docs.vllm.ai",
        published_date: "2026-09-14",
        search_score: 0.96,
        extracted_markdown: "By default, vLLM pre-allocates 90% of GPU VRAM (`--gpu-memory-utilization 0.90`). When running multi-step speculative decoding or CUDA graph capture on 8x H100 nodes, NCCL communicator buffers require an additional 4.2 GB per rank. Lowering `--gpu-memory-utilization` to 0.84 and setting `--max-num-seqs 128` eliminates OOM spikes during burst prefill."
      },
      {
        source_id: "SRC-02",
        title: "NVIDIA Security Bulletin: Container Toolkit CVE-2024-0132 Remediation",
        url: "https://nvidia.custhelp.com/app/answers/detail/a_id/5582",
        domain: "nvidia.custhelp.com",
        published_date: "2026-09-28",
        search_score: 0.94,
        extracted_markdown: "NVIDIA Container Toolkit versions prior to v1.16.2 contain a vulnerability (CVE-2024-0132, CVSS 9.0) where a specially crafted container image can gain host filesystem access. Operators must upgrade nvidia-container-toolkit to v1.16.2 or later immediately."
      },
      {
        source_id: "SRC-03",
        title: "Kubernetes Device Plugin & cgroupv2 Host RAM Accounting on GPU Nodes",
        url: "https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/",
        domain: "kubernetes.io",
        published_date: "2026-08-19",
        search_score: 0.91,
        extracted_markdown: "Kubernetes `resources.limits.memory` tracks host system RAM, not GPU VRAM. However, PyTorch pinned host memory (`pin_memory=True`) and mmap weight loading consume up to 38 GB of host cgroup memory per replica. Setting pod memory limit below 64Gi triggers Linux kernel OOMKiller (`exitCode: 137`)."
      }
    ],
    proof_gate_audit: [
      {
        claim_id: "CLM-101",
        category: "VRAM Allocation",
        statement: "vLLM pre-allocates 90% of GPU VRAM by default, while NCCL communicator buffers require an additional 4.2 GB per rank on 8x H100 nodes; lowering --gpu-memory-utilization to 0.84 and --max-num-seqs to 128 prevents VRAM OOM.",
        cited_source_id: "SRC-01",
        cited_url: "https://docs.vllm.ai/en/stable/serving/gpu_memory.html",
        extracted_numbers: ["90%", "4.2", "8x", "100", "0.84", "128"],
        matched_numbers: ["90%", "4.2", "8x", "100", "0.84", "128"],
        quote_similarity: 0.84,
        proof_status: "VERIFIED_EXACT",
        proof_reason: "100% numeric & semantic match verified against docs.vllm.ai (similarity=0.84).",
        evidence_snippet: "When running multi-step speculative decoding or CUDA graph capture on 8x H100 nodes, NCCL communicator buffers require an additional 4.2 GB per rank."
      },
      {
        claim_id: "CLM-102",
        category: "Security CVE",
        statement: "NVIDIA Container Toolkit versions prior to v1.16.2 are vulnerable to CVE-2024-0132 with CVSS 9.0, requiring immediate upgrade to v1.16.2 or later.",
        cited_source_id: "SRC-02",
        cited_url: "https://nvidia.custhelp.com/app/answers/detail/a_id/5582",
        extracted_numbers: ["1.16.2", "2024", "0132", "9.0"],
        matched_numbers: ["1.16.2", "2024", "0132", "9.0"],
        quote_similarity: 0.88,
        proof_status: "VERIFIED_EXACT",
        proof_reason: "100% numeric & semantic match verified against nvidia.custhelp.com (similarity=0.88).",
        evidence_snippet: "NVIDIA Container Toolkit versions prior to v1.16.2 contain a vulnerability (CVE-2024-0132, CVSS 9.0)"
      },
      {
        claim_id: "CLM-103",
        category: "Host Cgroup OOM",
        statement: "PyTorch pinned host memory and mmap weight loading consume up to 38 GB of host cgroup memory per replica, so setting pod memory limit below 64Gi triggers exitCode: 137.",
        cited_source_id: "SRC-03",
        cited_url: "https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/",
        extracted_numbers: ["38", "64", "137"],
        matched_numbers: ["38", "64", "137"],
        quote_similarity: 0.86,
        proof_status: "VERIFIED_EXACT",
        proof_reason: "100% numeric & semantic match verified against kubernetes.io (similarity=0.86).",
        evidence_snippet: "PyTorch pinned host memory (`pin_memory=True`) and mmap weight loading consume up to 38 GB of host cgroup memory per replica."
      },
      {
        claim_id: "CLM-104",
        category: "Hallucination Trap (Injected Drift)",
        statement: "Setting --gpu-memory-utilization to 0.99 on vLLM v0.6 reduces NCCL memory overhead by 19.5 GB per rank according to docs.vllm.ai.",
        cited_source_id: "SRC-01",
        cited_url: "https://docs.vllm.ai/en/stable/serving/gpu_memory.html",
        extracted_numbers: ["0.99", "0.6", "19.5"],
        matched_numbers: [],
        quote_similarity: 0.31,
        proof_status: "REJECTED_STRIKETHROUGH",
        proof_reason: "Proof Gate Blocked Hallucinated Metric(s): 0.99, 19.5 not found in docs.vllm.ai (SRC-01).",
        evidence_snippet: "Lowering `--gpu-memory-utilization` to 0.84 and setting `--max-num-seqs 128` eliminates OOM spikes during burst prefill."
      }
    ],
    proof_gate_summary: {
      total_claims_checked: 4,
      verified_claims: 3,
      rejected_strikethrough_claims: 1,
      hallucination_leak_rate: "0.0%"
    },
    tier3_ultra_trace: {
      model: "nvidia/Nemotron-3-Ultra-550B",
      ttft_ms: 745,
      cost_usd: 0.00539,
      think_stream: "<think>\n1. Evaluating 4 extracted candidate claims from Tier-2 Nemotron-3-Super-120B against deterministic Proof Gate results.\n2. CLM-101 (SRC-01), CLM-102 (SRC-02), and CLM-103 (SRC-03) passed 100% numeric & substring verification.\n3. CLM-104 claimed `--gpu-memory-utilization 0.99` saves `19.5 GB`, which was REJECTED by Proof Gate because `0.99` and `19.5 GB` do not exist in SRC-01 (`docs.vllm.ai`). Excluding CLM-104 from remediation YAML.\n4. Synthesizing zero-downtime Kubernetes Deployment patch (`memory: 64Gi`, `--gpu-memory-utilization=0.84`, `--max-num-seqs=128`, toolkit `v1.16.2`).\n</think>",
      executive_synthesis: "Root-cause analysis confirms a dual-layer memory contention combined with an active container toolkit CVE:\n1. Host Cgroup OOM (exitCode: 137): Raise Kubernetes pod resources.limits.memory to 64Gi to accommodate 38 GB of PyTorch pinned host memory + mmap buffers ([SRC-03]).\n2. GPU VRAM Prefill Spike: Lower vLLM --gpu-memory-utilization from 0.90 to 0.84 and cap --max-num-seqs at 128 to reserve 4.2 GB per rank for 8x H100 NCCL buffers ([SRC-01]).\n3. Security Remediation (CVE-2024-0132, CVSS 9.0): Pin nvidia-container-toolkit daemonset to v1.16.2 ([SRC-02])."
    },
    finops_telemetry: {
      cascade_3tier_cost_usd: 0.00664,
      naive_all_ultra_cost_usd: 0.02098,
      cost_savings_pct: 68.4,
      tier1_ttft_ms: 148
    }
  }
};

async function loadScenario(scenarioId) {
  let data = FALLBACK_DATA[scenarioId] || FALLBACK_DATA.k8s_gpu_oom;
  try {
    const resp = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario_id: scenarioId })
    });
    if (resp.ok) {
      data = await resp.json();
    }
  } catch (_) {}
  renderDashboard(data);
}

function renderDashboard(data) {
  document.getElementById("activePromptText").textContent = data.prompt;
  document.getElementById("kpiCascadeCost").textContent = `$${data.finops_telemetry.cascade_3tier_cost_usd.toFixed(5)}`;
  document.getElementById("kpiNaiveCompare").textContent = `vs $${data.finops_telemetry.naive_all_ultra_cost_usd.toFixed(5)} All-Ultra (-${data.finops_telemetry.cost_savings_pct}%)`;
  document.getElementById("kpiNanoTtft").textContent = `${data.tier1_nano_trace.ttft_ms} ms`;
  document.getElementById("kpiVerifiedCount").textContent = `${data.proof_gate_summary.verified_claims} / ${data.proof_gate_summary.total_claims_checked} Verified`;
  document.getElementById("kpiLeakRate").textContent = data.proof_gate_summary.hallucination_leak_rate;

  // Tier 1
  document.getElementById("t1Latency").textContent = `${data.tier1_nano_trace.ttft_ms} ms TTFT · $${data.tier1_nano_trace.cost_usd.toFixed(5)}`;
  document.getElementById("t1Intent").textContent = data.tier1_nano_trace.intent;
  document.getElementById("t1Guard").textContent = data.tier1_nano_trace.safety_guardrail;
  const qList = document.getElementById("t1Queries");
  qList.innerHTML = "";
  data.tier1_nano_trace.tavily_queries.forEach(q => {
    const li = document.createElement("li");
    li.textContent = `🔍 ${q}`;
    qList.appendChild(li);
  });

  // Tier 2 mini claims
  document.getElementById("t2Latency").textContent = `${data.tier2_super_trace.ttft_ms} ms TTFT · $${data.tier2_super_trace.cost_usd.toFixed(5)}`;
  const miniBox = document.getElementById("t2MiniClaims");
  miniBox.innerHTML = "";
  data.proof_gate_audit.forEach(clm => {
    const rejected = clm.proof_status === "REJECTED_STRIKETHROUGH";
    const div = document.createElement("div");
    div.className = `mini-claim-item ${rejected ? "rejected" : ""}`;
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
        <strong>${clm.claim_id} · ${clm.category}</strong>
        <span style="color:${rejected ? '#f87171' : '#34d399'};font-weight:800;font-size:11px;">
          ${rejected ? "✗ REJECTED BY PROOF GATE" : "✓ VERIFIED EXACT"}
        </span>
      </div>
      <div class="${rejected ? "strikethrough-text" : ""}">${clm.statement}</div>
    `;
    miniBox.appendChild(div);
  });

  // Tier 3
  document.getElementById("t3Latency").textContent = `${data.tier3_ultra_trace.ttft_ms} ms TTFT · $${data.tier3_ultra_trace.cost_usd.toFixed(5)}`;
  document.getElementById("t3ThinkBox").textContent = data.tier3_ultra_trace.think_stream;
  document.getElementById("t3ExecBrief").textContent = data.tier3_ultra_trace.executive_synthesis;

  // Tab 2: Proof Gate Audit List
  const auditList = document.getElementById("proofGateList");
  auditList.innerHTML = "";
  data.proof_gate_audit.forEach(clm => {
    const rejected = clm.proof_status === "REJECTED_STRIKETHROUGH";
    const card = document.createElement("div");
    card.className = `audit-card ${rejected ? "rejected" : ""}`;
    card.innerHTML = `
      <div class="audit-top">
        <strong>${clm.claim_id} (${clm.category}) → [${clm.cited_source_id}]</strong>
        <span class="gate-badge ${rejected ? "fail" : "pass"}">
          ${rejected ? "✗ STRIKETHROUGH APPLIED" : "✓ VERIFIED EXACT MATCH"}
        </span>
      </div>
      <div class="audit-statement ${rejected ? "strikethrough-text" : ""}">${clm.statement}</div>
      <div class="audit-meta">
        <div><strong>Proof Gate Verdict:</strong> ${clm.proof_reason}</div>
        <div><strong>Extracted Numeric Tokens:</strong> <code>${JSON.stringify(clm.extracted_numbers)}</code> | <strong>Matched:</strong> <code>${JSON.stringify(clm.matched_numbers)}</code></div>
        <div><strong>Source Grounding Snippet:</strong> "${clm.evidence_snippet}"</div>
      </div>
    `;
    auditList.appendChild(card);
  });

  // Tab 3: Tavily Sources
  const srcGrid = document.getElementById("tavilySourcesGrid");
  srcGrid.innerHTML = "";
  data.tavily_sources.forEach(s => {
    const card = document.createElement("div");
    card.className = "src-card";
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:11px;color:#94a3b8;">
        <span><strong>${s.source_id}</strong> · ${s.domain}</span>
        <span style="color:#a3e635;font-weight:700;">Relevance: ${(s.search_score * 100).toFixed(0)}%</span>
      </div>
      <h3>${s.title}</h3>
      <div class="src-url">${s.url}</div>
      <div class="src-md">${s.extracted_markdown}</div>
    `;
    srcGrid.appendChild(card);
  });
}

document.querySelectorAll(".scen-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".scen-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    loadScenario(btn.dataset.scen);
  });
});

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

loadScenario("k8s_gpu_oom");
