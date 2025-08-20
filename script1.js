function addEntry(entryData = null) {
  const div = document.createElement("div");
  div.className = "entry";
  const today = new Date().toISOString().split("T")[0];

  div.innerHTML = `
    <label>From: <input type="date" class="date-from" value="${
      entryData?.from || today
    }" max="${today}"></label>
    <label>To: <input type="date" class="date-to" value="${
      entryData?.to || today
    }" max="${today}"></label>
    <label>Amount: <input type="number" class="amount" value="${
      entryData?.amount || ""
    }" placeholder="₹"></label>
    <span class="entry-total"></span>
    <button onclick="deleteEntry(this)">Delete</button>
  `;

  document.getElementById("entries").appendChild(div);
}

function deleteEntry(btn) {
  btn.parentElement.remove();
  calculateTotal();
  saveData();
}

function calculateTotal() {
  let byaaj = parseFloat(document.getElementById("global-byaaj").value);
  if (isNaN(byaaj)) byaaj = 3;

  const entries = document.querySelectorAll(".entry");
  let totalPrincipal = 0,
    totalInterest = 0;

  entries.forEach((entry) => {
    const from = new Date(entry.querySelector(".date-from").value);
    const to = new Date(entry.querySelector(".date-to").value);
    let amount = parseFloat(entry.querySelector(".amount").value);
    const totalSpan = entry.querySelector(".entry-total");

    if (isNaN(amount)) amount = 0;
    if (!from || !to || isNaN(from.getTime()) || isNaN(to.getTime())) return;

    const diffTime = to - from;
    let totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (totalDays < 0) totalDays = 0;

    const months = Math.floor(totalDays / 30);
    const days = totalDays % 30;

    const byaajPerDay = (amount * byaaj) / (30 * 100);
    const interest = byaajPerDay * totalDays;
    const finalAmount = amount + interest;

    totalPrincipal += amount;
    totalInterest += interest;

    totalSpan.innerText = `Byaaj: ₹${interest.toFixed(
      2
    )}, Final: ₹${finalAmount.toFixed(2)} (📆 ${months}M ${days}D)`;
  });

  const grandTotal = totalPrincipal + totalInterest;
  document.getElementById(
    "total"
  ).innerText = `Grand Total: ₹${grandTotal.toFixed(2)}`;
  saveData();
}

function downloadExcel() {
  let byaaj = parseFloat(document.getElementById("global-byaaj").value);
  if (isNaN(byaaj)) byaaj = 3;

  const rows = [
    ["From", "To", "Amount", "Byaaj/Day", "Final Byaaj", "Final Amount"],
  ];
  let totalFinal = 0;

  document.querySelectorAll(".entry").forEach((entry) => {
    const from = entry.querySelector(".date-from").value;
    const to = entry.querySelector(".date-to").value;
    let amount = parseFloat(entry.querySelector(".amount").value);
    if (isNaN(amount)) amount = 0;

    const days = Math.floor(
      (new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24)
    );
    const byaajPerDay = (amount * byaaj) / (30 * 100);
    const finalByaaj = byaajPerDay * days;
    const finalAmount = amount + finalByaaj;

    rows.push([
      from,
      to,
      amount.toFixed(2),
      byaajPerDay.toFixed(2),
      finalByaaj.toFixed(2),
      finalAmount.toFixed(2),
    ]);

    totalFinal += finalAmount;
  });

  rows.push(["", "", "", "", "Total", totalFinal.toFixed(2)]);
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Interest");
  XLSX.writeFile(book, "entries.xlsx");
}

function resetAll() {
  if (confirm("Wanna erase everything like your guilt?")) {
    localStorage.removeItem("entriesData");
    localStorage.removeItem("byaajRate");
    document.getElementById("entries").innerHTML = "";
    document.getElementById("total").innerText = "";
    document.getElementById("global-byaaj").value = "";
    addEntry();
  }
}

function saveData() {
  const entries = [];
  document.querySelectorAll(".entry").forEach((entry) => {
    entries.push({
      from: entry.querySelector(".date-from").value,
      to: entry.querySelector(".date-to").value,
      amount: entry.querySelector(".amount").value,
    });
  });
  localStorage.setItem("entriesData", JSON.stringify(entries));
  localStorage.setItem(
    "byaajRate",
    document.getElementById("global-byaaj").value
  );
}

function loadData() {
  const entriesData = JSON.parse(localStorage.getItem("entriesData") || "[]");
  const byaajRate = localStorage.getItem("byaajRate") || "";
  document.getElementById("global-byaaj").value = byaajRate;
  entriesData.forEach((data) => addEntry(data));
  if (entriesData.length === 0) addEntry();
  calculateTotal();
}

window.onload = loadData;
