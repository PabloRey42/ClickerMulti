import { useAuthStore } from "./state/authStore";
import { LoginPage } from "./pages/LoginPage";
import { FarmPage } from "./pages/FarmPage";

export function App() {
  const user = useAuthStore((s) => s.user);

  if (!user) return <LoginPage />;

  return <FarmPage />;
}
