const fs = require('fs');

// Add light haptic for tab switches
let navPath = 'src/components/layout/BottomNav.jsx';
let navContent = fs.readFileSync(navPath, 'utf-8');
if (!navContent.includes('triggerHaptic')) {
    navContent = navContent.replace(
      `import SafeIcon from '../../common/SafeIcon';`,
      `import { triggerHaptic } from '../../utils/haptics';\nimport SafeIcon from '../../common/SafeIcon';`
    );

    navContent = navContent.replace(
      `onClick={() => onChange(item.id)}`,
      `onClick={() => { triggerHaptic('light'); onChange(item.id); }}`
    );
    // Since there might be multiple onChange in BottomNav, let's just do a replaceAll on the exact onClick or update the onChange handler.
    // Let's look at BottomNav.jsx first to be safe.
}
