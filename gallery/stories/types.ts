export type ArgValue = string | boolean;
export type Args = Record<string, ArgValue>;

export type Control =
  | { name: string; type: 'select'; options: readonly string[] }
  | { name: string; type: 'boolean' }
  | { name: string; type: 'text' };

export interface StoryContext {
  /** Appends a line to the gallery's event log (use it for clicks, changes, etc.). */
  log: (message: string) => void;
}

export interface Story<A extends Args = Args> {
  /** URL-safe id, used in the gallery URL hash. */
  id: string;
  title: string;
  description?: string;
  /** Controls shown in the playground, one per arg. */
  controls: Control[];
  defaults: A;
  render: (args: A, ctx: StoryContext) => HTMLElement;
  /** Static grid of notable states, rendered alongside the playground. */
  states?: { label: string; args: Partial<A> }[];
}

/** Typed helper so a story's `render` gets its own arg types; the gallery sees the loose form. */
export function defineStory<A extends Args>(story: Story<A>): Story {
  return story as unknown as Story;
}
