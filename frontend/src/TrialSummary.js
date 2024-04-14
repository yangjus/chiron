import React from 'react';

const TrialSummary = ({ summary }) => {
    // summary is a JSON of {Title, Date, Experiment, Results, Limitations}
  return (
    <div className="container2">
        <div className="card">
            <h3 className="card-h3">Clinical Trial</h3>
            <p>{summary.Title}</p>
            <h3 className="card-h3">Date</h3>
            <p>{summary.Date}</p>
            <h3 className="card-h3">Experiment</h3>
            <p>{summary.Experiment}</p>
            <h3 className="card-h3">Results</h3>
            <p>{summary.Results}</p>
            <h3 className="card-h3">Limitations</h3>
            <p>{summary.Limitations}</p>
        </div>
    </div>
  );
};

export default TrialSummary;