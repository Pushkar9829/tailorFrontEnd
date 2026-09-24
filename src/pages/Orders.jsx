import { useEffect, useState } from "react";

export default function Orders({ token, onOpen }) {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/jobs/mine", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Could not load orders");
        setJobs(body);
      })
      .catch((err) => setError(err.message));
  }, [token]);

  if (error) return <p className="p-6 text-sm text-[#fb7185]">{error}</p>;

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-3xl overflow-hidden rounded border border-[#2a3342]">
        {jobs.length === 0 ? <p className="p-4 text-sm text-[#9aabbf]">No saved orders yet. Create one from New measurement.</p> : jobs.map((job) => (
          <div key={job.id} className="flex items-center justify-between gap-3 border-b border-[#2a3342] px-4 py-3 text-sm last:border-b-0">
            <div>
              <p>{job.order?.title || job.order?.label || job.patternId}</p>
              <p className="text-xs text-[#9aabbf]">
                Bust {job.measurementSnapshot?.bust ?? "—"} · Length {job.measurementSnapshot?.length ?? "—"} {job.unit}
              </p>
            </div>
            <button type="button" onClick={() => onOpen(job)} className="rounded border border-[#334155] px-3 py-1 text-xs">Open</button>
          </div>
        ))}
      </div>
    </div>
  );
}
