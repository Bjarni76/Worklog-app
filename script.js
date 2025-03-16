document.addEventListener("DOMContentLoaded", function () {
    const workLogForm = document.getElementById("workLogForm");
    const workLogTableBody = document.getElementById("workLogTable");
    const totalHoursWorkedCell = document.getElementById("totalHoursWorked");
    const exportExcelButton = document.getElementById("exportToExcel");
    const pasteButton = document.getElementById("pasteEntry");
    const editTableButton = document.getElementById("editTable");
    const selectAllCheckbox = document.getElementById("selectAll");
    const copySelectedButton = document.getElementById("copySelected");
    const deleteSelectedButton = document.getElementById("deleteSelected");

    let workLogs = JSON.parse(localStorage.getItem("workLogs")) || [];
    let copiedEntry = null;
    let isEditing = false;

    function saveLogs() {
        localStorage.setItem("workLogs", JSON.stringify(workLogs));
    }

    function calculateUsedTime(startTime, endTime) {
        const [startHour, startMin] = startTime.split(":").map(Number);
        const [endHour, endMin] = endTime.split(":").map(Number);
        let totalMinutesWorked = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        if (totalMinutesWorked < 0) totalMinutesWorked += 1440;
        return `${String(Math.floor(totalMinutesWorked / 60)).padStart(2, "0")}:${String(totalMinutesWorked % 60).padStart(2, "0")}`;
    }

    function renderLogs() {
        workLogTableBody.innerHTML = "";
        let totalMinutes = 0;
        workLogs.forEach((log, index) => {
            const row = document.createElement("tr");
            // Removed per-row action column entirely
            row.innerHTML = `
                <td><input type="checkbox" class="row-checkbox" data-index="${index}"></td>
                <td contenteditable="${isEditing}">${log.client}</td>
                <td contenteditable="${isEditing}">${log.date}</td>
                <td contenteditable="${isEditing}">${log.startTime}</td>
                <td contenteditable="${isEditing}">${log.endTime}</td>
                <td>${log.totalHours}</td>
                <td contenteditable="${isEditing}">${log.description}</td>
            `;
            workLogTableBody.appendChild(row);
            totalMinutes += parseInt(log.totalHours.split(":")[0]) * 60 + parseInt(log.totalHours.split(":")[1]);
        });
        totalHoursWorkedCell.textContent = `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;

        // Reset "Select All" checkbox
        selectAllCheckbox.checked = false;

        // Row checkbox event listeners
        document.querySelectorAll(".row-checkbox").forEach(checkbox => {
            checkbox.addEventListener("change", function () {
                if (!this.checked) selectAllCheckbox.checked = false;
            });
        });

        // Save changes dynamically from editable cells
        document.querySelectorAll("td[contenteditable='true']").forEach(cell => {
            cell.addEventListener("input", function () {
                const row = this.parentElement;
                const index = row.querySelector(".row-checkbox").dataset.index;
                const cells = Array.from(row.children);
                // Mapping cells (offset by 1 for checkbox)
                if (cells[1] === this) workLogs[index].client = this.textContent.trim();
                else if (cells[2] === this) workLogs[index].date = this.textContent.trim();
                else if (cells[3] === this) {
                    workLogs[index].startTime = this.textContent.trim();
                    workLogs[index].totalHours = calculateUsedTime(workLogs[index].startTime, workLogs[index].endTime);
                }
                else if (cells[4] === this) {
                    workLogs[index].endTime = this.textContent.trim();
                    workLogs[index].totalHours = calculateUsedTime(workLogs[index].startTime, workLogs[index].endTime);
                }
                else if (cells[6] === this) workLogs[index].description = this.textContent.trim();
                saveLogs();
            });
        });
    }

    // "Select All" checkbox functionality
    selectAllCheckbox.addEventListener("change", function () {
        document.querySelectorAll(".row-checkbox").forEach(cb => cb.checked = this.checked);
    });

    // "Copy Selected" button
    copySelectedButton.addEventListener("click", function () {
        const selected = document.querySelectorAll(".row-checkbox:checked");
        if (selected.length === 0) {
            alert("Engin færslur valdar til að afrita!");
            return;
        }
        const index = selected[0].dataset.index;
        copiedEntry = { ...workLogs[index] };
        alert("Færsla afrituð frá völdum færslu!");
    });

    // "Delete Selected" button
    deleteSelectedButton.addEventListener("click", function () {
        const selected = document.querySelectorAll(".row-checkbox:checked");
        if (selected.length === 0) {
            alert("Engin færslur valdar til að eyða!");
            return;
        }
        const indexes = Array.from(selected).map(cb => parseInt(cb.dataset.index)).sort((a, b) => b - a);
        indexes.forEach(i => workLogs.splice(i, 1));
        saveLogs();
        renderLogs();
    });

    // "Paste Entry" button event listener (using existing button from index.html)
    pasteButton.addEventListener("click", function () {
        if (copiedEntry) {
            workLogs.push({ ...copiedEntry });
            saveLogs();
            renderLogs();
        } else {
            alert("Engin færsla hefur verið afrituð!");
        }
    });

    // "Edit Table" button toggles editing mode
    editTableButton.addEventListener("click", function () {
        isEditing = !isEditing;
        renderLogs();
        editTableButton.textContent = isEditing ? "Vista breytingar" : "Breyta töflu";
        if (!isEditing) saveLogs();
    });

    workLogForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const client = document.getElementById("client").value;
        const date = document.getElementById("date").value;
        const startTime = document.getElementById("startTime").value;
        const endTime = document.getElementById("endTime").value;
        const description = document.getElementById("description").value;
        const totalHours = calculateUsedTime(startTime, endTime);
        workLogs.push({ client, date, startTime, endTime, totalHours, description });
        saveLogs();
        renderLogs();
        workLogForm.reset();
    });

    exportExcelButton.addEventListener("click", function () {
        if (workLogs.length === 0) {
            alert("Engar færslur til að flytja út!");
            return;
        }
        let worksheet = XLSX.utils.json_to_sheet(workLogs);
        let workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Vinnudagbók");
        XLSX.writeFile(workbook, "Vinnudagbók.xlsx");
    });

    renderLogs();
});
