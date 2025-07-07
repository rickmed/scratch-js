// === App job ===
go(function* App() {
  while (true) {
    // Show loading screen while fetching user
    const loadingJob = yield* uiGo(Loading)
    let user = yield* fetchUser()
    loadingJob.abort()

    // Mount main screen
    const job = yield* uiGo(() =>
      user ? LoggedIn(user) : LoggedOut()
    )

    // Wait for transition
    const action = yield* job.wait()
    job.abort()

    if (action === 'logout') {
      user = null
    } else if (action === 'login') {
      user = null // triggers refetch
    }
  }
})

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