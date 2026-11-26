import { html } from '@inglorious/web';
import { render as commit, type RenderRootNode, type TemplateResult } from 'lit-html';

export { html, type TemplateResult };
const managed = new WeakSet<RenderRootNode>();

export function render(view: TemplateResult, target: RenderRootNode, before?: ChildNode): void {
  if (before) {
    commit(view, target, { renderBefore: before });
    return;
  }
  // Some controls come from the entrypoint HTML or are created with their
  // initial contents. Give the first template ownership of that region.
  if (!managed.has(target)) {
    target.replaceChildren();
    managed.add(target);
  }
  commit(view, target);
}

/** Commit a view that includes native controls or SVG nodes owned by the browser UI. */
export function renderNodes(target: RenderRootNode, children: unknown, before?: ChildNode): void {
  render(html`${children}`, target, before);
}
