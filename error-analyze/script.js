const csvFileInput = document.getElementById("csv-file");
const fileName = document.getElementById("file-name");

const analysisSection = document.getElementById("analysis");

const scannerName = document.getElementById("scanner-name");
const totalErrors = document.getElementById("total-errors");
const logDate = document.getElementById("log-date");

const errorTypeChart = document.getElementById("error-type-chart");
const errorTypeLegend = document.getElementById("error-type-legend");
const dayChart = document.getElementById("day-chart");
const errorTable = document.getElementById("error-table");


csvFileInput.addEventListener("change", () => {

    const file = csvFileInput.files[0];

    if (!file) {
        fileName.textContent = "Ingen fil valgt";
        return;
    }

    fileName.textContent = file.name;

    const reader = new FileReader();

    reader.onload = () => {

        const csv = reader.result;

        const errors = parseCSV(csv);

        if (errors.length === 0) {
            alert("CSV-filen indeholder ingen fejl.");
            return;
        }

        analyzeErrors(errors);
    };
    reader.readAsText(file);
});


function parseCSV(csv) {
    const lines = csv
        .trim()
        .split(/\r?\n/)
        .filter(line => line.trim() !== "");

    if (lines.length < 2) {
        return [];
    }

    const headers = parseCSVLine(lines[0]);
    const scannerIndex = headers.indexOf("Scanner");
    const dateIndex = headers.indexOf("Date");
    const timeIndex = headers.indexOf("Time");
    const typeIndex = headers.indexOf("Error Type");

    if (
        scannerIndex === -1 ||
        dateIndex === -1 ||
        timeIndex === -1 ||
        typeIndex === -1
    ) {
        alert(
            "CSV-filen har ikke det forventede format.\n\n" +
            "Forventede kolonner:\n" +
            "Scanner, Date, Time, Error Type"
        );

        return [];
    }

    const errors = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === 0) {
            continue;
        }

        errors.push({
            scanner: values[scannerIndex],
            date: values[dateIndex],
            time: values[timeIndex],
            type: values[typeIndex]
        });
    }
    return errors;
}


function parseCSVLine(line) {
    const values = [];

    let currentValue = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const character = line[i];
        if (character === '"') {
            if (
                insideQuotes &&
                line[i + 1] === '"'
            ) {
                currentValue += '"';
                i++;
            } else {
                insideQuotes = !insideQuotes;
            }

        } else if (
            character === "," &&
            !insideQuotes
        ) {

            values.push(currentValue);
            currentValue = "";

        } else {

            currentValue += character;
        }
    }

    values.push(currentValue);

    return values;
}


function analyzeErrors(errors) {

    analysisSection.classList.remove("hidden");

    /* Basic information */
    const scanner = errors[0].scanner;

    const dates = [
        ...new Set(
            errors.map(error => error.date)
        )
    ];

    scannerName.textContent = scanner;

    totalErrors.textContent = errors.length;

    logDate.textContent =
        dates.length === 1
            ? dates[0]
            : `${dates[0]} – ${dates[dates.length - 1]}`;


    /* Error type distribution */
    const errorTypes = {};

    for (const error of errors) {

        if (!errorTypes[error.type]) {
            errorTypes[error.type] = 0;
        }

        errorTypes[error.type]++;
    }

    createErrorTypeChart(errorTypes);


    /* Errors throughout the day */
    const errorsByHour = {};

    for (let hour = 0; hour < 24; hour++) {
        errorsByHour[hour] = 0;
    }

    for (const error of errors) {

        const hour = parseInt(
            error.time.substring(0, 2),
            10
        );

        if (!isNaN(hour)) {
            errorsByHour[hour]++;
        }
    }

    createDayChart(errorsByHour);

    /* Error table */
    createErrorTable(errors);
}


function createErrorTypeChart(errorTypes) {

    errorTypeChart.innerHTML = "";
    errorTypeLegend.innerHTML = "";


    const total =
        Object.values(errorTypes)
            .reduce(
                (sum, value) => sum + value,
                0
            );

    /* Create conic-gradient */
    const colors = [
        "#123c32",
        "#b59a5a",
        "#68706c",
        "#7d9a91",
        "#c7b98a",
        "#3e6258"
    ];

    let currentPercentage = 0;

    const gradientParts = [];

    const types =
        Object.entries(errorTypes);


    types.forEach(
        ([type, count], index) => {

            const percentage =
                (count / total) * 100;

            const start =
                currentPercentage;

            const end =
                currentPercentage +
                percentage;

            gradientParts.push(
                `${colors[index % colors.length]} ${start}% ${end}%`
            );

            currentPercentage = end;

            /* Legend */
            const legendItem =
                document.createElement("div");

            legendItem.className =
                "legend-item";


            const colorBox =
                document.createElement("span");

            colorBox.className =
                "legend-color";

            colorBox.style.background =
                colors[index % colors.length];

            const text =
                document.createElement("span");

            text.textContent =
                `${type} — ${count} (${percentage.toFixed(1)}%)`;

            legendItem.appendChild(colorBox);
            legendItem.appendChild(text);

            errorTypeLegend.appendChild(
                legendItem
            );
        }
    );


    errorTypeChart.style.background =
        `conic-gradient(${gradientParts.join(", ")})`;
}

function createDayChart(errorsByHour) {

    dayChart.innerHTML = "";

    const maxErrors =
        Math.max(
            ...Object.values(errorsByHour)
        );

    for (let hour = 0; hour < 24; hour++) {

        const count =
            errorsByHour[hour];

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "hour-column";

        const value =
            document.createElement("span");

        value.className =
            "hour-value";

        value.textContent =
            count;

        const bar =
            document.createElement("div");

        bar.className =
            "hour-bar";

        if (maxErrors > 0) {
            const height =
                (count / maxErrors) * 100;

            bar.style.height =
                `${height}%`;
        } else {
            bar.style.height = "0%";
        }

        const label =
            document.createElement("span");

        label.className =
            "hour-label";

        label.textContent =
            String(hour).padStart(2, "0");

        wrapper.appendChild(value);
        wrapper.appendChild(bar);
        wrapper.appendChild(label);

        dayChart.appendChild(wrapper);
    }
}

function createErrorTable(errors) {

    errorTable.innerHTML = "";

    /* Newest errors first */

    const sortedErrors =
        [...errors].sort(
            (a, b) => {

                const aDate =
                    `${a.date} ${a.time}`;

                const bDate =
                    `${b.date} ${b.time}`;

                return bDate.localeCompare(aDate);
            }
        );


    for (const error of sortedErrors) {

        const row =
            document.createElement("tr");

        const dateCell =
            document.createElement("td");

        dateCell.textContent =
            error.date;

        const timeCell =
            document.createElement("td");

        timeCell.textContent =
            error.time;

        const typeCell =
            document.createElement("td");

        typeCell.textContent =
            error.type;

        row.appendChild(dateCell);
        row.appendChild(timeCell);
        row.appendChild(typeCell);

        errorTable.appendChild(row);
    }
}