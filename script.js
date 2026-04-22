// ✅ AUTO-DETECT API (works local + deployed)
const API = window.location.origin;

// ✅ SOCKET FIX
const socket = io();

let reports = [];

// 🔥 SEARCH + FILTER VARIABLES
let searchText = "";
let selectedPriority = "ALL";

/* PAGE NAVIGATION */
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* LOAD REPORTS */
async function loadReports() {
  try {
    const res = await fetch(`${API}/reports`);
    reports = await res.json();
    renderReports();
    updateDashboard();
  } catch (err) {
    console.error("Failed to load reports:", err);
  }
}

/* 🔥 SEARCH + FILTER EVENTS */
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const filterPriority = document.getElementById("filterPriority");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchText = e.target.value.toLowerCase();
      renderReports();
    });
  }

  if (filterPriority) {
    filterPriority.addEventListener("change", (e) => {
      selectedPriority = e.target.value;
      renderReports();
    });
  }
});

/* RENDER REPORTS */
function renderReports() {
  const container = document.getElementById("reportList");
  if (!container) return;

  container.innerHTML = "";

  const filtered = reports.filter(r => {
    const priority = getPriority(r.description);

    const matchesSearch =
      (r.animalType || "").toLowerCase().includes(searchText) ||
      (r.location || "").toLowerCase().includes(searchText);

    const matchesPriority =
      selectedPriority === "ALL" || priority === selectedPriority;

    return matchesSearch && matchesPriority;
  });

  filtered.forEach(r => {
    const div = document.createElement("div");
    div.className = "report-card";

    const priority = getPriority(r.description);

    div.innerHTML = `
      <h4>${r.animalType || "Animal"}</h4>
      <p>${r.location || ""}</p>
      <p>${r.description || ""}</p>
      <p class="${priority.toLowerCase()}">${priority}</p>
      <p>Status: ${r.status || "Pending"}</p>

      <button onclick="markResolved('${r._id}')">Resolve</button>
      <button onclick="deleteReport('${r._id}')" style="background:red">Delete</button>
    `;

    container.appendChild(div);
  });
}

/*  IMPROVED PRIORITY (SCORING SYSTEM) */
function getPriority(desc = "") {
  desc = desc.toLowerCase();

  let score = 0;

  const high = [
    "injured", "accident", "hurt", "wounded", "bleeding",
    "hit", "critical", "fracture", "unconscious", "emergency"
  ];

  const medium = [
    "stray", "hungry", "lost", "weak", "sick",
    "abandoned", "thin"
  ];

  high.forEach(word => {
    if (desc.includes(word)) score += 2;
  });

  medium.forEach(word => {
    if (desc.includes(word)) score += 1;
  });

  if (score >= 2) return "HIGH";
  if (score === 1) return "MEDIUM";
  return "LOW";
}

/* DASHBOARD */
function updateDashboard() {
  const el = document.getElementById("totalReports");
  if (el) el.textContent = reports.length;
}

/* REPORT FORM */
const reportForm = document.getElementById("reportForm");
if (reportForm) {
  reportForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const item = {
      reporterName: document.getElementById("reporterName").value,
      reporterContact: document.getElementById("reporterContact").value,
      animalType: document.getElementById("animalType").value,
      location: document.getElementById("location").value,
      description: document.getElementById("description").value
    };

    try {
      await fetch(`${API}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item)
      });

      reportForm.reset();
      alert("✅ Report submitted successfully!");
      await loadReports();
      showPage("browse");
    } catch (err) {
      console.error("Report failed:", err);
    }
  });
}

/* ADOPT FORM */
const adoptForm = document.getElementById("adoptForm");
if (adoptForm) {
  adoptForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const item = {
      name: document.getElementById("adopterName").value,
      contact: document.getElementById("adopterContact").value,
      animal: document.getElementById("preferredAnimal").value,
      reason: document.getElementById("adoptReason").value
    };

    try {
      await fetch(`${API}/adopt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item)
      });

      adoptForm.reset();
      alert("Adoption request submitted!");
    } catch (err) {
      console.error(err);
    }
  });
}

/* UPDATE */
async function markResolved(id) {
  await fetch(`${API}/report/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "Resolved" })
  });
}

/* DELETE */
async function deleteReport(id) {
  await fetch(`${API}/report/${id}`, {
    method: "DELETE"
  });
}

/* SOCKETS */
socket.on("connect", () => {
  console.log("✅ Socket connected:", socket.id);
});

socket.on("newReport", (data) => {
  reports.unshift(data);
  renderReports();
  updateDashboard();
});

socket.on("updateReport", (updated) => {
  reports = reports.map(r => r._id === updated._id ? updated : r);
  renderReports();
});

socket.on("deleteReport", (id) => {
  reports = reports.filter(r => r._id !== id);
  renderReports();
});

/* INITIAL LOAD */
loadReports();