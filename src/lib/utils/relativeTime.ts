const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function relativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) {
    return rtf.format(-seconds, 'second');
  }
  if (seconds < 3600) {
    return rtf.format(-Math.floor(seconds / 60), 'minute');
  }
  if (seconds < 86400) {
    return rtf.format(-Math.floor(seconds / 3600), 'hour');
  }
  return rtf.format(-Math.floor(seconds / 86400), 'day');
}
