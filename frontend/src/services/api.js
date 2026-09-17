// jobs.json nu exista in template — e generat de workflow-ul de configurare.
// import.meta.glob nu crapa build-ul cand fisierul lipseste, spre deosebire de un import direct.
const jobsModules = import.meta.glob("../../../jobs.json", {
  eager: true,
  import: "default",
});
let localJobs = Object.values(jobsModules)[0] ?? [];

const solidColors = [
  "bg-blue-600 text-white",
  "bg-indigo-600 text-white",
  "bg-sky-500 text-white",
  "bg-rose-600 text-white",
  "bg-amber-600 text-white",
  "bg-emerald-600 text-white",
  "bg-purple-600 text-white",
  "bg-pink-600 text-white",
  "bg-violet-600 text-white",
  "bg-teal-600 text-white",
  "bg-orange-600 text-white",
  "bg-fuchsia-600 text-white",
  "bg-cyan-600 text-white",
  "bg-yellow-600 text-white",
  "bg-blue-700 text-white",
];

function getLogoBg(companyName) {
  if (!companyName) return solidColors[0];
  let hash = 0;
  for (let i = 0; i < companyName.length; i++) {
    hash = companyName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % solidColors.length;
  return solidColors[index];
}

export async function getJobs() {
  let jobsList = localJobs;
  if (!jobsList || jobsList.length === 0) {
    try {
      const res = await fetch("./jobs.json");
      if (res.ok) {
        jobsList = await res.json();
      }
    } catch {
      // fallback silent
    }
  }

  return (jobsList || []).map((job, index) => {
    const company = job.company || "Companie Necunoscută";
    return {
      id: job._version_ ? `${job._version_}-${index}` : `job-${index}`,
      title: job.title || "Job Fără Titlu",
      company: company,
      logoBg: getLogoBg(company),
      location: Array.isArray(job.location)
        ? job.location.join(", ")
        : job.location || "Nespecificat",
      salary: Array.isArray(job.salary)
        ? job.salary.join(", ")
        : job.salary || null,
      date: job.date || null,
      status: job.status || "published",
      tags: job.tags || [],
      url: Array.isArray(job.url) ? job.url[0] : job.url || "",
      _root_:
        job._root_ || (Array.isArray(job.url) ? job.url[0] : job.url) || "",
    };
  });
}
