const API = window.location.origin;
const socket = io();

let reports = [];

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

/* ESCAPE HTML (SECURITY) */
function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, s => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[s]));
}

/* RENDER REPORTS */
function renderReports() {
  const container = document.getElementById("reportList");
  if (!container) return;

  container.innerHTML = "";

  reports.forEach(r => {
    const div = document.createElement("div");
    div.className = "report-card";

    const priority = getPriority(r.description);

    div.innerHTML = `
      <h4>${escapeHtml(r.animalType)}</h4>
      <p>${escapeHtml(r.location)}</p>
      <p>${escapeHtml(r.description)}</p>

      ${r.image ? `<img src="/uploads/${r.image}" width="100" style="margin-top:10px;">` : ""}

      <p class="${priority.toLowerCase()}">${priority}</p>
      <p>Status: ${r.status}</p>
      <p style="font-size:12px;">${new Date(r.createdAt).toLocaleString()}</p>

      <button onclick="markResolved('${r._id}')">Resolve</button>
      <button onclick="deleteReport('${r._id}')" style="background:red">Delete</button>
    `;

    container.appendChild(div);
  });
}

/* AI PRIORITY */
function getPriority(desc = "") {
  desc = desc.toLowerCase();
  if (desc.includes("injured") || desc.includes("accident")) return "HIGH";
  if (desc.includes("stray") || desc.includes("hungry")) return "MEDIUM";
  return "LOW";
}

/* DASHBOARD */
function updateDashboard() {
  const el = document.getElementById("totalReports");
  if (el) el.textContent = reports.length;
}

/* REPORT FORM (WITH IMAGE UPLOAD) */
const reportForm = document.getElementById("reportForm");

if (reportForm) {
  reportForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append("reporterName", document.getElementById("reporterName").value);
    formData.append("reporterContact", document.getElementById("reporterContact").value);
    formData.append("animalType", document.getElementById("animalType").value);
    formData.append("location", document.getElementById("location").value);
    formData.append("description", document.getElementById("description").value);

    const file = document.getElementById("image").files[0];
    if (file) formData.append("image", file);

    try {
      await fetch(`${API}/report`, {
        method: "POST",
        body: formData
      });

      reportForm.reset();
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
  if (!confirm("Are you sure?")) return;

  await fetch(`${API}/report/${id}`, {
    method: "DELETE"
  });
}

/* SOCKETS */
socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
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

/* INIT */
loadReports();