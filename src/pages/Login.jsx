import { useState } from "react";

const ROLES = [
  { id: "customer", title: "Customer", username: "customer", password: "customer", text: "Enter sizes and download the cut file." },
  { id: "tailor", title: "Tailor", username: "admin", password: "tailor", text: "Set formulas and review orders." },
];

export default function Login({ onSuccess }) {
  const [role, setRole] = useState("customer");
  const [username, setUsername] = useState("customer");
  const [password, setPassword] = useState("customer");
  const [error, setError] = useState("");

  function pickRole(next) {
    const account = ROLES.find((item) => item.id === next);
    setRole(next);
    setUsername(account.username);
    setPassword(account.password);
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Login failed");
      if (role === "tailor" && body.role !== "tailor") throw new Error("This account is a customer. Choose Customer.");
      if (role === "customer" && body.role !== "customer") throw new Error("This account is a tailor. Choose Tailor.");
      onSuccess(body);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="grid h-screen grid-cols-1 bg-[#101318] md:grid-cols-[1.1fr_1fr]">
      <section className="hidden flex-col justify-between border-r border-[#2a3342] p-12 md:flex">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#d6b27a]">Pattern room</p>
          <h1 className="mt-4 max-w-md text-4xl font-semibold leading-tight">Blouse patterns, measured and ready to cut.</h1>
        </div>
        <p className="max-w-sm text-sm text-[#9aabbf]">Customers enter sizes. Tailors own the formulas. The laser file is the same SVG either way.</p>
      </section>
      <section className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-md">
          <h2 className="text-2xl font-semibold">Sign in</h2>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {ROLES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => pickRole(item.id)}
                className={`rounded border px-3 py-3 text-left ${role === item.id ? "border-[#d6b27a] bg-[#221c12]" : "border-[#334155]"}`}
              >
                <span className="block text-sm font-medium">{item.title}</span>
                <span className="mt-1 block text-xs text-[#9aabbf]">{item.text}</span>
                <span className="mt-2 block font-mono text-xs text-[#e7edf5]">{item.username} / {item.password}</span>
              </button>
            ))}
          </div>
          <label className="mt-6 block text-xs uppercase tracking-wide text-[#9aabbf]">
            Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} className="mt-1 w-full rounded border border-[#334155] bg-[#171c24] px-3 py-2 text-sm" />
          </label>
          <label className="mt-3 block text-xs uppercase tracking-wide text-[#9aabbf]">
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded border border-[#334155] bg-[#171c24] px-3 py-2 font-mono text-sm" />
          </label>
          {error ? <p className="mt-3 text-sm text-[#fb7185]">{error}</p> : null}
          <button type="submit" className="mt-6 w-full rounded bg-[#d6b27a] py-2.5 text-sm font-semibold text-[#1b1408]">Continue</button>
        </form>
      </section>
    </div>
  );
}
