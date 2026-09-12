import React, { useMemo, useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import SystemCard from './SystemCard';
import './SystemDirectory.css';

const {
  FiActivity,
  FiBox,
  FiCode,
  FiCommand,
  FiDatabase,
  FiGrid,
  FiLayers,
  FiSearch,
  FiShield,
  FiUsers
} = FiIcons;

const systems = [
  {
    name: 'AXiM Core',
    category: 'Command center',
    description: 'Telemetry, action approvals, emergency controls, and executive command.',
    status: 'Primary',
    statusTone: 'primary',
    tone: 'yellow',
    activity: '6 actions awaiting review',
    icon: FiCommand,
    url: 'https://core.axim.us.com?source=arc',
    external: true
  },
  {
    name: 'AXiM Passport SSO',
    category: 'Identity',
    description: 'Manage secure sessions, authorized users, and hardware-bound access.',
    status: 'Protected',
    statusTone: 'secure',
    tone: 'slate',
    activity: 'Session verified',
    icon: FiShield,
    url: 'https://passport.axim.us.com?source=arc',
    external: true
  },
  {
    name: 'Onyx AI Cockpit',
    category: 'Intelligence',
    description: 'Access the cognitive command bridge and operational intelligence workflows.',
    status: 'Connected',
    statusTone: 'online',
    tone: 'purple',
    activity: 'Ready for command',
    icon: FiBox,
    url: 'https://onyx.axim.us.com?source=arc',
    external: true
  },
  {
    name: 'AXiM Support System',
    category: 'Internal systems',
    description: 'Open workforce operations, permissions, and internal administration.',
    status: 'Operational',
    statusTone: 'online',
    tone: 'orange',
    activity: 'No pending requests',
    icon: FiUsers,
    url: 'https://support.axim.us.com?source=arc',
    external: true
  },
  {
    name: 'AXiM Coding Lab',
    category: 'Engineering',
    description: 'Manage repositories, pull requests, deployments, and release workflows.',
    status: 'Operational',
    statusTone: 'online',
    tone: 'blue',
    activity: '2 pull requests require review',
    icon: FiCode,
    url: 'https://coder.axim.us.com?source=arc',
    external: true
  },
  {
    name: 'Green Machine',
    category: 'Infrastructure',
    description: 'Monitor event routing, queues, retries, and service-to-service delivery.',
    status: 'Operational',
    statusTone: 'online',
    tone: 'green',
    activity: '3 dead-letter events',
    icon: FiActivity,
    url: 'https://greenmachine.axim.us.com?source=arc',
    external: true
  },
  {
    name: 'Mesh Network',
    category: 'Infrastructure',
    description: 'Review governed data services, audit activity, and operational records.',
    status: 'Operational',
    statusTone: 'online',
    tone: 'teal',
    activity: 'Last sync 2 min ago',
    icon: FiDatabase,
    url: 'https://mesh.axim.us.com?source=arc',
    external: true
  },
  {
    name: 'VendOS Fleet OS',
    category: 'Infrastructure',
    description: 'Manage vending systems.',
    status: 'Operational',
    statusTone: 'online',
    tone: 'blue',
    activity: 'Fleet operational',
    icon: FiGrid,
    url: 'https://vendos.axim.us.com?source=arc',
    external: true
  },
  {
    name: 'Voice Core Hub',
    category: 'Infrastructure',
    description: 'Manage communications.',
    status: 'Operational',
    statusTone: 'online',
    tone: 'purple',
    activity: 'Hub running',
    icon: FiActivity,
    url: 'https://voice.axim.us.com?source=arc',
    external: true
  },
  {
    name: 'Asguard SOC Sentinel',
    category: 'Infrastructure',
    description: 'Security and operations.',
    status: 'Operational',
    statusTone: 'online',
    tone: 'red',
    activity: 'SOC secure',
    icon: FiShield,
    url: 'https://asguard.axim.us.com?source=arc',
    external: true
  }
];

function SystemDirectory({ previewMode, onNotify }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredSystems = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    return systems.filter((system) => {
      const matchesQuery = !normalizedQuery
        || `${system.name} ${system.category} ${system.description}`
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesFilter = filter === 'all'
        || (filter === 'active' && ['Operational', 'Connected', 'Primary'].includes(system.status))
        || (filter === 'attention' && system.activity?.includes('require'));

      return matchesQuery && matchesFilter;
    });
  }, [filter, query]);

  const openSystem = (system) => {
    if (previewMode) {
      onNotify?.('System links are disabled in preview mode.', 'info');
      return;
    }

    if (system.url === '/#') return;

    if (system.url.startsWith('/#')) {
      window.location.hash = system.url.replace('/#', '');
      return;
    }

    window.open(system.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="system-directory">
      <div className="directory-heading">
        <div>
          <p className="eyebrow">AXiM ecosystem</p>
          <h2>Systems directory</h2>
          <span>One secure launch point for every internal operation.</span>
        </div>
        <div className="directory-mark">
          <SafeIcon icon={FiGrid} />
        </div>
      </div>

      <div className="directory-tools">
        <label className="directory-search">
          <SafeIcon icon={FiSearch} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search systems"
            aria-label="Search systems"
          />
        </label>

        <div className="directory-filters" aria-label="System filters">
          <button
            type="button"
            className={filter === 'all' ? 'selected' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            type="button"
            className={filter === 'active' ? 'selected' : ''}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            type="button"
            className={filter === 'attention' ? 'selected' : ''}
            onClick={() => setFilter('attention')}
          >
            Attention
          </button>
        </div>
      </div>

      {filteredSystems.length ? (
        <div className="system-grid">
          {filteredSystems.map((system, index) => (
            <SystemCard
              key={system.name}
              system={system}
              index={index}
              previewMode={previewMode}
              onOpen={openSystem}
            />
          ))}
        </div>
      ) : (
        <div className="directory-empty">
          <SafeIcon icon={FiLayers} />
          <span>No systems match your search.</span>
        </div>
      )}
    </section>
  );
}

export default SystemDirectory;