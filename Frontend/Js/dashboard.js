export const API = "http://localhost:5000/api";

// AUTH HEADERS
function authHeaders() {
    return { "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem(  "inventoryToken" )}`
    };
}

// LOAD DASHBOARD STATS
async function loadDashboardStats() {
    try {
        const response =
            await fetch( `${API}/dashboard/stats`,
                {       headers:  authHeaders() }    );

        if (!response.ok) {
            throw new Error(
                "Failed to load statistics."
            );

        }

        const stats =  await response.json();

        document.getElementById( "totalProducts" ).textContent = stats.totalProducts;
        document.getElementById(  "totalStock" ).textContent = stats.totalStock;
        document.getElementById( "lowStock" ).textContent =  stats.lowStock;
        document.getElementById( "outOfStock" ).textContent =  stats.outOfStock;
        document.getElementById( "statProducts" ).textContent = stats.totalProducts;
        document.getElementById( "statStock"  ).textContent =  stats.totalStock;
        document.getElementById( "statLowStock" ).textContent =  stats.lowStock;
        document.getElementById( "statExpiring" ).textContent = stats.expiring;


    } catch (error) {
        console.error(error);
    }
}

// LOAD LOW STOCK

async function loadLowStock() {

    try {

        const response =
            await fetch(
                `${API}/dashboard/low-stock`,
                {
                    headers:
                        authHeaders()
                }
            );


        const items =  await response.json();
        const container =  document.getElementById( "lowStockList" );
        if (!items.length) {
            container.innerHTML = `
                <div class="empty-state">
                    ✓ No low-stock items.
                </div>
            `;
            return;
        }


        container.innerHTML =
            items.slice(0, 6)
                .map(item => `

                    <div class="alert-item">
                        <strong> ${item.name} </strong>
                        <span>  ${item.quantity} left </span>
                    </div>

                `)
                .join("");


    } catch (error) {
        console.error(error);
    }

}

// LOAD RECENT ACTIVITY
async function loadRecentActivity() {
    try {
        const response =
            await fetch(
                `${API}/stocks`,
                {
                    headers:
                        authHeaders()
                }
            );


        const records =
            await response.json();


        const recent =
            records.slice(0, 7);


        const table =
            document.getElementById(
                "recentRecordsTable"
            );


        if (!recent.length) {

            table.innerHTML = `
                <tr>
                    <td colspan="5">
                        No records found.
                    </td>
                </tr>
            `;

            return;

        }


        table.innerHTML =
            recent.map(record => `
                <tr>
                    <td>
                        ${record.name}
                    </td>
                    <td class="${
                        record.type === "stock In"
                            ? "type-in"
                            : "type-out"
                    }">
                        ${record.type}
                    </td>

                    <td>
                        ${record.quantity}
                    </td>

                    <td>
                        ${record.user}
                    </td>

                    <td>
                        ${formatDate(record.date)}
                    </td>

                </tr>

            `).join("");


    } catch (error) {
        console.error(error);
    }
}

