export const localPreviewMetrics = [
  { label: 'Gross revenue', value: '$184.2K', delta: '+12.4%', tone: 'positive' },
  { label: 'Active nodes', value: '10 / 10', delta: 'All online', tone: 'positive' },
  { label: 'Open tickets', value: '14', delta: '2 priority', tone: 'warning' },
  { label: 'Pull requests', value: '6', delta: '2 awaiting you', tone: 'warning' },
  { label: 'DLQ depth', value: '3', delta: '-8 today', tone: 'neutral' },
  { label: 'Ledger delta', value: '+$12.8K', delta: '24 hour', tone: 'positive' }
];

export const localPulseData = {
  edge: 18,
  database: 42,
  onyx: 31
};

export const localHitlQueue = [
  {
    id: 'local-pr-4538',
    task_title: 'Support patch: stale ticket assignment',
    source_app: 'Coding Lab',
    action_type: 'Pull Request',
    priority: 'HIGH',
    created_at: new Date(Date.now() - 8 * 60000).toISOString(),
    summary: 'Corrects a race condition when assigning escalated support tickets.',
    additions: 42,
    deletions: 11,
    files_changed: 3
  },
  {
    id: 'local-dlq-221',
    task_title: 'Executive briefing delivery retry',
    source_app: 'Core Relay',
    action_type: 'Dead Letter',
    priority: 'MEDIUM',
    created_at: new Date(Date.now() - 21 * 60000).toISOString(),
    summary: 'Re-dispatch one failed executive briefing delivery.',
    additions: 0,
    deletions: 0,
    files_changed: 0
  }
];

export function getLocalOnyxResponse(command) {
  const normalized = command.toLowerCase();

  if (normalized.includes('status')) {
    return [
      'ONYX STATUS REPORT',
      '──────────────────',
      'Edge command channel     OPERATIONAL',
      'Core relay               OPERATIONAL',
      'Executive action queue   2 ITEMS PENDING',
      'Voice transcription      READY',
      '',
      'No critical incidents detected.'
    ].join('\n');
  }

  if (normalized.includes('briefing')) {
    return [
      'EXECUTIVE SYSTEM BRIEFING',
      '─────────────────────────',
      'All primary services are operational.',
      'Two actions require executive review.',
      'Onyx Bridge latency is within expected range.',
      'No global halt conditions are active.'
    ].join('\n');
  }

  if (normalized.includes('security')) {
    return [
      'SECURITY POSTURE',
      '────────────────',
      'Passport session           VERIFIED',
      'Hardware-bound access     ACTIVE',
      'Edge session encryption    256-BIT',
      'Open security risks       NONE DETECTED'
    ].join('\n');
  }

  return [
    'LOCAL ONYX RESPONSE',
    '───────────────────',
    `Command received: ${command}`,
    '',
    'This workspace is running without a connected command backend.',
    'Connect an operational edge service to dispatch this command remotely.'
  ].join('\n');
}