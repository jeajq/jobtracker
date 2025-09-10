import React, { useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import { db } from './firebase'; // Import Firestore database
import { collection, getDocs } from 'firebase/firestore';

function App() {
  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'test-collection'));
        querySnapshot.forEach((doc) => {
          console.log(doc.id, '=>', doc.data());
        });
      } catch (error) {
        console.error('Error fetching Firestore data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
