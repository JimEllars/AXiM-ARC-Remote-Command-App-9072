import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiActivity, FiAlertTriangle, FiClipboard, FiGitPullRequest, FiRadio, FiShield } = FiIcons;

const templates = [
  {
    label: 'System briefing',
    command: '/briefing',
    icon: FiClipboard
  },
  {
    label: 'Platform status',
    command: '/status',
    icon: FiActivity
  },
  {
    label: 'Retry DLQ',
    command: '/dlq-retry',
    icon: FiRadio
  },
  {
    label: 'Review deployments',
    command: 'Show all deployments requiring executive review',
    icon: FiGitPullRequest
  },
  {
    label: 'Security posture',
    command: 'Summarize the current AXiM security posture and active risks',
    icon: FiShield
  },
  {
    label: 'Incident response',
    command: 'Identify the highest-priority active incident and recommend next actions',
    icon: FiAlertTriangle
  }
];

function CommandTemplates({ disabled, onSelect }) {
  return (
    <section className="command-templates" aria-labelledby="command-templates-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Executive shortcuts</p>
          <h2 id="command-templates-title">Command templates</h2>
        </div>
        <span>{templates.length} ready</span>
      </div>

      <div className="command-chips">
        {templates.map((template) => (
          <button
            type="button"
            key={template.label}
            disabled={disabled}
            onClick={() => onSelect(template.command)}
            title={template.command}
          >
            <SafeIcon icon={template.icon} />
            {template.label}
          </button>
        ))}
      </div>
    </section>
  );
}

export default CommandTemplates;