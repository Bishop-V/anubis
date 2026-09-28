import { blockedSites, normalizeDomain } from '@/utils/blocklist';

// The popup is the little window that opens when you click the toolbar icon.
// It's a normal web page, but it can use extension APIs (like storage).

const form = document.querySelector<HTMLFormElement>('#add-form')!;
const input = document.querySelector<HTMLInputElement>('#domain')!;
const list = document.querySelector<HTMLUListElement>('#list')!;

async function render() {
  const sites = await blockedSites.getValue();
  list.replaceChildren(
    ...sites.map((site) => {
      const li = document.createElement('li');
      li.textContent = site;
      const remove = document.createElement('button');
      remove.textContent = '✕';
      remove.title = `Unblock ${site}`;
      remove.onclick = async () => {
        await blockedSites.setValue(sites.filter((s) => s !== site));
        render();
      };
      li.append(remove);
      return li;
    }),
  );
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const domain = normalizeDomain(input.value);
  if (!domain) return;
  const sites = await blockedSites.getValue();
  if (!sites.includes(domain)) await blockedSites.setValue([...sites, domain]);
  input.value = '';
  render();
});

render();
