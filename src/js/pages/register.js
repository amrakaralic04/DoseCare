import { registerUser, formatAuthError } from "../auth.js";
import { createToast } from "../ui.js";
import { navigate } from "../router.js";

const renderRegister = () => {
    return `
  <section class="section page">
      <div class="auth-layout">
        <div class="card auth-card">
          <div class="auth-card__header">
            <h2 class="section__title">Registracija</h2>
            <p class="muted">Kreirajte novi račun za upravljanje pametnom kutijom.</p>
          </div>
         <form id="register-form" class="section" novalidate>
            <div class="form-group">
              <label for="register-email">Email</label>
              <input class="input" id="register-email" type="email" autocomplete="email" required />
            </div>
            <div class="form-group">
              <label for="register-password">Lozinka</label>
              <input class="input" id="register-password" type="password" autocomplete="new-password" required />
            </div>
            <div class="form-group">
              <label for="register-confirm">Ponovi lozinku</label>
              <input class="input" id="register-confirm" type="password" autocomplete="new-password" required />
            </div>
            <div class="notice">Lozinka treba imati najmanje 8 karaktera, veliko slovo i broj.</div>
            <div class="auth-card__actions">
              <button class="btn btn--primary" type="submit">Registruj se</button>
              <button class="btn btn--ghost" type="button">Dodaj uređaj kasnije</button>
            </div>
          </form>
          <div class="divider"></div>
          <p class="muted auth-card__footer">Već imaš račun? <a class="link-inline" href="#/login">Prijavi se</a></p>
        </div>
        <div class="auth-hero">
          <span class="badge badge--soft">Brza aktivacija</span>
          <h2 class="auth-hero__title">Postavite pametnu kutiju za 3 minute</h2>
          <p class="muted">Nakon registracije odmah dobijate pristup vodiču za povezivanje uređaja.</p>
          <div class="auth-hero__list">
            <div class="auth-hero__item">
              <span>✅</span>
              <div>
                <strong>Personalizirani plan doza</strong>
                <p class="muted">Unesite raspored terapije i pratite svako uzimanje.</p>
              </div>
            </div>
            <div class="auth-hero__item">
              <span>📱</span>
              <div>
                <strong>Kontrola na mobitelu</strong>
                <p class="muted">Pregled i obavijesti direktno na telefonu.</p>
              </div>
            </div>
            <div class="auth-hero__item">
              <span>🧠</span>
              <div>
                <strong>Automatske preporuke</strong>
                <p class="muted">Sistema uči navike i predlaže bolji raspored.</p>
              </div>
            </div>
          </div>
          </div>
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
        const confirm = document.getElementById("register-confirm").value.trim();
        if (password !== confirm) {
            createToast("Lozinke se ne podudaraju.", "error");
            return;
        }
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