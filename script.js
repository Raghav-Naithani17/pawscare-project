const API = "http://localhost:3000";
const socket = io("http://localhost:3000");

let reports = [];

/* PAGE NAVIGATION */
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* LOAD REPORTS */
async function loadReports() {
  const res = await fetch(`${API}/reports`);
  reports = await res.json();
  renderReports();
  updateDashboard();
}

/* RENDER REPORTS */
function renderReports() {
  const container = document.getElementById("reportList");
  container.innerHTML = "";

  reports.forEach(r => {
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

/* AI PRIORITY */
function getPriority(desc = "") {
  desc = desc.toLowerCase();
  if (desc.includes("injured") || desc.includes("accident")) return "HIGH";
  if (desc.includes("stray") || desc.includes("hungry")) return "MEDIUM";
  return "LOW";
}

/* DASHBOARD */
function updateDashboard() {
  document.getElementById("totalReports").textContent = reports.length;
}

/* REPORT FORM */
document.getElementById("reportForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const item = {
    reporterName: document.getElementById("reporterName").value,
    reporterContact: document.getElementById("reporterContact").value,
    animalType: document.getElementById("animalType").value,
    location: document.getElementById("location").value,
    description: document.getElementById("description").value,
    createdAt: new Date().toISOString()
  };

  await fetch(`${API}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item)
  });

  document.getElementById("reportForm").reset();
  await loadReports();
  showPage("browse");
});

/* ADOPT FORM (NOW SAVES TO /adopt) */
document.getElementById("adoptForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const item = {
    name: document.getElementById("adopterName").value,
    contact: document.getElementById("adopterContact").value,
    animal: document.getElementById("preferredAnimal").value,
    reason: document.getElementById("adoptReason").value,
    createdAt: new Date().toISOString()
  };

  await fetch(`${API}/adopt`, {   // ✅ FIXED HERE
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item)
  });

  document.getElementById("adoptForm").reset();
  alert("Adoption request submitted!");
});

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
// your existing code above 👆


// ===============================
// ADD THIS AT THE BOTTOM 👇
document.getElementById("reportBtn").addEventListener("click", async () => {
  const data = {
    reporterName: "Test User",
    issue: "Test Issue",
    location: "Test Location"
  };

  try {
    const res = await fetch("https://pawscare-project.onrender.com/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await res.text();
    console.log(result);
    alert("Report submitted!");
  } catch (err) {
    console.error(err);
    alert("Error submitting report");
  }
});