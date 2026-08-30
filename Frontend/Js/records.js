import { API } from "./dashboard.js";

let allRecords = [];
let filteredRecords = [];
let currentPage = 1;
const recordsPerPage = 8;


// AUTH HEADERS
function recordHeaders() {
    return {
        "Authorization":
            `Bearer ${localStorage.getItem(
                "inventoryToken"
            )}`
    };
}

// LOAD RECORDS
async function loadRecords() {
    try {
        const response = await fetch( `${API}/stocks`,
                {headers: recordHeaders() }
            );
        if (!response.ok) { throw new Error( "Failed to fetch records." ); }


        allRecords =
            await response.json();


        populateCategoryFilter();

        applyFilters();


    } catch (error) {

        console.error(
            "Error loading records:",
            error
        );

    }

}


// ==========================================
// CATEGORY FILTER
// ==========================================

function populateCategoryFilter() {

    const categoryFilter =
        document.getElementById(
            "categoryFilter"
        );


    if (!categoryFilter) return;


    const categories =
        [
            ...new Set(
                allRecords
                    .map(record =>
                        record.category
                    )
                    .filter(Boolean)
            )
        ]
        .sort();


    categoryFilter.innerHTML = `

        <option value="">
            All Categories
        </option>

    `;


    categories.forEach(category => {

        const option =
            document.createElement(
                "option"
            );


        option.value = category;

        option.textContent = category;


        categoryFilter.appendChild(
            option
        );

    });

}

// ==========================================
// APPLY ALL FILTERS
// ==========================================

function applyFilters() {

    const search =
        document.getElementById(
            "recordSearch"
        )?.value
            .toLowerCase()
            .trim() || "";


    const type =
        document.getElementById(
            "typeFilter"
        )?.value || "";


    const category =
        document.getElementById(
            "categoryFilter"
        )?.value || "";


    const selectedDate =
        document.getElementById(
            "dateFilter"
        )?.value || "";


    const sort =
        document.getElementById(
            "sortFilter"
        )?.value || "newest";


    filteredRecords =
        allRecords.filter(record => {


            const searchableText = `

                ${record.name || ""}

                ${record.category || ""}

                ${record.user || ""}

                ${record.description || ""}

                ${record.patient_name || ""}

            `.toLowerCase();


            const matchesSearch =
                searchableText.includes(
                    search
                );


            const matchesType =
                !type ||
                record.type === type;


            const matchesCategory =
                !category ||
                record.category === category;


            let matchesDate = true;


            if (selectedDate) {

                matchesDate =
                    formatForInput(
                        record.date
                    ) === selectedDate;

            }


            return ( matchesSearch &&  matchesType && matchesCategory && matchesDate);
        });


    // SORT

    filteredRecords.sort(
        (a, b) => {

            if (
                sort === "quantityHigh"
            ) {

                return (
                    Number(b.quantity) -
                    Number(a.quantity)
                );

            }


            if (
                sort === "quantityLow"
            ) {

                return (
                    Number(a.quantity) -
                    Number(b.quantity)
                );

            }


            const dateA =
                new Date(
                    `${formatForInput(a.date)}
                     ${a.time || "00:00:00"}`
                );


            const dateB =
                new Date(
                    `${formatForInput(b.date)}
                     ${b.time || "00:00:00"}`
                );


            if (sort === "oldest") {

                return dateA - dateB;

            }


            return dateB - dateA;

        }
    );


    currentPage = 1;

    renderRecords();

}


// ==========================================
// RENDER RECORDS
// ==========================================

