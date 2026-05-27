import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function ProofQualityCard({ proofQuality }) {
  if (!proofQuality) {
    return null;
  }

  const missingChecks = proofQuality.missingChecks ?? [];
  const completedChecks = proofQuality.completedChecks ?? [];

  return (
    <article className="workspace-panel proof-quality-card">
      <div className="proof-quality-score">
        <strong>{proofQuality.score}%</strong>
        <div>
          <h2>{proofQuality.label}</h2>
          <p className="subtle">How complete this developer's project evidence looks to employers.</p>
        </div>
      </div>
      <div className="readiness-bar">
        <span style={{ width: `${proofQuality.score}%` }} />
      </div>
      <div className="proof-quality-checks">
        {completedChecks.slice(0, 4).map((check) => (
          <span key={check}>
            <CheckCircle2 size={15} />
            {check}
          </span>
        ))}
      </div>
      {missingChecks.length > 0 && (
        <p className="subtle">Next: {missingChecks.slice(0, 2).join(', ')}.</p>
      )}
    </article>
  );
}
