export interface EditorialCalloutOptions {
  title: string;
  description: string;
}

/** A compact, asymmetric information panel. No app-specific copy or font is required. */
export function createEditorialCallout(options: EditorialCalloutOptions): HTMLElement {
  const panel = document.createElement('aside');
  panel.className = 'nl-editorial-callout';
  const heading = document.createElement('h3');
  heading.className = 'nl-editorial-callout__title';
  heading.textContent = options.title;
  const description = document.createElement('p');
  description.className = 'nl-editorial-callout__description';
  description.textContent = options.description;
  panel.append(heading, description);
  return panel;
}
