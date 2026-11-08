import React, { useState, useEffect } from 'react';
import { ToolCard } from '../components/ToolCard';

function Dashboard() {
  const [tools, setTools] = useState([]);
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    // Fetch tools from the Flask API
    fetch('http://127.0.0.1:5001/tools')
      .then(res => res.json())
      .then(data => setTools(data))
      .catch(err => console.error('Error fetching tools:', err));
  }, []);

  const runAnalysis = async (toolName) => {
    setShowResults(true);
    setResults(null);
    
    try {
      const res = await fetch('http://127.0.0.1:5001/run-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: toolName })
      });
      const data = await res.json();
      
      if (data.success) {
        setResults({
          tool: data.data.tool,
          returncode: data.data.returncode,
          stdout: data.data.stdout,
          stderr: data.data.stderr,
          output: data.data.output_data
        });
        setShowResults(true);
      } else {
        setResults({ error: data.error });
      }
    } catch (error) {
      setResults({ error: error.message });
    }
  };

  return (
    <div className="dashboard">
      <h1>PF DevSecOps Dashboard</h1>
      
      <div className="tools-grid">
        {tools.map((tool) => (
          <ToolCard key={tool.name} tool={tool} onRun={() => runAnalysis(tool.name)} />
        ))}
      </div>
      
      {showResults && (
        <div className="results-panel">
          <h3>Analysis Results</h3>
          <button onClick={() => setShowResults(false)}>&times;</button>
          <pre>{results ? JSON.stringify(results, null, 2) : 'Loading...'}</pre>
          <button onClick={() => setShowResults(false)}>Close</button>
        </div>
      )}
    </div>
  );
}

export default Dashboard;