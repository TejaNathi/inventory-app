const appServices = () => window.inventoryAppServices || {};
const toast = (message) => appServices().toast?.(message);
import { API_URL } from "../js/config.js";
const API_BASE_URL = API_URL;

async function loadProjects() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/api/projects/wip`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => []);
    if (!res.ok) throw new Error(data.error || "Failed loading WIP");
    renderProjects(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error(err);
    toast(err.message || "Failed loading WIP");
  }
}

function groupProjects(rows) {
  const grouped = {};
  for (const row of rows) {
    if (!grouped[row.project_id]) {
      grouped[row.project_id] = {
        project_id: row.project_id,
        project_name: row.project_name,
        department: row.department,
        items: [],
      };
    }
    grouped[row.project_id].items.push(row);
  }
  return Object.values(grouped);
}

function renderProjects(rows) {
  const container = document.getElementById("wip-project-list");
  if (!container) return;

  const projects = groupProjects(rows);
  if (!projects.length) {
    container.innerHTML = `<div class="empty"><div class="empty-icon">⟳</div><p>No active WIP projects</p></div>`;
    return;
  }

  container.innerHTML = projects
    .map(
      (project) => `
      <div class="project-card" data-project-id="${project.project_id}">
        <div class="project-top">
          <div>
            <div class="project-title">${project.project_name}</div>
            <div class="project-subtitle">Department: ${project.department || "-"}</div>
          </div>
          <button class="danger-btn" data-action="delete-project" data-project-id="${project.project_id}">Delete Project</button>
        </div>
        <table class="wip-table" data-drop-project-id="${project.project_id}">
          <thead>
            <tr><th>Item Code</th><th>Item</th><th>Category</th><th>Unit</th><th>Qty</th><th>Rate</th><th>Purpose</th><th>Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${project.items
              .map(
                (item) => `
              <tr draggable="true" data-outward-id="${item.outward_id}" data-project-id="${project.project_id}">
                <td class="mono">${item.item_code || "-"}</td>
                <td>${item.canonical_name || "-"}</td>
                <td>${item.category || "-"}</td>
                <td>${item.unit || "-"}</td>
                <td class="mono">${item.qty_used || 0}</td>
                <td class="mono">₹${item.rate_per_unit || 0}</td>
                <td>${item.purpose || "-"}</td>
                <td>${new Date(item.created_at).toLocaleDateString()}</td>
                <td><button class="secondary-btn" data-action="return-item" data-outward-id="${item.outward_id}">Return to Master</button></td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `,
    )
    .join("");

  attachWipEventHandlers();
}

function attachWipEventHandlers() {
  document.querySelectorAll("[data-action='delete-project']").forEach((btn) => {
    btn.onclick = () => handleDeleteProject(btn.dataset.projectId);
  });

  document.querySelectorAll("[data-action='return-item']").forEach((btn) => {
    btn.onclick = () => handleReturnItem(btn.dataset.outwardId);
  });

  document
    .querySelectorAll("#wip-project-list tr[draggable='true']")
    .forEach((row) => {
      row.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/outward-id", row.dataset.outwardId);
        event.dataTransfer.setData(
          "text/source-project-id",
          row.dataset.projectId,
        );
      });
    });

  document.querySelectorAll(".wip-table").forEach((table) => {
    table.addEventListener("dragover", (event) => event.preventDefault());
    table.addEventListener("drop", async (event) => {
      event.preventDefault();
      const outwardId = event.dataTransfer.getData("text/outward-id");
      const sourceProjectId = event.dataTransfer.getData(
        "text/source-project-id",
      );
      const targetProjectId = table.dataset.dropProjectId;

      if (!outwardId || !targetProjectId || sourceProjectId === targetProjectId)
        return;
      await handleMoveItem(outwardId, targetProjectId);
    });
  });
}

async function handleDeleteProject(projectId) {
  if (!projectId || !confirm("Delete this project?")) return;
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Failed deleting project");
    toast("Project deleted");
    await loadProjects();
  } catch (err) {
    console.error(err);
    toast(err.message || "Failed deleting project");
  }
}

async function handleMoveItem(outwardId, targetProjectId) {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${API_BASE_URL}/api/projects/wip-item/${outwardId}/move`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ target_project_id: targetProjectId }),
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Failed moving item");
    toast("Item moved to project");
    await loadProjects();
  } catch (err) {
    console.error(err);
    toast(err.message || "Failed moving item");
  }
}

async function handleReturnItem(outwardId) {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${API_BASE_URL}/api/projects/wip-item/${outwardId}/return`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Failed returning item");
    toast("Item returned to master inventory");
    await loadProjects();
  } catch (err) {
    console.error(err);
    toast(err.message || "Failed returning item");
  }
}

function openNewProjectModal() {
  document.getElementById("new-project-modal").style.display = "flex";
}
function closeNewProjectModal() {
  document.getElementById("new-project-modal").style.display = "none";
}

async function createNewProject() {
  try {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const project_name = document.getElementById("project-name").value;
    const notes = document.getElementById("project-notes").value;
    if (!project_name) return toast("Enter project name");

    const res = await fetch(`${API_BASE_URL}/api/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        project_name,
        department: user.department,
        member_id: user.id,
        notes,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Failed creating project");
    closeNewProjectModal();
    toast("✓ Project created");
    await loadProjects();
  } catch (err) {
    console.error(err);
    toast(err.message || "Failed creating project");
  }
}

export {
  loadProjects,
  renderProjects,
  openNewProjectModal,
  closeNewProjectModal,
  createNewProject,
};
