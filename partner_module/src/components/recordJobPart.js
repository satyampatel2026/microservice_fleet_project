import Swal from "sweetalert2";
import { getInventory, useParts } from "../services/inventoryService";

export default async function recordJobPart(job) {
  try {
    const items = (await getInventory()).filter(item => Number(item.quantity) > 0);
    if (!items.length) {
      await Swal.fire("No stock available", "Add stock in Inventory first.", "info");
      return;
    }

    const list = document.createElement("div");
    list.className = "max-h-[50vh] overflow-y-auto text-left";
    const entries = items.map(item => {
      const row = document.createElement("div");
      row.className = "grid grid-cols-[1fr_5rem] items-center gap-3 border-b border-slate-100 py-3";
      row.innerHTML = `
        <label class="flex cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" class="h-4 w-4 accent-teal-700">
          <span><strong class="block text-slate-800"></strong><small class="block text-slate-500"></small></span>
        </label>
        <input type="number" required disabled class="w-full rounded-md border border-slate-300 px-2 py-1 text-sm disabled:opacity-40">`;
      const check = row.querySelector("[type=checkbox]");
      const input = row.querySelector("[type=number]");
      const hint = row.querySelector("small");
      row.querySelector("strong").textContent = item.name;
      input.setAttribute("aria-label", "Quantity used for " + item.name);
      input.step = item.unit === "litre" ? "0.001" : "1";
      input.min = input.step;
      input.max = item.quantity;
      input.value = String(Math.min(1, Number(item.quantity)));
      function update() {
        input.disabled = !check.checked;
        let text = "Available: " + Number(item.quantity) + " " + item.unit;
        if (check.checked && input.checkValidity()) {
          text += " · After saving: " + Number((Number(item.quantity) - input.valueAsNumber).toFixed(3));
        }
        hint.textContent = text;
      }
      check.onchange = update;
      input.oninput = update;
      update();
      list.appendChild(row);
      return { item, check, input };
    });

    let lastSelection = "";
    let payload;
    const result = await Swal.fire({
      titleText: "Record parts used",
      html: list,
      width: "min(520px, 100%)",
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonText: "Save selected parts",
      confirmButtonColor: "#0f766e",
      focusConfirm: false,
      showLoaderOnConfirm: true,
      allowEscapeKey: () => !Swal.isLoading(),
      allowOutsideClick: () => !Swal.isLoading(),
      didOpen() {
        const context = document.createElement("p");
        context.className = "mb-2 text-sm text-slate-500";
        context.textContent = [job.request_code, job.vehicle_number].filter(Boolean).join(" · ");
        list.prepend(context);
      },
      async preConfirm() {
        const parts = [];
        for (const { item, check, input } of entries) {
          if (!check.checked) continue;
          if (!input.checkValidity()) {
            Swal.showValidationMessage("Check the quantity for the selected item.");
            input.focus();
            return false;
          }
          parts.push({ itemId: Number(item.item_id), quantity: input.valueAsNumber });
        }
        if (!parts.length) {
          Swal.showValidationMessage("Select at least one part.");
          return false;
        }
        const selection = JSON.stringify(parts);
        if (selection !== lastSelection) {
          payload = parts.map(part => ({ ...part, operationId: crypto.randomUUID() }));
          lastSelection = selection;
        }
        list.inert = true;
        try {
          return await useParts(job.request_id, payload);
        } catch (error) {
          // SweetAlert renders validation messages as HTML; insert the message as text.
          Swal.showValidationMessage("Unable to save.");
          Swal.getValidationMessage().textContent = error.message;
          return false;
        } finally {
          list.inert = false;
        }
      },
    });
    if (result.isConfirmed) await Swal.fire("Parts recorded", "Inventory updated for this job.", "success");
  } catch (error) {
    await Swal.fire({ icon: "error", titleText: "Unable to open parts form", text: error.message });
  }
}
