import { useState } from "react";
import Sidebar from "./components/Shell/Sidebar.jsx";
import Admin from "./pages/Admin.jsx";
import Login from "./pages/Login.jsx";
import Orders from "./pages/Orders.jsx";
import Studio from "./pages/Studio.jsx";

const TITLES = {
  measure: "New measurement",
  orders: "My orders",
  preview: "Pattern preview",
  formulas: "Formulas",
  jobs: "Orders",
};

function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem("pattern-session") || "null");
  } catch {
    return null;
  }
}

export default function App() {
  const [session, setSession] = useState(readSession);
  const [page, setPage] = useState(() => (readSession()?.role === "tailor" ? "preview" : "measure"));
  const [savedMeasurement, setSavedMeasurement] = useState(null);

  function signIn(next) {
    sessionStorage.setItem("pattern-session", JSON.stringify(next));
    setSession(next);
    setPage(next.role === "tailor" ? "preview" : "measure");
  }

  function signOut() {
    sessionStorage.removeItem("pattern-session");
    setSession(null);
  }

  if (!session?.token) return <Login onSuccess={signIn} />;

  return (
    <div className="flex h-screen overflow-hidden bg-[#101318]">
      <Sidebar session={session} page={page} onPage={setPage} onSignOut={signOut} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center border-b border-[#2a3342] px-6">
          <h1 className="text-base font-semibold">{TITLES[page] || "Pattern room"}</h1>
        </header>
        <main className="min-h-0 flex-1">
          {session.role === "customer" && page === "measure" ? <Studio token={session.token} customerName={session.username} saved={savedMeasurement} /> : null}
          {session.role === "customer" && page === "orders" ? <Orders token={session.token} onOpen={(job) => { setSavedMeasurement(job); setPage("measure"); }} /> : null}
          {session.role === "tailor" ? <Admin token={session.token} section={page} /> : null}
        </main>
      </div>
    </div>
  );
}
