const fs = require('fs');
const path = 'src/components/layout/AppShell.jsx';
let content = fs.readFileSync(path, 'utf-8');

content = content.replace(
  `  const resolveItem = async (comment = '') => {
    if (!confirmingAction) return;

    const { item, decision } = confirmingAction;
    setSubmittingAction(true);

    try {
      if (previewMode) {`,
  `  const resolveItem = async (comment = '') => {
    if (!confirmingAction) return;

    const { item, decision } = confirmingAction;
    setSubmittingAction(true);
    const queueSnapshot = [...hitl.queue];

    try {
      if (previewMode) {`
);

fs.writeFileSync(path, content);