// LOAD NOTIFICATIONS
async function loadNotifications() {
    try {
        const [
            lowResponse,
            expiryResponse
        ] = await Promise.all([
            fetch(
                `${API}/dashboard/low-stock`,
                {
                    headers:
                        authHeaders()
                }
            ),

            fetch(
                `${API}/dashboard/expiring`,
                {
                    headers:
                        authHeaders()
                }
            )

        ]);


        const lowStock = await lowResponse.json();
        const expiring =  await expiryResponse.json();
        const container = document.getElementById(  "notificationList"  );
        const badge = document.getElementById(  "notificationBadge" );
        const total =  lowStock.length +  expiring.length; badge.textContent = total;
       
        let html = "";
        lowStock.forEach(item => {
            html += `
                <div class="notification-card">
                    <h3> ⚠ Low Stock: ${item.name} </h3>
                    <p> Only ${item.quantity} unit(s) remaining. </p>
                </div>

            `;
        });


        expiring.forEach(item => {
            html += `
                <div class="notification-card danger">
                    <h3> ⚠ Expiring Soon: ${item.name} </h3>
                    <p> Expiry date: ${formatDate(item.expiry_date)} </p>
                </div>
            `;
        });


        if (!html) {
            html = `
                <div class="panel">
                    <div class="empty-state">
                        ✓ No notifications.
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;


    } catch (error) {
        console.error(error);
    }
}

// MEDICINES DROPDOWN
async function loadMedicines() {
    try {

        const response =
            await fetch(
                `${API}/stocks/medicines`,
                {
                    headers:
                        authHeaders()
                }
            );


        const medicines = await response.json();
        const select = document.getElementById( "medicine" );

        select.innerHTML = ` <option value=""> Select medicine </option>  `;

        medicines.forEach(medicine => {
            const option =
                document.createElement(  "option"  );

            option.value =  medicine.id;

            option.textContent =
                `${medicine.name} (${medicine.quantity} available)`;

            option.dataset.quantity =  medicine.quantity;

            select.appendChild(option);

        });


    } catch (error) {

        console.error(error);

    }

}

// MEDICINE STOCK DISPLAY
const medicineSelect =  document.getElementById("medicine");

if (medicineSelect) {
    medicineSelect.addEventListener(
        "change",
        () => {

            const option = medicineSelect.selectedOptions[0];
            const available = option?.dataset.quantity;
            const display = document.getElementById( "availableStock"  );

            if (!available) { display.textContent =  "Select an item to see available stock.";
                return;
            }

            display.textContent =
                `Available stock: ${available}`;
        }
    );
}


// ADD STOCK
const stockForm =
    document.getElementById( "stockForm");

if (stockForm) {
    stockForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const data = {
                name:
                    document.getElementById( "medicineName"  ).value.trim(),
                category:
                    document.getElementById(  "category" ).value,
                unit:
                    document.getElementById( "stockUnit"  ).value,
                quantity:
                    Number(
                        document.getElementById( "quantity" ).value
                    ),
                expiryDate:
                    document.getElementById( "expiryDate"  ).value,
                supplier:
                    document.getElementById(  "supplier"  ).value.trim()
            };


            try {

                const response =
                    await fetch(
                        `${API}/stocks/stock-in`,
                        {
                            method: "POST",
                            headers:   authHeaders(),
                            body: JSON.stringify(data)
                        }
                    );


                const result =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        result.message
                    );

                }


                window.showToast(
                    "Stock added successfully!"
                );


                stockForm.reset();

                await refreshDashboard();

                showSection("overview");

            } catch (error) {

                window.showToast(
                    error.message,
                    "error"
                );
            }
        }
    );
}


// RECORD USAGE
const usageForm = document.getElementById( "usageForm" );
if (usageForm) { usageForm.addEventListener( "submit",
        async event => {

            event.preventDefault();


            const medicineId =
                document.getElementById(
                    "medicine"
                ).value;


            const quantity =
                Number(
                    document.getElementById(
                        "usageQuantity"
                    ).value
                );


            const patientName =
                document.getElementById(
                    "patientName"
                ).value.trim();


            const description =
                document.getElementById(
                    "description"
                ).value.trim();


            try {

                const response =
                    await fetch(
                        `${API}/stocks/stock-out`,
                        {
                            method: "POST",

                            headers:
                                authHeaders(),

                            body:
                                JSON.stringify({

                                    medicineId,

                                    quantity,

                                    patientName,

                                    description

                                })

                        }
                    );


                const result =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        result.message
                    );

                }


                window.showToast(
                    "Usage recorded successfully!"
                );


                usageForm.reset();


                document.getElementById(
                    "availableStock"
                ).textContent =
                    "Select an item to see available stock.";


                await refreshDashboard();


                showSection("overview");


            } catch (error) {

                window.showToast(
                    error.message,
                    "error"
                );

            }

        }
    );

}


// ==========================================
// REFRESH EVERYTHING
// ==========================================

async function refreshDashboard() {

    await Promise.all([

        loadDashboardStats(),

        loadLowStock(),

        loadRecentActivity(),

        loadNotifications(),

        loadMedicines()

    ]);


    if (
        typeof loadRecords ===
        "function"
    ) {

        loadRecords();

    }

}


// ==========================================
// DATE FORMAT
// ==========================================

function formatDate(date) {

    if (!date) return "-";


    const d =
        new Date(date);


    if (isNaN(d)) {

        return date;

    }


    return d.toLocaleDateString(
        "en-NG"
    );

}


window.formatDate = formatDate;


// ==========================================
// START
// ==========================================

refreshDashboard();
// // LOAD RECORDS FROM DATABASE

// async function loadRecords() {
//     try {
//         const response = await fetch("http://localhost:5000/api/stocks");

//         if (!response.ok) { throw new Error("Failed to fetch records"); }

//         allRecords = await response.json();

//         displayRecords(allRecords);

//     } catch (error) {

//         console.error("Error loading records:", error);

//     }
// }

// // DISPLAY RECORDS

// function displayRecords(records) {
//     const tableBody = document.getElementById("recordsTable");
//     // Make sure the table exists on this page
//     if (!tableBody) {
//         return;
//     }
//     tableBody.innerHTML = "";

//     records.forEach(record => {
//         const row = document.createElement("tr");
//         const date = record.date
//             ? new Date(record.date).toLocaleDateString()
//             : "-";

//         row.innerHTML = `
//             <td>${record.name || "-"}</td>
//             <td>${record.category || "-"}</td>
//             <td>${record.type || "-"}</td>
//             <td>${record.unit || "-"}</td>
//             <td>${record.quantity || "-"}</td>
//             <td>${record.user || "-"}</td>
//             <td>${record.description || "-"}</td>
//             <td>${date}</td>
//             <td>${record.time || "-"}</td>
//         `;

//         tableBody.appendChild(row);

//     });
// }
// loadRecords();

// // FILTER RECORDS
// function filterRecords() {
//     const searchInput = document.getElementById("recordsearch");
//     const typeFilter = document.getElementById("typeFilter");
//     const dateFilter = document.getElementById("dateFilter");

//     const searchTerm = searchInput
//         ? searchInput.value.toLowerCase().trim()
//         : "";

//     const selectedType = typeFilter
//         ? typeFilter.value
//         : "all";

//     const selectedDate = dateFilter
//         ? dateFilter.value
//         : "";

//     const filteredRecords = allRecords.filter(record => {

//         // SEARCH FILTER
//         const matchesSearch =
//             (record.name || "")
//                 .toLowerCase()
//                 .includes(searchTerm);


//         // TYPE FILTER
//         const matchesType =
//             selectedType === "all" ||
//             (record.type || "").toLowerCase() === selectedType.toLowerCase();


//         // DATE FILTER
//         let matchesDate = true;
//         if (selectedDate && record.date) {

//             const recordDate = new Date(record.date)
//                 .toISOString()
//                 .split("T")[0];

//             matchesDate = recordDate === selectedDate;

//         }


//         return matchesSearch && matchesType && matchesDate;

//     });


//     displayRecords(filteredRecords);

// }

// // SEARCH
// const searchInput = document.getElementById("recordsearch");
// if (searchInput) {
//     searchInput.addEventListener("input", filterRecords);
// }

// // RECORD TYPE FILTER
// const typeFilter = document.getElementById("typeFilter");
// if (typeFilter) {
//     typeFilter.addEventListener("change", filterRecords);
// }

// // DATE FILTER
// const dateFilter = document.getElementById("dateFilter");
// if (dateFilter) {
//     dateFilter.addEventListener("change", filterRecords);
// }


// // START LOADING RECORDS
// loadRecords();