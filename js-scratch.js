import { useState } from "react";
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Setup query client
const queryClient = new QueryClient();

// Simulated async user fetch
function fetchUser() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ name: "RM", premium: true });
    }, 1000);
  });
}

// === App Entry ===
export default function RootApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

// === Main App ===
function App() {
  const [enabled, setEnabled] = useState(false);

  const {
    data: user,
    isPending,
    isError,
    error,
    remove, // clears the user data from cache
  } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
    enabled, // only run after login
  });

  const login = () => setEnabled(true);

  const logout = () => {
    remove();      // clears cached user
    setEnabled(false); // disables query until login again
  };

  return (
    <div>
      <header>My App</header>
      <main>
        {isPending ? (
          <p>Loading...</p>
        ) : isError ? (
          <p>Error: {error.message}</p>
        ) : user ? (
          <LoggedIn user={user} onLogout={logout} />
        ) : (
          <LoggedOut onLogin={login} />
        )}
      </main>
    </div>
  );
}

// === View Components ===

function LoggedIn({ user, onLogout }) {
  return (
    <div>
      <button onClick={onLogout}>Logout</button>
      <span>Hi {user.name}</span>
      {user.premium && <span>🌟 Premium</span>}
    </div>
  );
}

function LoggedOut({ onLogin }) {
  return (
    <div>
      <button onClick={onLogin}>Login</button>
    </div>
  );
}
