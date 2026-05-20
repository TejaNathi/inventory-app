const appServices = () => window.inventoryAppServices || {};

const toast = (message) => appServices().toast?.(message);
import { API_URL } from "../js/config.js";
const API_BASE_URL = API_URL;

async function loadProjects() {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${API_BASE_URL}/api/projects/wip`,

      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await res.json().catch(() => []);

    if (!res.ok) {
      throw new Error(data.error || "Failed loading WIP");
    }

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

  if (!container) {
    return;
  }

  const projects = groupProjects(rows);

  if (!projects.length) {
    container.innerHTML = `

      <div class="empty">

        <div class="empty-icon">
          ⟳
        </div>

        <p>
          No active WIP projects
        </p>

      </div>

    `;

    return;
  }

  container.innerHTML = projects
    .map(
      (project) => `

      <div class="project-card">

        <!-- TOP -->

        <div class="project-top">

          <div>

            <div class="project-title">

              ${project.project_name}

            </div>

            <div class="project-subtitle">

              Department:
              ${project.department || "-"}

            </div>

          </div>



          <button
            class="danger-btn"
          >

            Delete Project

          </button>

        </div>



        <!-- TABLE -->

        <table class="wip-table">

          <thead>

            <tr>

              <th>
                Item Code
              </th>

              <th>
                Item
              </th>

              <th>
                Category
              </th>

              <th>
                Unit
              </th>

              <th>
                Qty
              </th>

              <th>
                Rate
              </th>

              <th>
                Purpose
              </th>

              <th>
                Date
              </th>

            </tr>

          </thead>



          <tbody>

            ${project.items
              .map(
                (item) => `

              <tr>

                <td class="mono">

                  ${item.item_code || "-"}

                </td>

                <td>

                  ${item.canonical_name || "-"}

                </td>

                <td>

                  ${item.category || "-"}

                </td>

                <td>

                  ${item.unit || "-"}

                </td>

                <td class="mono">

                  ${item.qty_used || 0}

                </td>

                <td class="mono">

                  ₹${item.rate_per_unit || 0}

                </td>

                <td>

                  ${item.purpose || "-"}

                </td>

                <td>

                  ${new Date(item.created_at).toLocaleDateString()}

                </td>

              </tr>

            `,
              )
              .join("")}

          </tbody>

        </table>



        <!-- ACTIONS -->

        <div class="project-actions">

          <button
            class="secondary-btn"
          >

            + Add Item

          </button>

        </div>

      </div>

    `,
    )
    .join("");
}

// ─────────────────────────────────────────────
// OPEN MODAL
// ─────────────────────────────────────────────

function openNewProjectModal() {
  document.getElementById("new-project-modal").style.display = "flex";
}

// ─────────────────────────────────────────────
// CLOSE MODAL
// ─────────────────────────────────────────────

function closeNewProjectModal() {
  document.getElementById("new-project-modal").style.display = "none";
}

async function createNewProject() {
  try {
    const token = localStorage.getItem("token");

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const project_name = document.getElementById("project-name").value;

    const notes = document.getElementById("project-notes").value;

    if (!project_name) {
      toast("Enter project name");

      return;
    }

    const res = await fetch(
      `${API_BASE_URL}/api/projects`,

      {
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
      },
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || "Failed creating project");
    }

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
