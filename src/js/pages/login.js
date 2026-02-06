import { loginUser, formatAuthError } from "../auth.js";
import { createToast } from "../ui.js";
import { navigate } from "../router.js";

const renderLogin = () => {
    return `
    <section class="section">
      <div class="card auth-card">
        <h2 class="section__title">Prijava</h2>
        <p class="muted">Dobro došli nazad. Prijavite se za pristup dashboardu.</p>
        <form id="login-form" class="section" novalidate>
          <div class="form-group">
            <label for="login-email">Email</label>
            <input class="input" id="login-email" type="email" required />
          </div>
          <div class="form-group">
            <label for="login-password">Lozinka</label>
            <input class="input" id="login-password" type="password" required />
          </div>
          <button class="btn btn--primary" type="submit">Prijavi se</button>
        </form>
        <p class="muted">Nemaš račun? <a href="#/register">Registruj se</a></p>
      </div>
    </section>
  `;
};

const mountLogin = (root) => {
    root.innerHTML = renderLogin();
    const form = document.getElementById("login-form");
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value.trim();
        try {
            await loginUser(email, password);
            createToast("Uspješna prijava!", "success");
            navigate("/dashboard");
        } catch (error) {
            createToast(formatAuthError(error), "error");
        }
    });
};

export { mountLogin };