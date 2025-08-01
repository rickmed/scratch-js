/* Fetch lifecycle */

/****** fetching (with SSR) *******/
function* Component() {
	html`<p>Loading user...</p>`  // html`` by default replaces whatever is this component view slot.
	const user = yield* fetchUser()
   const part = html`<p> Hi! ${user.name}</p>`
}


// Error handling
   // If a component is defined as a genfn, it is executed by a ribu job.
   // If job throws, I don't think tepui needs to do anything special,
      // parent job will catch (maybe Error boundary) and show error.

// SSR
   // If component is ran on the server, ie, server routing.
   // streams html to the client? <p>Loading user...</p>
   // then it fetches on the server
   // it continues to do this until genFn is done
   // if any auto() is called, it runs once.


/****** fetching (with SSR and effects) *******/
function* Component2(store: {someSignal: string}) {

   // html`` by default replaces whatever is in this component view slot.
   html`<p>Loading input...</p>`

   const value = yield* fetchInputDefaultValue()

   const part = html`
      <div>
         <p class=${$.dynValue} </p>
         <input type="text" id="theInput" value=${value}>
      </div>
   `
   .auto(({$}) => {
      $.dynValue = store.someSignal
   })

   part.elems?.theInput.focus()
}



/****** "Effects" *******/

// Edit todo on input and commit on enter.
function* Component3() {
   const part = html`
      <div>
         <input type="text" id="theInput">
      </div>
   `

   part.slots?.theInput.elem.focus()
}
