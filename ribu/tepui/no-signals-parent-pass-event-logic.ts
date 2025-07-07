import { go, CancOK, isErr } from 'ribu'
import { ui, uiGo } from 'tepui'

// ==> Need a way to avoid n x m problem.
   // Looking at mobx to see how/when fetching is done.

// So a component with if statement is an infinite loop that awaits variable change
   // and just renders one component or other.
   // But this is not so different than signals?
      // Let's ignore this for now.
   // Another option is a loop that chatgpt created
      // => Let's explore this for bit.


// 

// === App job ===
function* App() {
   for (;;) {
      const div = yield ui("div")
      yield div.swap(Loading)
      const user = yield* fetchUser().handleErr
      if (isErr(user)) {
         yield* div.swap(ui('p', 'Error fetching user'))
      }
      // Unmounts Loading and runs its onEnd function (that's why need yield bc its async)
      yield div.swap(LoggedIn)

      // still have the problem of repeating div.swap() when
   }
}

// === Components ===

function* Loading() {
  yield ui('p', 'Loading...')
}

function* LoggedOut() {
  yield ui('div',
    ui('button', {
      onclick: function* () {
        return yield CancOK('login')
      }
    }, 'Login')
  )
}

function* LoggedIn(user) {
  yield ui('div',
    ui('button', {
      onclick: function* () {
        return yield CancOK('logout')
      }
    }, 'Logout'),
    ui('span', `Hi ${user.name}`),
    user.premium && ui('span', ' 🌟 Premium')
  )
}


/*
Let's say components yield UI things, what are they? how are they executed?
   - They must be things that launch jobs so errors in them can bubble up to parent.
   - Problem is how parent/child communicate?

*/