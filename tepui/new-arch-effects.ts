import { h } from "tepui"

/* Fetch lifecycle */

/****** fetching (with SSR) *******/
function* Component() {
   h.p("Loading user...") // Replaces whatever is in this component view slot
   const user = yield* fetchUser()
   h.p(`Hi! ${user.name}`)
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
function* Component2(store: { someSignal: string }) {
   h.p({ text: "Loading input..." }) // Replaces whatever is in this component view slot

   const value = yield* fetchInputDefaultValue()

   const part = h.div(
      h.p({ text: $.dynValue }),
      h.input({
         type: "text",
         id: "theInput",
         value: value,
      })
   ).auto(({ $ }) => {
      $.dynValue = store.someSignal
   })

   if (ctx().client) {
      part.elems.theInput.focus()
   }
}

function ShowWindowSize() {
   h.div(`${$.innerWidth} x ${$.innerHeight}`)
      // in SSR is a noop
      .listen(window, "resize", (ev, part) => {
         part.innerWidth = ev.currentTarget.innerWidth
         part.innerHeight = ev.currentTarget.innerHeight
      })

      // .listen is a wrapper of:
      .onClient((part) => {
         const resize = () => {
            part.innerWidth = window.innerWidth
            part.innerHeight = window.innerHeight
         }
         window.addEventListener("resize", resize)
         // when part.cancel() is called, part can call a rsc release like dispose()
         part.rsc(() => window.removeEventListener("resize", resize))
      })
}

/* Timer */
function Timer() {
   /**
    * $.count (no args) → returns the setter object as usual
    * $.count('0') (with arg) → sets initial value AND returns the setter object
    */
   h.div($.count("0"))
      // in SSR is a noop
      .go(function* timer(part) {
         for (;;) {
            part.count++
            yield* sleep(100)
            part.count++
            yield* sleep(500)
         }
      })
}

/* Focus on render */
function FocusInput() {
   input({
      id: "input",
      type: "text",
   }).onClient((part) => {
      part.elems.input.focus()
   })
}
