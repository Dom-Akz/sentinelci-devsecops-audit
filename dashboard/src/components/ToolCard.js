import React from 'react';

function ToolCard({ tool, onRun }) {
  const [showResults, setShowResults] = React.useState(false);
  const [results, setResults] = React.useState(null);

  const handleRun = async () => {
    // In a real app, would call the API
    // For now, just show a placeholder
    setShowResults(true);
    setResults({
      tool: tool.name,
      returncode: 0,
      stdout: 'Analysis running...',
      stderr: '',
      output_data: {}
    });
  };

  return (
    <div className="tool-card">
      <h3>{tool.name}</h3>
      <p>{tool.description}</p>
      <p><strong>Status:</strong> {tool.status}</p>
      <p><strong>Command:</strong> {tool.command.join(' ')}</p>
      <button onClick={() => onRun()}>Run Analysis</button>
    </div>
  );
}

export default ToolCard;