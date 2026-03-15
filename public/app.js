/* ======= Helpers ======= */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const snackbar = (msg, type = "info") => {
  const el = $("#snackbar");
  el.textContent = msg;
  el.style.borderColor = type === "error" ? "rgba(255,0,0,.35)" : "rgba(255,255,255,.1)";
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2200);
};

const showSkeleton = (id, show) => {
  const sk = $(id);
  if (!sk) return;
  sk.hidden = !show;
};

const setIndicator = (index) => {
  const indicator = $(".tab__indicator::before"); // not directly accessible
  // Instead we move via inline style on the wrapper:
  const wrap = $(".tabs");
  wrap.style.setProperty("--tab-index", index);
  // Move using transform on actual element
  const indicatorEl = $(".tab__indicator");
  indicatorEl.style.setProperty(
    "--x",
    `translateX(calc(${index} * 100% / 3))`
  );
  indicatorEl.style.setProperty("--w", "calc(100% / 3)");
  indicatorEl.firstElementChild?.remove();
};
(() => {
  // CSS-driven indicator movement
  const ind = $(".tab__indicator");
  ind.style.position = "relative";
  const bar = document.createElement("span");
  bar.style.position = "absolute";
  bar.style.left = "0";
  bar.style.top = "0";
  bar.style.height = "100%";
  bar.style.width = "calc(100% / 3)";
  bar.style.background = "linear-gradient(90deg, var(--primary), var(--primary-2))";
  bar.style.transform = "translateX(0)";
  bar.style.transition = "transform .28s ease";
  ind.appendChild(bar);
  setIndicator(0);
})();

const moveIndicator = (i) => {
  const bar = $(".tab__indicator > span");
  bar.style.transform = `translateX(calc(${i} * 100%))`;
};

const fetchJSON = async (url, options = {}, { timeout = 12000 } = {}) => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data?.error || res.statusText), { data, status: res.status });
    return data;
  } finally {
    clearTimeout(t);
  }
};

/* ======= Tabs & Views ======= */
const tabs = $$(".tab");
const views = $$(".view");

tabs.forEach((tab, i) => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    views.forEach(v => v.classList.remove("is-active"));
    const name = tab.dataset.view;
    $(`#view-${name}`)?.classList.add("is-active");
    moveIndicator(i);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

/* ======= Ripple (simple CSS :active already in CSS, this enhances keyboard) ======= */
$$(".with-ripple").forEach((btn) => {
  btn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      btn.classList.add("ripple-key");
      setTimeout(() => btn.classList.remove("ripple-key"), 200);
    }
  });
});

/* ======= Actions ======= */
const pincodeInput = $("#pincode");
const hospitalIdInput = $("#hospitalId");

$("#btnSearchPincode").addEventListener("click", async () => {
  const pincode = pincodeInput.value.trim();
  if (!pincode) return snackbar("Please enter a pincode", "error");
  $("#searchResults").innerHTML = "";
  showSkeleton("#searchSkeleton", true);
  try {
    const data = await fetchJSON(`/api/pincode?pincode=${encodeURIComponent(pincode)}`);
    renderHospitals(data, "#searchResults");
    localStorage.setItem("lastPincode", pincode);
  } catch (err) {
    console.error(err);
    snackbar(err?.data?.message || "Failed to fetch hospitals", "error");
  } finally {
    showSkeleton("#searchSkeleton", false);
  }
});

$("#btnGetServices").addEventListener("click", async () => {
  const id = hospitalIdInput.value.trim();
  if (!id) return snackbar("Please enter Hospital ID", "error");
  $("#servicesResults").innerHTML = "";
  showSkeleton("#servicesSkeleton", true);
  try {
    const data = await fetchJSON(`/api/services/${encodeURIComponent(id)}`);
    renderServices(data, "#servicesResults");
    localStorage.setItem("lastHospitalId", id);
  } catch (err) {
    console.error(err);
    snackbar(err?.data?.message || "Failed to fetch services", "error");
  } finally {
    showSkeleton("#servicesSkeleton", false);
  }
});

