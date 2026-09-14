import React from 'react';
import * as FiIcons from 'react-icons/fi';
import { triggerHaptic } from '../../utils/haptics';
import SafeIcon from '../../common/SafeIcon';

const { FiActivity, FiCommand, FiLayers } = FiIcons;

const items = [
  { id: 'telemetry', label: 'Pulse', icon: FiActivity },
  { id: 'hitl', label: 'Actions', icon: FiLayers },
  { id: 'onyx', label: 'Onyx', icon: FiCommand }
];

function BottomNav({ activeView, onChange, queueCount }) {
  return (
    <nav className="bottom-nav" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }} aria-label="Primary navigation">
      {items.map((item) => (
        <button
          type="button"
          key={item.id}
          className={activeView === item.id ? 'active' : ''}
          onClick={() => { triggerHaptic('light'); onChange(item.id); }}
        >
          <span>
            <SafeIcon icon={item.icon} />
            {item.id === 'hitl' && queueCount > 0 && <b>{queueCount}</b>}
          </span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}

export default BottomNav;