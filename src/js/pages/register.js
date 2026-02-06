import { registerUser, formatAuthError } from "../auth.js";
import { createToast } from "../ui.js";
import { navigate } from "../router.js";

const renderRegister = () => {
    return `
    <section class="section">
      <div class="card auth-card">
        <h2 class="section__title">Registracija</h2>
        <p class="muted">Kreirajte novi račun za upravljanje pametnom kutijom.</p>
        <form id="register-form" class="section" novalidate>
          <div class="form-group">
            <label for="register-email">Email</label>
            <input class="input" id="register-email" type="email" required />
          </div>
          <div class="form-group">
            <label for="register-password">Lozinka</label>
            <input class="input" id="register-password" type="password" required />
          </div>
          <button class="btn btn--primary" type="submit">Registruj se</button>
        </form>
        <p class="muted">Već imaš račun? <a href="#/login">Prijavi se</a></p>
      </div>
    </section>
  `;
};

const mountRegister = (root) => {
    root.innerHTML = renderRegister();
    const form = document.getElementById("register-form");
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const email = document.getElementById("register-email").value.trim();
        const password = document.getElementById("register-password").value.trim();
        try {
            await registerUser(email, password);
            createToast("Račun kreiran!", "success");
            navigate("/dashboard");
        } catch (error) {
            createToast(formatAuthError(error), "error");
        }
    });
};

export { mountRegister };