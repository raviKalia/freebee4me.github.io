import { useEffect, useState } from "react";
import type { FormEvent, MouseEvent } from "react";

import Dashboard from "./Dashboard";
import type { Account } from "./Dashboard";

export default function App() {
  const [account, setAccount] = useState<Account | null>(null);
  const [page, setPage] = useState(window.location.pathname);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isSignup = page === "/signup";
  const isAdmin = page === "/admin/login";
  const pageExists = ["/", "/login", "/signup", "/admin/login"].includes(page);

  let title = "Welcome back";
  let description = "Sign in to find your next useful thing.";
  let buttonText = "Sign in";

  if (isSignup) {
    title = "Join Freebee4me";
    description = "Create an account and start sharing locally.";
    buttonText = "Create account";
  } else if (isAdmin) {
    title = "Admin sign in";
    description = "For the master admin and appointed admins.";
    buttonText = "Sign in as admin";
  }

  // Keep the form in sync when someone uses the browser's Back or Forward button.
  useEffect(() => {
    function handleHistory() {
      setPage(window.location.pathname);
      setError("");
      setMessage("");
      setShowPassword(false);
    }

    window.addEventListener("popstate", handleHistory);

    // Remove the listener when this component leaves the page.
    return () => window.removeEventListener("popstate", handleHistory);
  }, []);

  // Open another form without reloading the whole website.
  function changePage(event: MouseEvent<HTMLAnchorElement>, nextPage: string) {
    // Let the browser handle modified clicks, such as opening a new tab.
    if (
      event.button !== 0 || event.ctrlKey || event.metaKey ||
      event.shiftKey || event.altKey
    ) {
      return;
    }

    event.preventDefault();
    window.history.pushState(null, "", nextPage);
    setPage(nextPage);
    setError("");
    setMessage("");
    setShowPassword(false);
  }

  // Show or hide both password fields so the user can check what they typed.
  function togglePassword() {
    setShowPassword((currentValue) => !currentValue);
  }

  // Check the signup fields before sending anything to the backend.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (isSignup && !name) {
      setError("Please enter your full name.");
      return;
    }

    if (isSignup && password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }

    if (isSignup && password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    // This is a sample session, not authentication. Never use this email check
    // for real access control; the backend must verify credentials and roles.
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    if (isSignup) {
      setMessage("Signup validated. Account creation still needs a backend. Use the user login to preview the dashboard.");
      return;
    }
    if (isAdmin && !["admin@example.com", "master@example.com"].includes(email)) {
      setError("For this demo, use admin@example.com or master@example.com.");
      return;
    }
    setAccount({
      email,
      name: isAdmin ? (email === "master@example.com" ? "Master Admin" : "Demo Admin") : "Demo User",
      role: isAdmin ? (email === "master@example.com" ? "master_admin" : "admin") : "user",
    });
  }

  // End the sample session and clear the form messages.
  function logout() {
    setAccount(null);
    setMessage("");
    setError("");
    setShowPassword(false);
  }

  if (account) {
    return <Dashboard account={account} onLogout={logout} />;
  }

  if (!pageExists) {
    return (
      <main className="form-area">
        <div className="form-box">
          <h1>Page not found</h1>
          <a href="/login" onClick={(event) => changePage(event, "/login")}>
            Return to sign in
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <aside className="intro">
        <a
          className="logo"
          href="/login"
          onClick={(event) => changePage(event, "/login")}
          aria-label="Freebee4me home"
        >
          Freebee<span>4me</span>
        </a>

        <div className="intro-text">
          <p className="tagline">GIVE MORE. WASTE LESS.</p>
          <h1>A little sharing.<br />A big difference.</h1>
          <p className="intro-description">
            Give the things you no longer need a new home.
            Find something useful, free, and close to you.
          </p>
          <div className="tags">
            <span>Share locally</span>
            <span>Connect with neighbours</span>
          </div>
        </div>

        <p className="intro-footer">Good things deserve another chapter.</p>
      </aside>

      <section className="form-area" aria-labelledby="title">
        <div className="form-box">
          <p className="tagline">
            {isAdmin ? "ADMIN ACCESS" : "YOUR SHARING COMMUNITY"}
          </p>
          <h2 id="title">{title}</h2>
          <p className="description">{description}</p>

          {/* Reset the input fields when a different form opens. */}
          {!isSignup && (
            <p className="notice demo-help">
              {isAdmin
                ? "Demo: admin@example.com or master@example.com, with any non-empty password."
                : "Demo: enter any valid email and a non-empty password to explore the user dashboard."}
            </p>
          )}

          <form key={page} onSubmit={handleSubmit}>
            {isSignup && (
              <div className="field">
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  autoComplete="name"
                  maxLength={100}
                  required
                />
              </div>
            )}

            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                maxLength={254}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="password-box">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={isSignup ? "Create a password" : "Enter your password"}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  minLength={isSignup ? 8 : undefined}
                  aria-describedby={isSignup ? "password-help" : undefined}
                  required
                />
                <button
                  type="button"
                  className="show-button"
                  onClick={togglePassword}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {isSignup && <small id="password-help">Use at least 8 characters.</small>}
            </div>

            {isSignup && (
              <div className="field">
                <label htmlFor="confirm">Confirm password</label>
                <input
                  id="confirm"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
            )}

            {/* Announce validation messages to screen reader users too. */}
            {error && <p className="notice error" role="alert">{error}</p>}
            {message && <p className="notice" role="status">{message}</p>}

            <button className="submit-button" type="submit">{buttonText}</button>
          </form>

          {/* Public pages only link to user login and signup. */}
          {!isAdmin && (
            <p className="form-link">
              {isSignup ? "Already have an account?" : "New to Freebee4me?"}{" "}
              <a
                href={isSignup ? "/login" : "/signup"}
                onClick={(event) => changePage(event, isSignup ? "/login" : "/signup")}
              >
                {isSignup ? "Sign in" : "Create account"}
              </a>
            </p>
          )}

          {isAdmin && (
            <p className="form-link">
              Admin accounts are appointed by the master admin.
              There is no public admin signup.
            </p>
          )}

          <p className="preview-note">
            Demo preview · Login opens sample dashboards, without real authentication.
          </p>
        </div>
      </section>
    </main>
  );
}
