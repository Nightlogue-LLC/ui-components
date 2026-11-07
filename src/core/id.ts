let counter = 0;

/** Returns a document-unique id such as `nl-dialog-title-3`, for aria-labelledby and radio groups. */
export function uniqueId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}
