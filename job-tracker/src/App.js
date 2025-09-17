import JobTracker from "./components/JobTracker";

export default function App() {
  return <JobTracker />;
}

/*import React from "react";
import JobTracker from "./components/JobTracker";
import SeedJobs from "./dev/SeedJobs";

export default function App() {
  const showSeed = window.location.search.includes("seed");
  return showSeed ? <SeedJobs /> : <JobTracker />;
}*/