// --- ids ---
const emailInputId    = uuid();
const emailErrorId    = uuid();
const passwordInputId = uuid();
const passwordErrorId = uuid();
const confirmInputId  = uuid();
const confirmErrorId  = uuid();
const submitButtonId  = uuid();

// --- Email field ---
function EmailField() {
  const root = div({ class: "field" },
    label("Email"),
    input({
      type: "email",
      placeholder: "Enter your email",
      [emailInputId]: ""
    }),
    div({
      class: "error",
      "aria-live": "polite",
      style: "display:none",
      [emailErrorId]: ""
    })
  );

  // elem(): scoped query helper for this component's root
  const elem = <T extends Element = Element>(id: string) =>
    root.querySelector<T>(`[${id}]`)!;

  const inputEl = elem<HTMLInputElement>(emailInputId);
  const errEl   = elem<HTMLDivElement>(emailErrorId);

  const hasError = () =>
    errEl.style.display !== "none" && errEl.textContent !== "";

  const showError = (message: string) => {
    errEl.textContent = message;
    errEl.style.display = "block";
    inputEl.setAttribute("aria-invalid", "true");
  };

  const clearError = () => {
    if (!hasError()) return;
    errEl.textContent = "";
    errEl.style.display = "none";
    inputEl.removeAttribute("aria-invalid");
  };

  // clear only if currently visible
  inputEl.addEventListener("input", () => { if (hasError()) clearError(); });

  return {
    showError,
    clearError,
    get value() { return inputEl.value.trim(); },
    get valid() {
      const v = inputEl.value.trim();
      return !!v && v.includes("@") && v.includes(".");
    }
  };
}

// --- Password field (Password / Confirm Password) ---
function PasswordField(labelText: "Password" | "Confirm Password" = "Password") {
  const inputId = labelText === "Confirm Password" ? confirmInputId : passwordInputId;
  const errorId = labelText === "Confirm Password" ? confirmErrorId : passwordErrorId;

  const root = div({ class: "field" },
    label(labelText),
    input({
      type: "password",
      placeholder: `Enter ${labelText.toLowerCase()}`,
      [inputId]: ""
    }),
    div({
      class: "error",
      "aria-live": "polite",
      style: "display:none",
      [errorId]: ""
    })
  );

  const elem = <T extends Element = Element>(id: string) =>
    root.querySelector<T>(`[${id}]`)!;

  const inputEl = elem<HTMLInputElement>(inputId);
  const errEl   = elem<HTMLDivElement>(errorId);

  const hasError = () =>
    errEl.style.display !== "none" && errEl.textContent !== "";

  const showError = (message: string) => {
    errEl.textContent = message;
    errEl.style.display = "block";
    inputEl.setAttribute("aria-invalid", "true");
  };

  const clearError = () => {
    if (!hasError()) return;
    errEl.textContent = "";
    errEl.style.display = "none";
    inputEl.removeAttribute("aria-invalid");
  };

  inputEl.addEventListener("input", () => { if (hasError()) clearError(); });

  return {
    showError,
    clearError,
    get value() { return inputEl.value; },
    get valid() { return this.value.length >= 8; }
  };
}

// --- App (expose-object + original on(...) style) ---
function App() {
  const part = form({ class: "signup-form" },
    h2("Create Account"),

    // Expose APIs onto `part` while rendering into this context
    {
      emailField:    EmailField(),
      passwordField: PasswordField("Password"),
      confirmField:  PasswordField("Confirm Password"),
    },

    button({ type: "submit", [submitButtonId]: "" }, "Sign Up")
  );

  // Keep the original wiring style:
  on(emailInputId, "blur", () => {
    if (!part.emailField.valid) part.emailField.showError("Please enter a valid email");
  });

  on(passwordInputId, "blur", () => {
    if (!part.passwordField.valid) part.passwordField.showError("Password must be at least 8 characters");
  });

  on(confirmInputId, "blur", () => {
    if (!part.confirmField.valid) {
      part.confirmField.showError("Password must be at least 8 characters");
    } else if (part.confirmField.value !== part.passwordField.value) {
      part.confirmField.showError("Passwords do not match");
    }
  });

  on(submitButtonId, "click", (ev) => {
    ev.preventDefault();
    console.log("Submitting:", {
      email: part.emailField.value,
      password: part.passwordField.value,
    });
  });

  return part;
}
