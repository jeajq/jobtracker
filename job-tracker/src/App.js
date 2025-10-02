import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';

function App() {
  const [jobs, setJobs] = useState([]);
  const [jobName, setJobName] = useState('');
  const [jobDesc, setJobDesc] = useState('');

  const jobsCollection = collection(db, 'jobs');

  //fetch jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const querySnapshot = await getDocs(jobsCollection);
        const jobsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setJobs(jobsData);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      }
    };

    fetchJobs();
  }, [jobsCollection]);

  //add new job with jobName as document ID
  const handleAddJob = async (e) => {
    e.preventDefault();
    if (!jobName) return;

    try {
      const jobRef = doc(db, 'jobs', jobName); // use jobName as ID
      await setDoc(jobRef, {
        name: jobName,
        description: jobDesc,
        createdAt: new Date(),
      });

      setJobs([...jobs, { id: jobName, name: jobName, description: jobDesc }]);
      setJobName('');
      setJobDesc('');
    } catch (error) {
      console.error('Error adding job:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Job Tracker</h1>

      <form onSubmit={handleAddJob} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Job Name"
          value={jobName}
          onChange={(e) => setJobName(e.target.value)}
          required
          style={{ marginRight: '10px' }}
        />
        <input
          type="text"
          placeholder="Job Description"
          value={jobDesc}
          onChange={(e) => setJobDesc(e.target.value)}
          style={{ marginRight: '10px' }}
        />
        <button type="submit">Add Job</button>
      </form>

      <h2>Jobs:</h2>
      <ul>
        {jobs.map((job) => (
          <li key={job.id}>
            <strong>{job.name}</strong>: {job.description}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
