// --- Email field ---
function EmailField() {
   const part = div(
      { class: "field" },
      label("Email"),
      input({
         type: "email",
         placeholder: "Enter your email",
         $part: "input",
      }),
      div({
         class: "error",
         "aria-live": "polite",
         style: "display:none",
         $part: "error",
      })
   )

   const { input, error } = part

   function hasError() {
      return error.style.display !== "none" && error.textContent !== ""
   }

   function showError(message: string) {
      error.textContent = message
      error.style.display = "block"
      input.setAttribute("aria-invalid", "true")
   }

   function clearError() {
      if (!hasError()) return
      error.textContent = ""
      error.style.display = "none"
      input.removeAttribute("aria-invalid")
   }

   input.addEventListener("input", () => {
      if (hasError()) clearError()
   })

   return {
      input, // expose the target so `on(...)` can bind blur
      showError,
      clearError,
      get value() {
         return input.value.trim()
      },
      get valid() {
         const v = input.value.trim()
         return !!v && v.includes("@") && v.includes(".")
      },
   }
}

// --- Password field (Password / Confirm Password) ---
function PasswordField(
   labelText: "Password" | "Confirm Password" = "Password"
) {
   const part = div(
      { class: "field" },
      label(labelText),
      input({
         type: "password",
         placeholder: `Enter ${labelText.toLowerCase()}`,
         $part: "input",
      }),
      div({
         class: "error",
         "aria-live": "polite",
         style: "display:none",
         $part: "error",
      })
   )

   const { input, error } = part

   function hasError() {
      return error.style.display !== "none" && error.textContent !== ""
   }

   function showError(message: string) {
      error.textContent = message
      error.style.display = "block"
      input.setAttribute("aria-invalid", "true")
   }

   function clearError() {
      if (!hasError()) return
      error.textContent = ""
      error.style.display = "none"
      input.removeAttribute("aria-invalid")
   }

   input.addEventListener("input", () => {
      if (hasError()) clearError()
   })

   return {
      input, // expose for `on(...)`
      showError,
      clearError,
      get value() {
         return input.value
      },
      get valid() {
         return this.value.length >= 8
      },
   }
}

// --- App (expose-object + on($partEl, ...) wiring) ---
function App() {
   const part = form(
      { class: "signup-form" },
      h2("Create Account"),
      {
         emailField: EmailField(),
         passwordField: PasswordField("Password"),
         confirmField: PasswordField("Confirm Password"),
      },
      button({ type: "submit", $part: "submit" }, "Sign Up")
   )

   // same logic as before, but now we pass $parts instead of uuids
   on(part.emailField.input, "blur", () => {
      if (!part.emailField.valid)
         part.emailField.showError("Please enter a valid email")
   })

   on(part.passwordField.input, "blur", () => {
      if (!part.passwordField.valid)
         part.passwordField.showError("Password must be at least 8 characters")
   })

   on(part.confirmField.input, "blur", () => {
      if (!part.confirmField.valid) {
         part.confirmField.showError("Password must be at least 8 characters")
      } else if (part.confirmField.value !== part.passwordField.value) {
         part.confirmField.showError("Passwords do not match")
      }
   })

   on(part.submit, "click", (ev) => {
      ev.preventDefault()
      console.log("Submitting:", {
         email: part.emailField.value,
         password: part.passwordField.value,
      })
   })

   return part
}
