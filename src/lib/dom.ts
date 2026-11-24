/** True when the element is rendered (not inside a display:none Activity boundary). */
export function isRendered(el: Element): boolean {
  return el.getClientRects().length > 0;
}

export function visibleElements<T extends Element>(selector: string): T[] {
  return Array.from(document.querySelectorAll<T>(selector)).filter(isRendered);
}
