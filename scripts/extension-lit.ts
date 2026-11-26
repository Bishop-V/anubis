// Lit passes only template literals with its internal markers here. Bound values
// are committed separately after cloning. Parse those literals in an inert HTML
// document so the extension bundle doesn't need an innerHTML assignment.
const inertTemplate = (template: string, policy: string) => `
  const markup = "<template>" + ${template} + "</template>";
  return new DOMParser()
    .parseFromString(${policy} ? ${policy}.createHTML(markup) : markup, "text/html")
    .querySelector("template");
`;

export function extensionLit() {
  return {
    name: 'anubis-inert-lit-templates',
    enforce: 'pre' as const,
    transform(source: string, id: string) {
      if (!/[/\\]lit-html[/\\](?:development[/\\])?lit-html\.js$/.test(id)) return;
      // These are the production and development builds of the pinned Lit release.
      const browserTemplate = 'const s=l.createElement("template");return s.innerHTML=t,s';
      const developmentTemplate = "const el = d.createElement('template');\n        el.innerHTML = html;\n        return el;";
      if (source.includes(browserTemplate)) return source.replace(browserTemplate, inertTemplate('t', 'e'));
      if (source.includes(developmentTemplate)) return source.replace(developmentTemplate, inertTemplate('html', 'policy'));
      throw new Error('Review the Lit template parser before upgrading lit-html.');
    },
  };
}