function renderRecords() {

    const tableBody =
        document.getElementById(
            "recordsTable"
        );


    if (!tableBody) return;


    tableBody.innerHTML = "";


    const start =
        (
            currentPage - 1
        ) * recordsPerPage;


    const end =
        start +
        recordsPerPage;


    const pageRecords =
        filteredRecords.slice(
            start,
            end
        );


    if (!pageRecords.length) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="11" style="text-align:center;padding:30px" >
                    No records found.
                </td>
            </tr>
        `;

    } else {

        pageRecords.forEach(
            record => { const row =  document.createElement("tr");

                //Calculate displayed amount
              const transactionAmount =
                 record.type === "stock In"
                     ? record.total_cost
                     : record.total_amount;


                row.innerHTML = `

                    <td> <strong> ${escapeHTML(record.name)} </strong> </td>
                    <td> ${escapeHTML(record.category)}</td>
                    <td class="${ record.type === "stock In"  ? "type-in" : "type-out"}">
                        ${ record.type === "stock In" ? "Stock In"  : "Stock Out" }
                    </td>
                    <td> ${escapeHTML(record.unit)} </td>
                    <td> ${record.quantity} </td>
                    <td> ${formatCurrency( transactionAmount )} </td>
                    <td> ${escapeHTML( record.user )} </td>
                    <td> ${escapeHTML( record.patient_name || "-" )} </td>
                    <td> ${escapeHTML( record.description || "-" )} </td>
                    <td> ${formatDate(  record.date )} </td>
                    <td> ${record.time || "-"} </td>
                `;


                tableBody.appendChild(
                    row
                );

            }
        );

    }


    updatePagination();

}


// ==========================================
// PAGINATION
// ==========================================

function updatePagination() {

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filteredRecords.length /
                recordsPerPage
            )
        );


    const recordCount =
        document.getElementById(
            "recordCount"
        );


    const pageInfo =
        document.getElementById(
            "pageInfo"
        );


    const previous =
        document.getElementById(
            "prevPage"
        );


    const next =
        document.getElementById(
            "nextPage"
        );


    if (recordCount) {

        recordCount.textContent =
            filteredRecords.length;

    }


    if (pageInfo) {

        pageInfo.textContent =
            `Page ${currentPage} of ${totalPages}`;

    }


    if (previous) {

        previous.disabled =
            currentPage === 1;

    }


    if (next) {

        next.disabled =
            currentPage === totalPages;

    }

}


// ==========================================
// FILTER EVENTS
// ==========================================

const search =
    document.getElementById(
        "recordSearch"
    );


const type =
    document.getElementById(
        "typeFilter"
    );


const category =
    document.getElementById(
        "categoryFilter"
    );


const date =
    document.getElementById(
        "dateFilter"
    );


const sort =
    document.getElementById(
        "sortFilter"
    );


if (search) {

    search.addEventListener(
        "input",
        applyFilters
    );

}


if (type) {

    type.addEventListener(
        "change",
        applyFilters
    );

}


if (category) {

    category.addEventListener(
        "change",
        applyFilters
    );

}


if (date) {

    date.addEventListener(
        "change",
        applyFilters
    );

}


if (sort) {

    sort.addEventListener(
        "change",
        applyFilters
    );

}


// ==========================================
// CLEAR FILTERS
// ==========================================

const clearFilters =
    document.getElementById(
        "clearFilters"
    );


if (clearFilters) {

    clearFilters.addEventListener(
        "click",
        () => {

            search.value = "";

            type.value = "";

            category.value = "";

            date.value = "";

            sort.value = "newest";


            applyFilters();

        }
    );

}


// ==========================================
// PAGINATION BUTTONS
// ==========================================

const previous =
    document.getElementById(
        "prevPage"
    );


const next =
    document.getElementById(
        "nextPage"
    );


if (previous) {

    previous.addEventListener(
        "click",
        () => {

            if (currentPage > 1) {

                currentPage--;

                renderRecords();

            }

        }
    );

}


if (next) {

    next.addEventListener(
        "click",
        () => {

            const totalPages =
                Math.ceil(
                    filteredRecords.length /
                    recordsPerPage
                );


            if (
                currentPage <
                totalPages
            ) {

                currentPage++;

                renderRecords();

            }

        }
    );

}


// ==========================================
// DATE HELPERS
// ==========================================

function formatForInput(date) {

    if (!date) return "";


    if (
        typeof date === "string" &&
        date.includes("T")
    ) {

        return date.split("T")[0];

    }


    const d =
        new Date(date);


    if (isNaN(d)) {

        return String(date)
            .substring(0, 10);

    }


    const year =
        d.getFullYear();


    const month =
        String(
            d.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            d.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


function formatDate(date) {

    if (!date) return "-";


    const input =
        formatForInput(date);


    const parts =
        input.split("-");


    if (parts.length !== 3) {

        return date;

    }


    return `${parts[2]}/${parts[1]}/${parts[0]}`;

}


// ==========================================
// BASIC HTML ESCAPING
// ==========================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "-";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


window.loadRecords =
    loadRecords;


// ==========================================
// START
// ==========================================

loadRecords();