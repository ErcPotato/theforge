const container = document.getElementById("cardContainer");
let activeCard = null;
const capitalizeWords = (text) =>
  text.replace(
    /\b\w+/g,
    (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  );
function saveData() {
  const cards = [];
  [...container.children].forEach((col) => {
    const card = col.querySelector(".card");
    const title = card.querySelector("h5.card-title").textContent;
    const isDone = card.classList.contains("done");
    const items = [];
    card.querySelectorAll("ul li").forEach((li) => {
      const checkbox = li.querySelector('input[type="checkbox"]');
      const span = li.querySelector("span");
      const badge = li.querySelector(".badge");
      items.push({
        name: span.textContent,
        qty: badge ? badge.textContent.replace("x", "") : "",
        checked: checkbox.checked,
      });
    });
    cards.push({ title, isDone, items });
  });
  localStorage.setItem("forgeCards", JSON.stringify(cards));
}
function loadData() {
  const data = localStorage.getItem("forgeCards");
  if (!data) return;
  const cards = JSON.parse(data);
  container.innerHTML = "";
  cards.forEach((cardData) => {
    const col = createCardElement(
      cardData.title,
      cardData.isDone,
      cardData.items
    );
    container.appendChild(col);
  });
  updateLayout();
}
function createCardElement(title, isDone = false, items = []) {
  const col = document.createElement("div");
  const totalQty = items.reduce(
    (sum, item) => sum + (parseFloat(item.qty) || 0),
    0
  );

  const itemsHTML = items
    .map((item) => {
      const itemQty = parseFloat(item.qty) || 0;
      const percent =
        totalQty > 0 ? ((itemQty / totalQty) * 100).toFixed(1) : 0;
      const percentHTML =
        totalQty > 0
          ? `<span class="text-muted small fw-bold" style="min-width: 45px; text-align: right;">${percent}%</span>`
          : "";

      return `
        <li class="list-group-item d-flex justify-content-between align-items-center ${
          item.checked ? "item-done" : ""
        }">
          <div class="d-flex align-items-center gap-2">
            <input type="checkbox" class="form-check-input" ${
              item.checked ? "checked" : ""
            }>
            <span>${item.name}</span>
            ${
              item.qty
                ? `<span class="badge bg-secondary">x${item.qty}</span>`
                : ""
            }
          </div>
          ${percentHTML} 
        </li>`;
    })
    .join("");
  const progress =
    items.length > 0
      ? (items.filter((i) => i.checked).length / items.length) * 100
      : 0;
  const checkedCount = items.filter((i) => i.checked).length;
  const totalCount = items.length;

  col.innerHTML = `
    <div class="card h-100 ${isDone ? "done" : ""}">
      <div class="card-body d-flex flex-column">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <h5 class="card-title mb-0">${title}</h5>
          <div class="d-flex align-items-center gap-2">
            <span class="stats-badge">${checkedCount}/${totalCount}</span>
          </div>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: ${progress}%"></div>
        </div>
        <ul class="list-group list-group-flush mb-3 flex-grow-1">${itemsHTML}</ul>
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-primary flex-grow-1 edit-btn">✏️ Edit</button>
          <button class="btn btn-sm btn-outline-success duplicate-btn" title="Duplicate recipe">📋</button>
          <button class="btn btn-sm btn-danger delete-btn">🗑️</button>
        </div>
      </div>
    </div>`;
  return col;
}
function updateLayout() {
  const cards = [...container.children];
  if (cards.length === 1) {
    cards[0].className = "col-12 col-md-8";
  } else {
    cards.forEach((c) => (c.className = "col-12 col-md-6"));
  }
}
function addCard() {
  const input = document.getElementById("cardTitleInput");
  if (!input.value.trim()) return;
  const title = capitalizeWords(input.value.trim());
  const col = createCardElement(title);
  container.appendChild(col);
  attachCardEvents(col);
  input.value = "";
  updateLayout();
  saveData();
}
function attachCardEvents(col) {
  const card = col.querySelector(".card");
  card.querySelectorAll("ul li input[type='checkbox']").forEach((cb) => {
    cb.addEventListener("change", function () {
      this.closest("li").classList.toggle("item-done", this.checked);
      updateCardProgress(card);
      saveData();
    });
  });
  card.querySelector(".edit-btn").addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    openItemModal(card);
  });
  card.querySelector(".duplicate-btn").addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    duplicateCard(card);
  });
  card.querySelector(".delete-btn").addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    deleteCard(col);
  });
}
function openItemModal(card) {
  activeCard = card;
  document.getElementById("modalCardTitle").value =
    card.querySelector("h5.card-title").textContent;
  const items = [...card.querySelectorAll("ul li")].map((li) => {
    const checkbox = li.querySelector('input[type="checkbox"]');
    const span = li.querySelector("span");
    const badge = li.querySelector(".badge");
    return {
      name: span.textContent,
      qty: badge ? badge.textContent.replace("x", "") : "",
      checked: checkbox.checked,
    };
  });
  const modalList = document.getElementById("modalItemList");
  modalList.innerHTML = items
    .map(
      (item) => `
    <li class="list-group-item d-flex justify-content-between align-items-center ${
      item.checked ? "item-done" : ""
    }">
      <div class="d-flex align-items-center gap-2">
        <input type="checkbox" class="form-check-input" ${
          item.checked ? "checked" : ""
        }>
        <span>${item.name}</span>
        ${
          item.qty ? `<span class="badge bg-secondary">x${item.qty}</span>` : ""
        }
      </div>
      <button class="btn btn-sm btn-outline-danger delete-item-btn">✕</button>
    </li>
  `
    )
    .join("");
  modalList.querySelectorAll(".delete-item-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      this.closest("li").remove();
    });
  });
  modalList.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener("change", function () {
      this.closest("li").classList.toggle("item-done", this.checked);
    });
  });
  new bootstrap.Modal(document.getElementById("itemModal")).show();
}
function addModalItem() {
  const nameInput = document.getElementById("modalItemName");
  const qtyInput = document.getElementById("modalItemQty");
  if (!nameInput.value.trim()) return;
  const name = capitalizeWords(nameInput.value.trim());
  const li = document.createElement("li");
  li.className =
    "list-group-item d-flex justify-content-between align-items-center";
  li.innerHTML = `
    <div class="d-flex align-items-center gap-2">
      <input type="checkbox" class="form-check-input">
      <span>${name}</span>
      ${
        qtyInput.value
          ? `<span class="badge bg-secondary">x${qtyInput.value}</span>`
          : ""
      }
    </div>
    <button class="btn btn-sm btn-outline-danger delete-item-btn">✕</button>
  `;
  const deleteBtn = li.querySelector(".delete-item-btn");
  deleteBtn.addEventListener("click", function () {
    li.remove();
  });
  const checkbox = li.querySelector('input[type="checkbox"]');
  checkbox.addEventListener("change", function () {
    li.classList.toggle("item-done", this.checked);
  });
  document.getElementById("modalItemList").appendChild(li);
  nameInput.value = "";
  qtyInput.value = "";
}
document.getElementById("itemModal").addEventListener("hidden.bs.modal", () => {
  if (!activeCard) return;

  const modalItems = [...document.getElementById("modalItemList").children].map(
    (li) => {
      const badge = li.querySelector(".badge");
      return {
        name: li.querySelector("span").textContent,
        qty: badge ? badge.textContent.replace("x", "") : "",
        checked: li.querySelector('input[type="checkbox"]').checked,
      };
    }
  );
  const totalQty = modalItems.reduce(
    (sum, item) => sum + (parseFloat(item.qty) || 0),
    0
  );
  activeCard.querySelector("h5.card-title").textContent = capitalizeWords(
    document.getElementById("modalCardTitle").value.trim()
  );
  const cardList = activeCard.querySelector("ul");
  cardList.innerHTML = modalItems
    .map((item) => {
      const itemQty = parseFloat(item.qty) || 0;
      const percent =
        totalQty > 0 ? ((itemQty / totalQty) * 100).toFixed(1) : 0;
      const percentHTML =
        totalQty > 0
          ? `<span class="text-muted small fw-bold" style="min-width: 45px; text-align: right;">${percent}%</span>`
          : "";
      return `
      <li class="list-group-item d-flex justify-content-between align-items-center ${
        item.checked ? "item-done" : ""
      }">
        <div class="d-flex align-items-center gap-2">
          <input type="checkbox" class="form-check-input" ${
            item.checked ? "checked" : ""
          }>
          <span>${item.name}</span>
          ${
            item.qty
              ? `<span class="badge bg-secondary">x${item.qty}</span>`
              : ""
          }
        </div>
        ${percentHTML}
      </li>`;
    })
    .join("");
  cardList.querySelectorAll("input[type='checkbox']").forEach((cb) => {
    cb.addEventListener("change", function () {
      this.closest("li").classList.toggle("item-done", this.checked);
      updateCardProgress(activeCard);
      saveData();
    });
  });
  updateCardProgress(activeCard);
  saveData();
});
function updateCardProgress(card) {
  const items = card.querySelectorAll("ul li");
  const checkedItems = card.querySelectorAll(
    "ul li input[type='checkbox']:checked"
  );
  const progress =
    items.length > 0 ? (checkedItems.length / items.length) * 100 : 0;
  card.querySelector(".progress-bar-fill").style.width = progress + "%";
  card.querySelector(
    ".stats-badge"
  ).textContent = `${checkedItems.length}/${items.length}`;
  if (items.length > 0 && checkedItems.length === items.length) {
    card.classList.add("done");
  } else {
    card.classList.remove("done");
  }
}
function duplicateCard(card) {
  const title = card.querySelector("h5.card-title").textContent + " (Copy)";
  const items = [...card.querySelectorAll("ul li")].map((li) => {
    const checkbox = li.querySelector('input[type="checkbox"]');
    const span = li.querySelector("span");
    const badge = li.querySelector(".badge");
    return {
      name: span.textContent,
      qty: badge ? badge.textContent.replace("x", "") : "",
      checked: false,
    };
  });
  const col = createCardElement(title, false, items);
  container.appendChild(col);
  attachCardEvents(col);
  updateLayout();
  saveData();
}
let cardToDelete = null;
function deleteCard(col) {
  cardToDelete = col;
  new bootstrap.Modal(document.getElementById("deleteConfirmModal")).show();
}
document.getElementById("confirmDeleteBtn").addEventListener("click", () => {
  if (cardToDelete) {
    cardToDelete.remove();
    cardToDelete = null;
    updateLayout();
    saveData();
  }
  bootstrap.Modal.getInstance(
    document.getElementById("deleteConfirmModal")
  ).hide();
});
loadData();
container.querySelectorAll(".col-12, .col-md-6, .col-md-8").forEach((col) => {
  attachCardEvents(col);
});
function renderItems(items, listElement) {
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  listElement.innerHTML = "";
  items.forEach((item) => {
    const percent = ((item.qty / totalQty) * 100).toFixed(1);

    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between";

    li.innerHTML = `
      <span>${item.qty} ${item.name}</span>
      <span class="text-muted">${percent}%</span>
    `;
    listElement.appendChild(li);
  });
}
