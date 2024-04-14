import React from 'react';

const TrialSummary = ({ summary }) => {
    // summary is a JSON of {Title, Date, Experiment, Results, Limitations}
  return (
    <div className="container">
        <h2>Title: </h2>
        <p>{summary.Title}</p>
        <h2>Date: </h2>
        <p>{summary.Date}</p>
        <h2>Experiment: </h2>
        <p>{summary.Experiment}</p>
        <h2>Results: </h2>
        <p>{summary.Results}</p>
        <h2>Limitations: </h2>
        <p>{summary.Limitations}</p>
    </div>
  );
};

export default TrialSummary;