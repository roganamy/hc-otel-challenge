import './otel';
import React from 'react';
import MemeGenerator from './components/MemeGenerator';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="App">
      <MemeGenerator />
    </div>
  );
};

export default App;
