const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const username =
            document.getElementById("username").value.trim();
        const password =
            document.getElementById("password").value;
        const message =
            document.getElementById("loginMessage");

        message.textContent = "Logging in...";

        try {

            const response = await fetch(
                "http://localhost:5000/api/auth/login",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username,
                        password
                    })
                }
            );

            const data = await response.json();
            if (!response.ok) {
                throw new Error(
                    data.message || "Login failed."
                );
            }

            localStorage.setItem(
                "inventoryToken",
                data.token
            );

            localStorage.setItem(
                "inventoryUser",
                JSON.stringify(data.user)
            );

            window.location.href = "dashboard.html";

        } catch (error) {
            message.textContent =
                error.message;
        }
    });
}