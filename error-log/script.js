const scannerInput = document.getElementById("scanner");
const errorTypeInput = document.getElementById("error-type");
const logButton = document.getElementById("log-error");
const clearButton = document.getElementById("clear-log");
const exportButton = document.getElementById("export-log");

const errorLogTable = document.getElementById("error-log");
const emptyMessage = document.getElementById("empty-message");

let errors = JSON.parse(localStorage.getItem("scannerErrors")) || [];


/* Create a timestamp for when the error is logged */
function getTimestamp() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return {
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}:${seconds}`
    };
}

// Errors saved to browser
function saveErrors() {
    localStorage.setItem("scannerErrors", JSON.stringify(errors));
}

// Display all logs
function displayErrors() {

    errorLogTable.innerHTML = "";

    if (errors.length === 0) {
        emptyMessage.classList.remove("hidden");
        return;
    }

    emptyMessage.classList.add("hidden");

    errors.forEach(error => {

        const row = document.createElement("tr");

        const scannerCell = document.createElement("td");
        scannerCell.textContent = error.scanner;

        const dateCell = document.createElement("td");
        dateCell.textContent = error.date;

        const timeCell = document.createElement("td");
        timeCell.textContent = error.time;

        const typeCell = document.createElement("td");
        typeCell.textContent = error.type;

        row.appendChild(scannerCell);
        row.appendChild(dateCell);
        row.appendChild(timeCell);
        row.appendChild(typeCell);

        errorLogTable.appendChild(row);
    });
}


// Logging new errors
logButton.addEventListener("click", () => {
    const scanner = scannerInput.value;
    const errorType = errorTypeInput.value;

    if (scanner === "" || errorType === "") {
        alert("Vælg en scanner og en fejltype.");
        return;
    }

    // If there are already errors, make sure the scanner is the same
    if (errors.length > 0 && errors[0].scanner !== scanner) {
        alert(
            `Denne log er allerede for ${errors[0].scanner}.\n\n` +
            `Du kan ikke tilføje fejl fra ${scanner} til den samme log.`
        );
        return;
    }

    const timestamp = getTimestamp();

    const error = {
        scanner: scanner,
        date: timestamp.date,
        time: timestamp.time,
        type: errorType
    };

    errors.unshift(error);

    saveErrors();
    displayErrors();

    errorTypeInput.value = "";
});


// Clear log
clearButton.addEventListener("click", () => {

    if (errors.length === 0) {
        return;
    }

    const confirmed = confirm(
        "Are you sure you want to clear the entire error log?"
    );

    if (!confirmed) {
        return;
    }

    errors = [];

    saveErrors();
    displayErrors();
});


// Export log
exportButton.addEventListener("click", () => {

    if (errors.length === 0) {
        alert("Der er ingen fejl at eksportere.");
        return;
    }

    // Get the scanner from the existing log
    const scanner = errors[0].scanner;

    const headers = [
        "Scanner",
        "Date",
        "Time",
        "Error Type"
    ];

    const rows = errors.map(error => [
        error.scanner,
        error.date,
        error.time,
        error.type
    ]);

    const csv = [
        headers,
        ...rows
    ]
        .map(row =>
            row
                .map(value => `"${String(value).replace(/"/g, '""')}"`)
                .join(",")
        )
        .join("\n");

    const blob = new Blob(
        [csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;

    // Use the scanner stored in the log
    link.download =
        `${scanner.replace(/\s+/g, "-")}-error-log.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
});


displayErrors();