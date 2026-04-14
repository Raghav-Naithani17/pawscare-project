const API = window.location.origin;
const socket = io();

let reports = [];

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

async function loadReports() {
  const res = await fetch(`${API}/reports`);
  reports = await res.json();
  renderReports();
  document.getElementById("totalReports").textContent = reports.length;
}

function renderReports() {
  const container = document.getElementById("reportList");
  container.innerHTML = "";

  reports.forEach(r => {
    const div = document.createElement("div");
    div.className = "report-card";

    div.innerHTML = `
      <img src="https://source.unsplash.com/300x200/?${r.animalType}">
      <h3>${r.animalType}</h3>
      <p>${r.location}</p>
      <p>${r.description}</p>
      <p>Status: ${r.status}</p>
    `;

    container.appendChild(div);
  });
}

/* REPORT */
document.getElementById("reportForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    reporterName: document.getElementById("reporterName").value,
    reporterContact: document.getElementById("reporterContact").value,
    animalType: document.getElementById("animalType").value,
    location: document.getElementById("location").value,
    description: document.getElementById("description").value,
    createdAt: new Date().toISOString()
  };

  await fetch(`${API}/report`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(data)
  });

  loadReports();
  showPage("browse");
});

/* SOCKET */
socket.on("newReport", (data) => {
  reports.unshift(data);
  renderReports();
});

/* INIT */
loadReports();