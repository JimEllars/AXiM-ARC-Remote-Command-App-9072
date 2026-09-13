export function triggerHaptic(type) {
  if (!navigator.vibrate) return;

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(15);
        break;
      case 'warning':
        navigator.vibrate([30, 50, 30]);
        break;
      case 'danger':
        navigator.vibrate([100, 50, 150]);
        break;
      default:
        break;
    }
  } catch (e) {
    // Silent fallback if haptics are not supported or throw errors
  }
}
