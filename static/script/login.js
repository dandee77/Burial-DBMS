const form = document.getElementById("loginForm");
const popup = document.getElementById("popupMessage");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const response = await fetch("/login", {
        method: "POST",
        body: formData,
    });

    const result = await response.json();

    popup.style.display = "block";
    if (result.message === "Login successful") {
        window.location.href = "/dashboard";
    } else {
        popup.textContent = result.message;
        popup.className = "popup-message popup-error";
        form.reset();
    }
});