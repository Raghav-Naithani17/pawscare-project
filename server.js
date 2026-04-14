
const socket = io();

let reports = [];

/* PAGE NAVIGATION */
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* IMAGE FUNCTION (FIXED) */
function getAnimalImage(type = "") {
  type = type.toLowerCase();

  if (type.includes("dog")) return "https://images.unsplash.com/photo-1518717758536-85ae29035b6d";
  if (type.includes("cat")) return "https://images.unsplash.com/photo-1595433562696-9a5fbe6d0a9c";
  if (type.includes("cow")) return "https://images.unsplash.com/photo-1500595046743-ddf4d3d753fd";
  if (type.includes("bird")) return "https://images.unsplash.com/photo-1501706362039-c6e08a1b3e2a";

  return "https://images.unsplash.com/photo-1548199973-03cce0bbc87b"; // default
}

/* LOAD REPORTS */
async function loadReports() {
  try {
    const res = await fetch(`${API}/reports`);
    reports = await res.json();
    renderReports();
    updateDashboard();
  } catch (err) {
    console.error("Error loading reports:", err);
  }
}

/* RENDER REPORTS */
function renderReports() {
  const container = document.getElementById("reportList");
  container.innerHTML = "";

  reports.forEach(r => {
    const div = document.createElement("div");
    div.className = "report-card";

    div.innerHTML = `
      <img src="${getAnimalImage(r.animalType)}" />
      <h3>${r.animalType || "Animal"}</h3>
      <p><strong>Location:</strong> ${r.location || ""}</p>
      <p>${r.description || ""}</p>
      <p><strong>Status:</strong> ${r.status || "Pending"}</p>
    `;

    container.appendChild(div);
  });
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

  try {
    await fetch(`${API}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item)
    });

    document.getElementById("reportForm").reset();
    await loadReports();
    showPage("browse");

  } catch (err) {
    console.error("Error submitting report:", err);
  }
});

/* ADOPT FORM */
document.getElementById("adoptForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const item = {
    name: document.getElementById("adopterName").value,
    contact: document.getElementById("adopterContact").value,
    animal: document.getElementById("preferredAnimal").value,
    reason: document.getElementById("adoptReason").value,
    createdAt: new Date().toISOString()
  };

  try {
    await fetch(`${API}/adopt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item)
    });

    document.getElementById("adoptForm").reset();
    alert("Adoption request submitted!");

  } catch (err) {
    console.error(err);
  }
});

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