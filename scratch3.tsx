

// Login Form implementation in your new framework

type FormData = {
  email: string
  password: string
  // Validation state (mutated by components)
  emailValid?: boolean
  passwordValid?: boolean
  emailError?: string
  passwordError?: string
  touched?: { email: boolean, password: boolean }
}

function App() {
  const submitError = Store<string | null>(null)
  const isSubmitting = Store(false)

  // Form data object that components will mutate
  const formData: FormData = {
    email: "",
    password: "",
    touched: { email: false, password: false }
  }

  on(LoginForm, 'submit', 'submit', async (data, ev) => {
    ev.preventDefault()

    // Check if form is valid (components have mutated the data object)
    if (!data.emailValid || !data.passwordValid) {
      return // Form is invalid, InputFields will show errors
    }

    submitError.set(null)
    isSubmitting.set(true)

    // Fake server call
    await new Promise(r => setTimeout(r, 500))

    if (data.email === "fail@example.com") {
      submitError.set("🔥 Server says: Email already exists")
    } else {
      alert("✅ Form submitted: " + JSON.stringify({
        email: data.email,
        password: data.password
      }, null, 2))
    }

    isSubmitting.set(false)
  })

  return Container(
    h2("Login"),
    LoginForm(formData),
    submitError.get() && ErrorMessage(submitError.get())
  )
}

function LoginForm(formData: FormData) {
  return form({ id: $.form },
    InputField(formData, "email", "Email"),
    InputField(formData, "password", "Password", "password"),
    button({
      type: "submit",
      style: "padding: 0.75rem 1.5rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;"
    }, "Submit")
  )
}

function InputField(formData: FormData, name: keyof Pick<FormData, 'email' | 'password'>, label: string, type: string = "text") {
  return div({ style: "margin-bottom: 1rem;" },
    label(
      label,
      br(),
      input({
        id: $.input,
        type,
        value: formData[name],
        style: "padding: 0.5rem; width: 100%; box-sizing: border-box; border-radius: 4px;"
      })
    ),
    div({ id: $.error, style: "color: red; margin-top: 0.25rem; min-height: 1.2em;" })
  )
  .auto(({ $ }) => {
    const currentValue = $.input.value
    const wasTouched = formData.touched![name]

    // Update form data with current values
    formData[name] = currentValue as any

    // Mark as touched on blur
    $.input.addEventListener('blur', () => {
      formData.touched![name] = true
      validateAndUpdate()
    })

    // Validate on input if already touched
    $.input.addEventListener('input', () => {
      if (formData.touched![name]) {
        validateAndUpdate()
      }
    })

    function validateAndUpdate() {
      let isValid = true
      let errorMessage = ""

      if (name === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(currentValue)) {
          isValid = false
          errorMessage = "Invalid email"
        }
        formData.emailValid = isValid
        formData.emailError = errorMessage
      }

      if (name === 'password') {
        if (currentValue.length < 6) {
          isValid = false
          errorMessage = "Password too short"
        }
        formData.passwordValid = isValid
        formData.passwordError = errorMessage
      }

      // Update UI
      $.input.style.border = isValid ? "1px solid #ccc" : "1px solid red"
      $.error.textContent = formData.touched![name] && !isValid ? errorMessage : ""
    }

    // Initial validation
    validateAndUpdate()
  })
}

function ErrorMessage(message: string) {
  return div({
    style: "color: red; margin-bottom: 1rem; padding: 0.75rem; background: #fee; border: 1px solid #fcc; border-radius: 4px;"
  }, message)
}

function Container(...children: any[]) {
  return div({
    style: "max-width: 400px; margin: 2rem auto; font-family: sans-serif; padding: 1rem;"
  }, ...children)
}


function Store<T>(initial: T) {
  let value = initial
  return {
    get: () => value,
    set: (newValue: T) => { value = newValue }
  }
}