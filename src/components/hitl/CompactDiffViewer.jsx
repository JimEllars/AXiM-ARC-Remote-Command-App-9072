import React from 'react';

function CompactDiffViewer({ item }) {
  if (!item || !item.files_changed) return null;

  // Safe parsing for payload diffs
  const payload = item.action_payload || {};
  let additions = item.additions || payload.additions || 0;
  let deletions = item.deletions || payload.deletions || 0;
  let filesChanged = item.files_changed || payload.files_changed || 1;
  let fileName = payload.file_name || 'src/services/ticketAssignment.ts';

  // Defensive fallback if deeply nested
  let diffContent = payload.diff || null;

  return (
    <div className="diff-summary">
      <div className="diff-file">
        <span>{fileName}</span>
        <small>{filesChanged} files changed</small>
      </div>
      {diffContent ? (
        <code>
          {diffContent.split('\n').map((line, i) => {
              if (line.startsWith('+')) return <span key={i} className="diff-add">{line}</span>;
              if (line.startsWith('-')) return <span key={i} className="diff-remove">{line}</span>;
              return <span key={i}>{line}</span>;
          })}
        </code>
      ) : (
        <code>
          <span className="diff-remove">- await assignTicket(ticket.id)</span>
          <span className="diff-add">+ await lock.run(ticket.id, assignTicket)</span>
          <span className="diff-add">+ await auditAssignment(ticket.id)</span>
        </code>
      )}
      <div className="diff-stats">
        <span>+{additions} additions</span>
        <span>-{deletions} deletions</span>
      </div>
    </div>
  );
}

export default CompactDiffViewer;