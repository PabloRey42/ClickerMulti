import { useState } from "react";
import { useAuthStore } from "./state/authStore";
import { LoginPage } from "./pages/LoginPage";
import { BattlePage } from "./pages/BattlePage";
import { CollectionPage } from "./pages/CollectionPage";

export function App() {
  const user = useAuthStore((s) => s.user);
  const [view, setView] = useState<"battle" | "collection">("battle");

  if (!user) return <LoginPage />;

  return view === "battle" ? (
    <BattlePage onOpenCollection={() => setView("collection")} />
  ) : (
    <CollectionPage onBack={() => setView("battle")} />
  );
}
