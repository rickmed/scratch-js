// Whatever argument you pass to component will be available (typed) at first arg cb in on()

function ContactForm() {
   const contacts = Store([])

   on(EmailInput, 'submit', 'click', (emailData, ev) => {
     // emailData was mutated by EmailInput with validation state
     if (emailData.isValid) {
       contacts.add({ email: emailData.currentValue })
     } else {
       showError("Please enter valid email")
     }
   })
 }

 function EmailInput(emailData: { value: string, isValid?: boolean, currentValue?: string }) {
   return Input({ value: emailData.value })
     .auto(({ $ }) => {
       const currentValue = $.input.value

       // Mutate the shared object with computed state
       emailData.currentValue = currentValue
       emailData.isValid = validateEmailFormat(currentValue) &&
                          checkDomainExists(currentValue) &&
                          !isDisposableEmail(currentValue)

       // Visual feedback
       $.input.classList.toggle('invalid', !emailData.isValid)
     })
 }

 // Usage
 function ContactForm() {
   const contacts = Store([])

   return List(contacts, contact => {
     const emailData = { value: contact.email } // Start with source data
     return EmailInput(emailData) // Component mutates it with computed state
   })
 }