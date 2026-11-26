try {
  const setting = localStorage.getItem('anubis-docs-theme');
  const dark = setting ? setting === 'dark' : !matchMedia('(prefers-color-scheme: light)').matches;
  document.documentElement.classList.toggle('dark', dark);
} catch {
  document.documentElement.classList.toggle('dark', matchMedia('(prefers-color-scheme: dark)').matches);
}
const agent = navigator.userAgent;
const browser = /Firefox\//.test(agent) ? 'firefox' : /Chrome\//.test(agent) && !/Edg|OPR|Mobile|Android/.test(agent) ? 'chrome' : '';
if (browser) document.documentElement.dataset.browser = browser;

if (/Mac/.test(navigator.platform)) document.documentElement.dataset.shortcut = 'mac';

// Keep the original section link across SSX's initial router navigation.
if (location.hash) document.documentElement.dataset.initialFragment = location.hash;
