import { fetchEventsPage } from "../api.js";
import { formatTimestamp, formatEventType } from "../ui.js";

const renderHistory = () => `
  <section class="section">
    <div class="section__header">
      <h2 class="section__title">Historija događaja</h2>
      <div class="form-row">
        <select id="history-filter" class="select">
          <option value="1">Danas</option>
          <option value="7">Zadnjih 7 dana</option>
          <option value="30">Zadnjih 30 dana</option>
        </select>
        <button id="history-load" class="btn btn--ghost" type="button">Učitaj još</button>
      </div>
    </div>
    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Vrijeme</th>
            <th>Tip</th>
            <th>Delta Weight</th>
            <th>Device ID</th>
          </tr>
        </thead>
        <tbody id="history-body"></tbody>
      </table>
    </div>
  </section>
`;

const mountHistory = ({ root, deviceId }) => {
    root.innerHTML = renderHistory();
    if (!deviceId) return () => {};

    const body = document.getElementById("history-body");
    const filter = document.getElementById("history-filter");
    const loadMoreBtn = document.getElementById("history-load");

    let lastDoc = null;

    const renderRows = (rows, append = false) => {
        if (!append) body.innerHTML = "";
        rows.forEach((event) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
        <td>${formatTimestamp(event.timestamp)}</td>
        <td>${formatEventType(event.type)}</td>
        <td>${event.deltaWeight ?? "--"} g</td>
        <td>${deviceId}</td>
      `;
            body.appendChild(tr);
        });
    };

    const loadData = async (append = false) => {
        const days = Number(filter.value);
        const result = await fetchEventsPage({
            deviceId,
            days,
            limitCount: 10,
            lastDoc: append ? lastDoc : null
        });
        renderRows(result.docs, append);
        lastDoc = result.lastDoc;
        loadMoreBtn.disabled = !lastDoc;
    };

    filter.addEventListener("change", () => {
        lastDoc = null;
        loadData(false);
    });

    loadMoreBtn.addEventListener("click", () => {
        if (lastDoc) {
            loadData(true);
        }
    });

    loadData(false);

    return () => {};
};

export { mountHistory };