$("#btnCreatePatient").addEventListener("click", async () => {
  const payload = {
    firstName: $("#firstName").value.trim(),
    lastName: $("#lastName").value.trim(), // server maps to LastName for Mule
    age: $("#age").value.trim(),
    gender: $("#gender").value.trim(),
    phoneNumber: $("#phoneNumber").value.trim(),
    address: $("#address").value.trim(),
    gmail: $("#gmail").value.trim(), // 'email' also accepted by server
  };

  // Basic validation
  const required = ["firstName","lastName","age","gender","phoneNumber","address","gmail"];
  const missing = required.filter(k => !payload[k]);
  if (missing.length) {
    snackbar(`Missing: ${missing.join(", ")}`, "error");
    return;
  }

  $("#registerResults").innerHTML = "";
  showSkeleton("#registerSkeleton", true);
  try {
    const data = await fetchJSON("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    $("#registerResults").innerHTML = cardJSON("Registration", data);
    snackbar("Patient registered");
  } catch (err) {
    console.error(err);
    snackbar(err?.data?.message || err?.message || "Registration failed", "error");
  } finally {
    showSkeleton("#registerSkeleton", false);
  }
});

/* ======= Renderers ======= */
const cardJSON = (title, obj) => {
  return `
    <div class="result-card">
      <h3>${title}</h3>
      <pre style="white-space:pre-wrap;margin:6px 0 0;color:#bcd;">${escapeHTML(JSON.stringify(obj, null, 2))}</pre>
    </div>
  `;
};

const renderHospitals = (data, mountSel) => {
  const mount = $(mountSel);
  if (!data) return;
  if (Array.isArray(data)) {
    // In case backend returns raw array
    mount.innerHTML = data.map(h => hospitalCard(h)).join("");
    return;
  }
  // Expected: { status, message, data: [] }
  if (Array.isArray(data.data) && data.data.length) {
    mount.innerHTML = data.data.map(h => hospitalCard(h)).join("");
  } else {
    mount.innerHTML = cardJSON("Response", data);
  }
};

const hospitalCard = (h) => `
  <div class="result-card">
    <h3>${escapeHTML(h.name ?? "Hospital")}</h3>
    <p><strong>ID:</strong> ${escapeHTML(String(h.hospital_id ?? ""))}</p>
    ${h.address ? `<p><strong>Address:</strong> ${escapeHTML(h.address)}</p>` : ""}
    ${h.contact ? `<p><strong>Contact:</strong> ${escapeHTML(h.contact)}</p>` : ""}
  </div>
`;

const renderServices = (data, mountSel) => {
  const mount = $(mountSel);
  if (!data) return;
  if (Array.isArray(data)) {
    mount.innerHTML = data.map(s => serviceCard(s)).join("");
    return;
  }
  if (Array.isArray(data.data) && data.data.length) {
    mount.innerHTML = data.data.map(s => serviceCard(s)).join("");
  } else {
    mount.innerHTML = cardJSON("Response", data);
  }
};

const serviceCard = (s) => `
  <div class="result-card">
    <h3>${escapeHTML(s.name ?? "Service")}</h3>
    <p><strong>Hospital ID:</strong> ${escapeHTML(String(s.hospital_id ?? ""))}</p>
    ${s.serviceid ? `<p><strong>Service ID:</strong> ${escapeHTML(String(s.serviceid))}</p>` : ""}
    ${s.description ? `<p>${escapeHTML(s.description)}</p>` : ""}
  </div>
`;

const escapeHTML = (str = "") => str.replace(/[&<>"']/g, m => (
  { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]
));

/* ======= Refresh / FAB / PWA ======= */
$("#refreshBtn").addEventListener("click", () => {
  const active = $(".view.is-active")?.dataset.view;
  if (active === "search") $("#btnSearchPincode").click();
  else if (active === "services") $("#btnGetServices").click();
  else snackbar("Nothing to refresh");
});

$("#fabTop").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

// Restore last inputs
window.addEventListener("DOMContentLoaded", () => {
  const lp = localStorage.getItem("lastPincode"); if (lp) $("#pincode").value = lp;
  const lh = localStorage.getItem("lastHospitalId"); if (lh) $("#hospitalId").value = lh;

  // PWA
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(console.error);
  }
});
