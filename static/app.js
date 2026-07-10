// Paving Plan AI — client app. No build step, no framework: plain DOM + SVG.
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const GRADIENT = [
    { fill: "rgba(37,99,235,0.42)", stroke: "#1e40af" },
    { fill: "rgba(8,145,178,0.44)", stroke: "#0e7490" },
    { fill: "rgba(245,158,11,0.45)", stroke: "#b45309" },
    { fill: "rgba(234,88,12,0.45)", stroke: "#9a3412" },
    { fill: "rgba(220,38,38,0.44)", stroke: "#991b1b" },
  ];

  function styleForDay(day, totalDays) {
    let idx;
    if (totalDays <= 1) idx = GRADIENT.length - 1;
    else idx = Math.round(((day - 1) * (GRADIENT.length - 1)) / (totalDays - 1));
    idx = Math.max(0, Math.min(idx, GRADIENT.length - 1));
    return GRADIENT[idx];
  }

  const LOADING_MESSAGES = [
    "Scouting the lot from orbit…",
    "Finding the front door…",
    "Mapping phase boundaries…",
    "Keeping the most parking open…",
    "Routing guests around the cones…",
    "Drafting the crew notes…",
  ];

  // ---------- tiny state ----------

  const state = {
    jobTypes: [],
    selectedJobType: "mill_overlay",
    status: null,
    lastRequest: null, // {address, business_name, job_type, days}
    current: null, // {plan, raw_image, plan_image, formatted_address, business_name, job_type}
    originalPlan: null,
    finalImage: null,
    dragging: null,
    fromHistory: false,
  };

  // ---------- fetch helper ----------

  async function api(path, options) {
    const res = await fetch(path, options);
    let body = null;
    try {
      body = await res.json();
    } catch (_) {
      /* no body */
    }
    if (!res.ok) {
      const message = (body && body.detail) || `Request failed (${res.status})`;
      throw new Error(message);
    }
    return body;
  }

  // ---------- toast ----------

  let toastTimer = null;
  function toast(message, isError) {
    const el = $("toast");
    el.textContent = message;
    el.classList.toggle("error", !!isError);
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 3600);
  }

  // ---------- view switching ----------

  function showView(id) {
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    $(id).classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const view = btn.dataset.view;
      if (view === "history") {
        showView("view-history");
        loadHistory();
      } else {
        showView("view-new");
      }
    });
  });

  function activateTab(view) {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  }

  // ---------- status pill ----------

  async function loadStatus() {
    try {
      state.status = await api("/api/status");
    } catch (_) {
      state.status = { demo_available: true, live_ready: false, missing: [] };
    }
    const pill = $("statusPill");
    const note = $("liveNote");
    const generateBtn = $("generateBtn");
    const demoBtn = $("demoBtn");
    if (state.status.live_ready) {
      pill.textContent = "Live";
      pill.className = "status-pill live";
      pill.title = "Address lookup, imagery, and AI phasing are all configured.";
      note.hidden = true;
      generateBtn.disabled = false;
    } else {
      pill.textContent = "Demo mode";
      pill.className = "status-pill demo";
      const missing = state.status.missing.join(", ");
      pill.title = `Live mode not configured. Missing: ${missing}`;
      note.hidden = false;
      note.textContent = `Live generation isn't configured on this server yet (missing: ${missing}). Use "View example" below, or see the README to add API keys.`;
      demoBtn.classList.remove("btn-outline");
      demoBtn.classList.add("btn-primary");
      generateBtn.classList.remove("btn-primary");
      generateBtn.classList.add("btn-outline");
    }
  }

  // ---------- job types ----------

  async function loadJobTypes() {
    try {
      const data = await api("/api/job-types");
      state.jobTypes = data.job_types;
    } catch (_) {
      state.jobTypes = [];
    }
    const grid = $("jobTypeGrid");
    grid.innerHTML = "";
    state.jobTypes.forEach((jt, i) => {
      const label = document.createElement("label");
      label.className = "job-type-card" + (jt.id === state.selectedJobType ? " selected" : "");
      label.innerHTML = `
        <input type="radio" name="jobType" value="${jt.id}" ${jt.id === state.selectedJobType ? "checked" : ""}>
        <div>
          <div class="jt-title">${jt.label}</div>
          <p class="jt-desc">${jt.description}</p>
          <div class="jt-days">${jt.min_days}–${jt.max_days} day plan · default ${jt.default_days}</div>
        </div>`;
      const input = label.querySelector("input");
      input.addEventListener("change", () => selectJobType(jt.id));
      grid.appendChild(label);
    });
    if (state.jobTypes.length && !state.jobTypes.find((j) => j.id === state.selectedJobType)) {
      selectJobType(state.jobTypes[0].id);
    } else {
      applyJobTypeDefaults(state.selectedJobType);
    }
  }

  function selectJobType(id) {
    state.selectedJobType = id;
    document.querySelectorAll(".job-type-card").forEach((card) => {
      card.classList.toggle("selected", card.querySelector("input").value === id);
    });
    applyJobTypeDefaults(id);
  }

  function applyJobTypeDefaults(id) {
    const jt = state.jobTypes.find((j) => j.id === id);
    if (!jt) return;
    const range = $("daysRange");
    range.min = jt.min_days;
    range.max = jt.max_days;
    range.value = jt.default_days;
    $("daysValue").textContent = jt.default_days;
  }

  $("daysRange").addEventListener("input", (e) => {
    $("daysValue").textContent = e.target.value;
  });

  // ---------- generate / demo ----------

  let loadingInterval = null;
  function startLoading() {
    let i = 0;
    $("loadingText").textContent = LOADING_MESSAGES[0];
    showView("view-loading");
    loadingInterval = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length;
      $("loadingText").textContent = LOADING_MESSAGES[i];
    }, 1600);
  }
  function stopLoading() {
    clearInterval(loadingInterval);
  }

  $("planForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formError = $("formError");
    formError.hidden = true;

    const address = $("address").value.trim();
    if (address.length < 8) {
      formError.textContent = "Enter a full street address (at least 8 characters).";
      formError.hidden = false;
      return;
    }

    const request = {
      address,
      business_name: $("businessName").value.trim(),
      job_type: state.selectedJobType,
      days: Number($("daysRange").value),
    };
    state.lastRequest = request;

    startLoading();
    try {
      const data = await api("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      stopLoading();
      loadPlanIntoReview(data);
    } catch (err) {
      stopLoading();
      showView("view-new");
      toast(err.message, true);
    }
  });

  $("demoBtn").addEventListener("click", async () => {
    startLoading();
    try {
      const data = await api("/api/demo");
      stopLoading();
      loadPlanIntoReview(data);
    } catch (err) {
      stopLoading();
      showView("view-new");
      toast(err.message, true);
    }
  });

  $("regenerateBtn").addEventListener("click", async () => {
    if (!state.lastRequest) {
      toast("Nothing to regenerate yet.", true);
      return;
    }
    startLoading();
    try {
      const data = await api("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state.lastRequest),
      });
      stopLoading();
      loadPlanIntoReview(data);
    } catch (err) {
      stopLoading();
      showView("view-review");
      toast(err.message, true);
    }
  });

  $("resetEditsBtn").addEventListener("click", () => {
    if (!state.originalPlan) return;
    state.current.plan = JSON.parse(JSON.stringify(state.originalPlan));
    renderReview();
    toast("Edits reset to the last generated plan.");
  });

  // ---------- review view ----------

  function loadPlanIntoReview(data) {
    state.fromHistory = false;
    state.current = {
      plan: data.plan,
      raw_image: data.raw_image,
      formatted_address: data.formatted_address,
      business_name: data.business_name || $("businessName").value.trim(),
      job_type: data.job_type || state.selectedJobType,
    };
    state.originalPlan = JSON.parse(JSON.stringify(data.plan));
    renderReview();
    showView("view-review");
  }

  function renderReview() {
    const { plan, raw_image, formatted_address } = state.current;
    $("reviewSubtitle").textContent = formatted_address;
    $("confidenceBadge").textContent = `Site confidence: ${plan.site_confidence}%`;
    $("frontDescription").textContent = plan.front_description;

    const assumptions = $("assumptionsList");
    assumptions.innerHTML = "";
    plan.assumptions.forEach((a) => {
      const li = document.createElement("li");
      li.textContent = a;
      assumptions.appendChild(li);
    });

    $("rawImage").src = raw_image;
    renderEditorSvg();
    renderPhaseEditor();
  }

  function renderPhaseEditor() {
    const container = $("phaseEditor");
    container.innerHTML = "";
    const phases = [...state.current.plan.phases].sort((a, b) => a.day - b.day);
    const total = phases.length;
    phases.forEach((phase) => {
      const style = styleForDay(phase.day, total);
      const card = document.createElement("div");
      card.className = "phase-card";
      card.innerHTML = `
        <div class="phase-card-head">
          <span class="phase-swatch" style="background:${style.stroke}"></span>
          <strong>Day ${phase.day}</strong>
        </div>
        <label>Zone label</label>
        <input type="text" maxlength="90" data-field="zone_label" data-day="${phase.day}" value="${escapeAttr(phase.zone_label)}">
        <label>Guest instruction</label>
        <input type="text" maxlength="90" data-field="guest_instruction" data-day="${phase.day}" value="${escapeAttr(phase.guest_instruction)}">
      `;
      container.appendChild(card);
    });
    container.querySelectorAll("input[data-field]").forEach((input) => {
      input.addEventListener("input", () => {
        const day = Number(input.dataset.day);
        const field = input.dataset.field;
        const phase = state.current.plan.phases.find((p) => p.day === day);
        if (phase) phase[field] = input.value;
      });
    });
  }

  function escapeAttr(str) {
    return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }

  // ---------- SVG polygon editor ----------

  const SVG_NS = "http://www.w3.org/2000/svg";

  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  function renderEditorSvg() {
    const svg = $("editorSvg");
    svg.innerHTML = "";
    const phases = [...state.current.plan.phases].sort((a, b) => a.day - b.day);
    const total = phases.length;

    phases.forEach((phase) => {
      const style = styleForDay(phase.day, total);
      const points = phase.polygon.map((p) => `${p.x},${p.y}`).join(" ");
      svg.appendChild(svgEl("polygon", { points, fill: style.fill, stroke: style.stroke, "stroke-width": 0.5 }));

      svg.appendChild(
        svgEl("line", {
          class: "route-line",
          x1: phase.label_anchor.x, y1: phase.label_anchor.y,
          x2: phase.guest_arrow_to.x, y2: phase.guest_arrow_to.y,
        })
      );

      phase.polygon.forEach((pt, idx) => {
        const c = svgEl("circle", { class: "vertex-handle", cx: pt.x, cy: pt.y, r: 1.6, fill: style.stroke });
        attachDrag(c, phase.day, "vertex", idx);
        svg.appendChild(c);
      });

      const anchor = svgEl("circle", {
        class: "anchor-handle", cx: phase.label_anchor.x, cy: phase.label_anchor.y, r: 2.6, fill: "#0f172a",
      });
      attachDrag(anchor, phase.day, "anchor", null);
      svg.appendChild(anchor);

      const anchorText = svgEl("text", {
        x: phase.label_anchor.x, y: phase.label_anchor.y, "text-anchor": "middle",
        dy: "0.35em", fill: "white", "font-size": 2.6, "font-weight": 800, "pointer-events": "none",
      });
      anchorText.textContent = phase.day;
      svg.appendChild(anchorText);

      const target = svgEl("rect", {
        class: "target-handle", x: phase.guest_arrow_to.x - 1.6, y: phase.guest_arrow_to.y - 1.6,
        width: 3.2, height: 3.2, transform: `rotate(45 ${phase.guest_arrow_to.x} ${phase.guest_arrow_to.y})`,
      });
      attachDrag(target, phase.day, "target", null);
      svg.appendChild(target);
    });
  }

  function attachDrag(el, day, kind, pointIdx) {
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      state.dragging = { day, kind, pointIdx };
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", (e) => onDragMove(e));
    el.addEventListener("pointerup", () => { state.dragging = null; });
    el.addEventListener("pointercancel", () => { state.dragging = null; });
  }

  function onDragMove(e) {
    if (!state.dragging) return;
    const svg = $("editorSvg");
    const rect = svg.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    const phase = state.current.plan.phases.find((p) => p.day === state.dragging.day);
    if (!phase) return;
    if (state.dragging.kind === "vertex") {
      phase.polygon[state.dragging.pointIdx] = { x, y };
    } else if (state.dragging.kind === "anchor") {
      phase.label_anchor = { x, y };
    } else if (state.dragging.kind === "target") {
      phase.guest_arrow_to = { x, y };
    }
    renderEditorSvg();
  }

  // ---------- finalize / export ----------

  $("finalizeBtn").addEventListener("click", async () => {
    const btn = $("finalizeBtn");
    btn.disabled = true;
    btn.textContent = "Rendering…";
    try {
      const { plan, raw_image, business_name, formatted_address, job_type } = state.current;
      const renderData = await api("/api/render-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, raw_image, business_name, formatted_address, job_type }),
      });
      state.finalImage = renderData.plan_image;

      const noticeData = await api("/api/guest-notice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, business_name, formatted_address }),
      });

      showFinal(state.finalImage, noticeData.notice);
    } catch (err) {
      toast(err.message, true);
    } finally {
      btn.disabled = false;
      btn.textContent = "Finalize & export";
    }
  });

  function showFinal(imageDataUrl, noticeText) {
    $("finalImage").src = imageDataUrl;
    $("downloadBtn").href = imageDataUrl;
    $("guestNoticeText").value = noticeText;
    updateNoticeLinks(noticeText);
    $("backToEditBtn").hidden = state.fromHistory;
    $("saveHistoryBtn").hidden = state.fromHistory;
    showView("view-final");
  }

  $("backToEditBtn").addEventListener("click", () => showView("view-review"));

  $("printBtn").addEventListener("click", () => {
    $("printImage").src = $("finalImage").src;
    window.print();
  });

  $("saveHistoryBtn").addEventListener("click", async () => {
    if (!state.current || !state.finalImage) return;
    const btn = $("saveHistoryBtn");
    btn.disabled = true;
    try {
      const { plan, business_name, formatted_address, job_type } = state.current;
      await api("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, plan_image: state.finalImage, business_name, formatted_address, job_type }),
      });
      toast("Saved to history.");
    } catch (err) {
      toast(err.message, true);
    } finally {
      btn.disabled = false;
    }
  });

  $("guestNoticeText").addEventListener("input", (e) => updateNoticeLinks(e.target.value));

  $("copyNoticeBtn").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText($("guestNoticeText").value);
      toast("Copied to clipboard.");
    } catch (_) {
      toast("Could not copy — select and copy manually.", true);
    }
  });

  function updateNoticeLinks(text) {
    const subject = encodeURIComponent("Parking lot paving notice");
    const body = encodeURIComponent(text);
    $("emailNoticeBtn").href = `mailto:?subject=${subject}&body=${body}`;
    $("smsNoticeBtn").href = `sms:?&body=${body}`;
  }

  // ---------- history ----------

  async function loadHistory() {
    const grid = $("historyGrid");
    const empty = $("historyEmpty");
    grid.innerHTML = "";
    let items = [];
    try {
      const data = await api("/api/history");
      items = data.items;
    } catch (err) {
      toast(err.message, true);
      return;
    }
    empty.hidden = items.length > 0;
    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "history-card";
      const jt = state.jobTypes.find((j) => j.id === item.job_type);
      const date = new Date(item.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
      card.innerHTML = `
        <img alt="Saved plan thumbnail" loading="lazy">
        <div class="history-card-body">
          <div class="hc-name">${escapeAttr(item.business_name || "Untitled site")}</div>
          <div class="hc-address">${escapeAttr(item.formatted_address)}</div>
          <div class="hc-meta">${escapeAttr(jt ? jt.label : item.job_type)} · ${item.days}d · ${date}</div>
          <div class="history-card-actions">
            <button class="btn btn-outline" data-action="view">View</button>
            <button class="btn btn-danger" data-action="delete">Delete</button>
          </div>
        </div>`;
      card.querySelector("[data-action=view]").addEventListener("click", () => viewHistoryItem(item.id));
      card.querySelector("[data-action=delete]").addEventListener("click", () => deleteHistoryItem(item.id, card));
      grid.appendChild(card);
      // Lazy-load the thumbnail only (full detail image fetched on view).
      api(`/api/history/${item.id}`).then((full) => {
        card.querySelector("img").src = full.plan_image;
      }).catch(() => {});
    });
  }

  async function viewHistoryItem(id) {
    try {
      const item = await api(`/api/history/${id}`);
      state.fromHistory = true;
      state.current = {
        plan: item.plan,
        raw_image: null,
        formatted_address: item.formatted_address,
        business_name: item.business_name,
        job_type: item.job_type,
      };
      state.finalImage = item.plan_image;
      const noticeData = await api("/api/guest-notice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: item.plan, business_name: item.business_name, formatted_address: item.formatted_address }),
      });
      showFinal(item.plan_image, noticeData.notice);
      activateTab("new");
    } catch (err) {
      toast(err.message, true);
    }
  }

  async function deleteHistoryItem(id, cardEl) {
    if (!confirm("Delete this saved plan? This cannot be undone.")) return;
    try {
      await api(`/api/history/${id}`, { method: "DELETE" });
      cardEl.remove();
      toast("Deleted.");
      if (!$("historyGrid").children.length) $("historyEmpty").hidden = false;
    } catch (err) {
      toast(err.message, true);
    }
  }

  // ---------- init ----------

  loadStatus();
  loadJobTypes();
})();
