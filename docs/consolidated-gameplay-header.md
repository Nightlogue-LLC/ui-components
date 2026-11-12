# Consolidated gameplay menu header

`createGameplayMenuHeader` promotes the Back/title/menu composition from the
approved `V4 / Sheets / GameMenu` fixture into the supported project API. The
GameMenu and Difficulty stories now use that same exported renderer. The original
three-line TarotGameplayHeader stays available for existing consumers.

```ts
const header = createGameplayMenuHeader({
  title: 'Trees & Tents',
  onBack: () => returnToCollection(),
});
const menu = createGameMenuSheet({
  trigger: header.menuTrigger,
  content: realAppMenu,
  presentation: 'popover',
});
```

The return value supplies `element`, `backButton`, `menuTrigger`, `title` and
`heading` references. The consumer owns title/state updates, routes, menu content
and any real status inserted into the heading area. The component does not invent
music, settings, difficulty, hints or puzzle state. `backLabel` can replace the
default Return Home label. Existing icon buttons and the menu controller retain
their focus, Back/history, dots-to-close and accessibility behavior.

Project CSS supplies the accepted heading typography, centered title and shared
44px controls. Top padding respects both browser and Capacitor safe-area values
without adding them together. Import the existing project stylesheet; no new CSS
entry point is needed. The public package-consumer smoke test exercises this API.
