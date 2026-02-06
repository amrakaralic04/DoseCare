import { loginUser, formatAuthError } from "../auth.js";
import { createToast } from "../ui.js";
import { navigate } from "../router.js";

const renderLogin = () => {
    return `
 <section class="section page">
      <div class="auth-layout">
        <div class="auth-hero">
          <span class="badge badge--soft">DoseCare platforma</span>
          <h2 class="auth-hero__title">Pratite terapiju u realnom vremenu</h2>
          <p class="muted">Prijavite se da biste vidjeli stanje uređaja, obavijesti i dnevni plan doza.</p>
          <div class="auth-hero__list">
            <div class="auth-hero__item">
              <span>📦</span>
              <div>
                <strong>Jedan pregled za sve uređaje</strong>
                <p class="muted">Pratite više kutija i njihove podatke iz jedne konzole.</p>
              </div>
            </div>
            <div class="auth-hero__item">
              <span>🔔</span>
              <div>
                <strong>Pametne notifikacije</strong>
                <p class="muted">Automatska upozorenja za propuštene doze.</p>
              </div>
            </div>
            <div class="auth-hero__item">
              <span>📊</span>
              <div>
                <strong>Historija i izvještaji</strong>
                <p class="muted">Analitika u nekoliko klikova, bez dodatnih tablica.</p>
              </div>
            </div>
          </div>
           </div>
        <div class="card auth-card">
          <div class="auth-card__header">
            <h2 class="section__title">Prijava</h2>
            <p class="muted">Dobro došli nazad. Prijavite se za pristup dashboardu.</p>
          </div>
         <form id="login-form" class="section" novalidate>
            <div class="form-group">
              <label for="login-email">Email</label>
              <input class="input" id="login-email" type="email" autocomplete="email" required />
            </div>
            <div class="form-group">
              <label for="login-password">Lozinka</label>
              <input class="input" id="login-password" type="password" autocomplete="current-password" required />
            </div>
            <div class="form-split">
              <label class="muted">
                <input type="checkbox" /> Zapamti me
              </label>
              <span class="muted">Zaboravljena lozinka? <a class="link-inline" href="#/register">Kontaktiraj podršku</a></span>
            </div>
            <div class="auth-card__actions">
              <button class="btn btn--primary" type="submit">Prijavi se</button>
              <button class="btn btn--ghost" type="button">Prijava preko SMS koda</button>
            </div>
          </form>
          <div class="divider"></div>
          <p class="muted auth-card__footer">Nemaš račun? <a class="link-inline" href="#/register">Registruj se</a></p>
        </div>
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