export const API = "http://localhost:5000/api";

// USER ROLE / ACCESS CONTROL
const loggedInUser = JSON.parse(
    localStorage.getItem("inventoryUser")
);

if (!loggedInUser) {
    window.location.href = "login.html";
}

const isAdmin =
    loggedInUser?.role === "admin";

//Display User Role
const sidebarRole =
    document.getElementById("sidebarRole");

if (sidebarRole) {
    sidebarRole.textContent = isAdmin
            ? "Administrator"
            : "Staff";

}
// Hide admin-only elements for staff
if (!isAdmin) {
    document
        .querySelectorAll(".admin-only")
        .forEach(element => {
            element.style.display = "none";
        });

}

if (loggedInUser.role !== "admin") {

    document
        .querySelectorAll(".admin-only")
        .forEach(element => {
            element.style.display = "none";
        });

    document
        .querySelectorAll(".page-section")
        .forEach(section => {
            section.classList.remove(
                "active-section"
            );
        });

    const usageSection =
        document.getElementById(
            "record-usage"
        );

    if (usageSection) {
        usageSection.classList.add(
            "active-section"
        );
    }

}

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
            option.textContent = `${medicine.name} - ${medicine.quantity} ${medicine.unit}(s) available)`;
            option.dataset.quantity =  medicine.quantity;
            option.dataset.unit =  medicine.unit;
            option.dataset.cost = medicine.cost_per_unit;
            option.dataset.price = medicine.selling_price;


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

// ==========================================
// STOCK-IN PRICE PREVIEW
// ==========================================

const stockQuantityInput = document.getElementById(  "quantity");
const totalCostInput = document.getElementById(   "totalCost");

function updateStockPricePreview() {
    const quantity =  Number( stockQuantityInput?.value ) || 0;
    const totalCost = Number(  totalCostInput?.value) || 0;

    let unitCost = 0;
    let sellingPrice = 0;

    if ( quantity > 0 && totalCost > 0 ) {
        unitCost = totalCost / quantity;
        sellingPrice = unitCost * 6;
    }

    document.getElementById( "previewQuantity"  ).textContent =  quantity;
    document.getElementById( "previewTotalCost").textContent = formatCurrency(totalCost);
    document.getElementById( "previewUnitCost" ).textContent = formatCurrency(unitCost);
    document.getElementById( "previewSellingPrice" ).textContent =  formatCurrency(sellingPrice );

}

   stockQuantityInput?.addEventListener("input", updateStockPricePreview);
   totalCostInput?.addEventListener("input", updateStockPricePreview);
 
   function formatCurrency(amount) {

    return new Intl.NumberFormat(
        "en-NG",
        {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 2
        }
    ).format( Number(amount) || 0);
}

window.formatCurrency =
    formatCurrency;

// ADD STOCK
const stockForm =
    document.getElementById( "stockForm");

if (stockForm) {
    stockForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const data = {
                name: document.getElementById( "medicineName"  ).value.trim(),
                category: document.getElementById(  "category" ).value,
                unit: document.getElementById( "stockUnit"  ).value,
                quantity: Number( document.getElementById( "quantity" ).value),
                totalCost: Number( document.getElementById( "totalCost"  ).value ),
                expiryDate: document.getElementById( "expiryDate"  ).value,
                supplier: document.getElementById(  "supplier"  ).value.trim()
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
                if (isAdmin) {
                showSection("overview");
                } else {showSection("record-usage");}


            } catch (error) {

                window.showToast(
                    error.message,
                    "error"
                );
            }
        }
    );
}


const usageMedicine =
    document.getElementById(
        "medicine"
    );


const usageQuantity =
    document.getElementById(
        "usageQuantity"
    );


function updateUsagePrice() {

    const option =
        usageMedicine
            ?.selectedOptions[0];


    if (
        !option ||
        !option.value
    ) {

        document.getElementById(
            "usageAvailable"
        ).textContent = "-";


        document.getElementById(
            "usageUnitCost"
        ).textContent =
            formatCurrency(0);


        document.getElementById(
            "usageSellingPrice"
        ).textContent =
            formatCurrency(0);


        document.getElementById(
            "usageTotalAmount"
        ).textContent =
            formatCurrency(0);


        return;

    }


    const available =
        Number(
            option.dataset.quantity
        );


    const unit =
        option.dataset.unit || "";


    const cost =
        Number(
            option.dataset.cost
        );


    const price =
        Number(
            option.dataset.price
        );


    const quantity =
        Number(
            usageQuantity?.value
        ) || 0;


    const total =
        price * quantity;


    document.getElementById(
        "usageAvailable"
    ).textContent =
        `${available} ${unit}(s)`;


    document.getElementById(
        "usageUnitCost"
    ).textContent =
        formatCurrency(cost);


    document.getElementById(
        "usageSellingPrice"
    ).textContent =
        formatCurrency(price);


    document.getElementById(
        "usageTotalAmount"
    ).textContent =
        formatCurrency(total);

}


usageMedicine?.addEventListener(
    "change",
    updateUsagePrice
);


usageQuantity?.addEventListener(
    "input",
    updateUsagePrice
);


// ==========================================
// REFRESH EVERYTHING
// ==========================================

async function refreshDashboard() {
    //for all
    await Promise.all([
        loadNotifications(),
        loadMedicines()
    ]);

    //for only admins
    if (isAdmin){
    await Promise.all([
        loadDashboardStats(),
        loadLowStock(),
        loadRecentActivity(),
        loadNotifications(),
        loadMedicines()
    ]);


    if ( typeof loadRecords === "function" ) {
        loadRecords();
    }
}
}


// ==========================================
// DATE FORMAT
// ==========================================

function formatDate(date) {
    if (!date) return "-";

    const d = new Date(date);

    if (isNaN(d)) {  return date; }

    return d.toLocaleDateString( "en-NG" );

}


window.formatDate = formatDate;


// ==========================================
// START
// ==========================================

async function startApp() {

    await refreshDashboard();

    // Staff start directly on Record Usage
    if (!isAdmin) {

        showSection("record-usage");

    }

}

startApp();
