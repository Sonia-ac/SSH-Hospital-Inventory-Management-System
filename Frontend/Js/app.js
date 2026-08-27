const token =
    localStorage.getItem("inventoryToken");

// PROTECT DASHBOARD
if (!token) {
    window.location.href = "login.html";
}

// USER
const storedUser =
    JSON.parse(
        localStorage.getItem("inventoryUser") || "{}"
    );

const sidebarUser =
    document.getElementById("sidebarUser");

if (sidebarUser) {
    sidebarUser.textContent = storedUser.name || "Admin";
}

// NAVIGATION
const navLinks =
    document.querySelectorAll(".nav-link");

const sections =
    document.querySelectorAll(".page-section");

const pageTitle =
    document.getElementById("pageTitle");

const pageSubtitle =
    document.getElementById("pageSubtitle");

const titles = {

    overview: [
        "Dashboard",
        "Here's what's happening with your inventory today."
    ],

    "add-stock": [
        "Add New Stock",
        "Add new medicines or supplies to your inventory."
    ],

    "record-usage": [
        "Record Usage",
        "Record medicines issued to patients."
    ],

    "view-records": [
        "All Records",
        "Search and filter your inventory activity."
    ],

    statistics: [
        "Statistics",
        "Overview of your inventory status."
    ],

    notifications: [
        "Notifications",
        "Important inventory alerts."
    ]

};


function showSection(sectionId) {
    sections.forEach(section => {
        section.classList.remove(
            "active-section"
        );
    });

    navLinks.forEach(link => {
        link.classList.remove("active");
    });

    const target =
        document.getElementById(sectionId);
    if (target) { target.classList.add( "active-section" ); }

    const activeLink =
        document.querySelector( `.nav-link[data-section="${sectionId}"]` );

    if (activeLink) { activeLink.classList.add("active"); }

    if (titles[sectionId]) {
        pageTitle.textContent = titles[sectionId][0];
        pageSubtitle.textContent =  titles[sectionId][1];
    }

    window.scrollTo({  top: 0,  behavior: "smooth" });
}

navLinks.forEach(link => {
    link.addEventListener( "click", () => {showSection(link.dataset.section);} );
});

// QUICK NAVIGATION
document.querySelectorAll("[data-go]")
    .forEach(button => {
        button.addEventListener(
            "click",
            () => {
                showSection(
                    button.dataset.go
                );
            }
        );
    });


// MOBILE MENU
const mobileMenuBtn =
    document.getElementById(
        "mobileMenuBtn"
    );

const sidebar =
    document.querySelector(".sidebar");

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "mobile-open"
            );
        }
    );
}

// LOGOUT
const logoutBtn =
    document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener(
        "click",
        () => {
            localStorage.removeItem(
                "inventoryToken"
            );
            localStorage.removeItem(
                "inventoryUser"
            );
            window.location.href =
                "login.html";
        }
    );
}

// CURRENT DATE
const currentDate =
    document.getElementById(
        "currentDate"
    );

if (currentDate) {
    currentDate.textContent =
        new Date().toLocaleDateString(
            "en-NG",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
}

// TOAST
function showToast( message, type = "success") {
    const toast =
        document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.className =
        `toast show ${type}`;

    setTimeout(() => {
        toast.className =
            "toast";
    }, 3000);
}

// Make available to other JS files
window.showToast = showToast;
window.showSection = showSection;