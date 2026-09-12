import React from 'react';

function CompactDiffViewer({ item }) {
  if (!item.files_changed) return null;

  return (
    <div className="diff-summary">
      <div className="diff-file">
        <span>src/services/ticketAssignment.ts</span>
        <small>{item.files_changed} files changed</small>
      </div>
      <code>
        <span className="diff-remove">- await assignTicket(ticket.id)</span>
        <span className="diff-add">+ await lock.run(ticket.id, assignTicket)</span>
        <span className="diff-add">+ await auditAssignment(ticket.id)</span>
      </code>
      <div className="diff-stats">
        <span>+{item.additions} additions</span>
        <span>-{item.deletions} deletions</span>
      </div>
    </div>
  );
}

export default CompactDiffViewer;