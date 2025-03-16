document.addEventListener("DOMContentLoaded", function () {
    const workLogForm = document.getElementById("workLogForm");
    const workLogTableBody = document.getElementById("workLogTable");
    const totalHoursWorkedCell = document.getElementById("totalHoursWorked");
    const clearTableButton = document.getElementById("clearTable");
    const exportExcelButton = document.getElementById("exportToExcel");
    const pasteButton = document.getElementById("pasteEntry"); // ✅ Use existing button

    let workLogs = JSON.parse(localStorage.getItem("workLogs")) || [];
    let copiedEntry = null;

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
            row.innerHTML = `
                <td contenteditable="true" class="edit-field" data-index="${index}" data-field="client">${log.client}</td>
                <td contenteditable="true" class="edit-field" data-index="${index}" data-field="date">${log.date}</td>
                <td contenteditable="true" class="edit-field edit-time" data-index="${index}" data-field="startTime">${log.startTime}</td>
                <td contenteditable="true" class="edit-field edit-time" data-index="${index}" data-field="endTime">${log.endTime}</td>
                <td>${log.totalHours}</td>
                <td contenteditable="true" class="edit-field" data-index="${index}" data-field="description">${log.description}</td>
                <td class="no-print">
                    <button class="copy-btn btn btn-info btn-sm" data-index="${index}">Afrita</button>
                    <button class="delete-btn btn btn-danger btn-sm" data-index="${index}">Eyða</button>
                </td>
            `;
            workLogTableBody.appendChild(row);
            totalMinutes += parseInt(log.totalHours.split(":")[0]) * 60 + parseInt(log.totalHours.split(":")[1]);
        });

        totalHoursWorkedCell.textContent = `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;

        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", function () {
                const index = parseInt(this.dataset.index);
                workLogs.splice(index, 1);
                saveLogs();
                renderLogs();
            });
        });

        document.querySelectorAll(".copy-btn").forEach(button => {
            button.addEventListener("click", function () {
                const index = parseInt(this.dataset.index);
                copiedEntry = { ...workLogs[index] };
                alert("Færsla afrituð! (Smelltu á Líma færslu til að líma)");
            });
        });

        // ✅ Save changes dynamically
        document.querySelectorAll(".edit-field").forEach(cell => {
            cell.addEventListener("input", function () {
                const index = parseInt(this.dataset.index);
                const field = this.dataset.field;
                workLogs[index][field] = this.textContent.trim();
                
                // ✅ Update total hours if start or end time is edited
                if (field === "startTime" || field === "endTime") {
                    workLogs[index].totalHours = calculateUsedTime(workLogs[index].startTime, workLogs[index].endTime);
                }

                saveLogs();
            });
        });
    }

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

    clearTableButton.addEventListener("click", function () {
        if (confirm("Ertu viss um að þú viljir hreinsa alla töfluna?")) {
            workLogs = [];
            saveLogs();
            renderLogs();
        }
    });

    // ✅ Restore "Breyta töflu" (Edit Table) button
    const editTableButton = document.createElement("button");
    editTableButton.textContent = "Breyta töflu";
    editTableButton.classList.add("btn", "btn-warning", "mt-2");
    editTableButton.id = "editTable";

    const saveTableButton = document.createElement("button");
    saveTableButton.textContent = "Vista breytingar";
    saveTableButton.classList.add("btn", "btn-success", "mt-2");
    saveTableButton.id = "saveTable";
    saveTableButton.style.display = "none";

    document.querySelector(".container").appendChild(editTableButton);
    document.querySelector(".container").appendChild(saveTableButton);

    editTableButton.addEventListener("click", function () {
        document.querySelectorAll(".edit-field").forEach(cell => {
            cell.contentEditable = "true";
        });
        editTableButton.style.display = "none";
        saveTableButton.style.display = "inline-block";
    });

    saveTableButton.addEventListener("click", function () {
        saveLogs();
        renderLogs();
        editTableButton.style.display = "inline-block";
        saveTableButton.style.display = "none";
    });

    // ✅ Use the existing "Líma færslu" button from index.html
    pasteButton.addEventListener("click", function () {
        if (copiedEntry) {
            workLogs.push({ ...copiedEntry });
            saveLogs();
            renderLogs();
        } else {
            alert("Engin færsla hefur verið afrituð!");
        }
    });

    // ✅ Fix Export to Excel
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
