const CUSTOMER = [
  { id: "measure", label: "New measurement" },
  { id: "orders", label: "My orders" },
];

const TAILOR = [
  { id: "preview", label: "Pattern preview" },
  { id: "formulas", label: "Formulas" },
  { id: "jobs", label: "Orders" },
];

export default function Sidebar({ session, page, onPage, onSignOut }) {
  const items = session.role === "tailor" ? TAILOR : CUSTOMER;
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-[#2a3342] bg-[#0c0f14]">
      <div className="border-b border-[#2a3342] px-5 py-5">
        <p className="text-xs uppercase tracking-[0.18em] text-[#d6b27a]">Pattern room</p>
        <p className="mt-2 text-sm font-medium">{session.username}</p>
        <p className="text-xs capitalize text-[#9aabbf]">{session.role}</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onPage(item.id)}
            className={`block w-full rounded px-3 py-2 text-left text-sm ${page === item.id ? "bg-[#1c2430] text-white" : "text-[#b7c3d4]"}`}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <button type="button" onClick={onSignOut} className="m-3 rounded border border-[#334155] py-2 text-sm text-[#d6b27a]">
        Sign out
      </button>
    </aside>
  );
}
