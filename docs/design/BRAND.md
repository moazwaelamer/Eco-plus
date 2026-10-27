# EcoPlus brand identity

Status: first version, built in code (`apps/frontend`) and written down here. Tokens for reuse by the dashboard and the website:
[packages/brand/tokens.json](../../packages/brand/tokens.json). Visual board: [brand/brand-board.html](brand/brand-board.html) (open in a browser).

## Name

**EcoPlus** (Arabic: **إيكو بلس**). Kept: short, easy in both scripts, says what it is. The "Plus" carries the idea that sorting gives you
something back: points, impact, a cleaner street. Always written EcoPlus (one word, capital E and P). In Arabic text write إيكو بلس.

Tagline: **اجمع، وزّن، واكسب نقاط** / *Collect, weigh, earn points*.

## Logo

A leaf-shaped tile (two large opposite corners, two small ones) with a plus cut into it. The leaf is nature, the plus is the reward.
File: [brand/logo.svg](brand/logo.svg); drawn in Flutter by `LogoMark` in `lib/widgets/brand.dart`.

- Mark colour: Bloom lime on any dark or green surface. On light paper, put the mark on a canopy-green tile.
- Wordmark: "Eco" in the text colour and "Plus" in Bloom (on dark) or Canopy (on light).
- Clear space: half the mark's width on every side. Minimum size: 24 px.
- Do not rotate, recolour the leaf, add shadows or put it on busy photos.

## Colour

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| Paper (bg) | `#F5F2EA` | `#07110C` | Page background. Warm, never pure white or black |
| Surface | `#FFFFFF` | `#0F1D16` | Cards, sheets, inputs |
| Surface alt | `#ECE7DA` | `#17291F` | Skeletons, quiet fills |
| Line | `#DFD9C9` | `#223529` | Borders, dividers |
| Ink | `#0D1B14` | `#EAF3EC` | Text |
| Ink soft | `#566660` | `#8FA598` | Secondary text |
| Canopy (primary) | `#0B3D2E` | `#6FE0A6` mint | Buttons, links, icons |
| Bloom (accent) | `#C8F560` | `#C8F560` | The one main action per screen, badges, highlights |
| Copper (warning) | `#A35A0C` | `#F0B04A` | Waiting states |
| Danger | `#C23B33` | `#FF8A80` | Errors, rejected |
| Canopy gradient | `#0E4A37` to `#06261C`, glow `#1E8A62`, text `#EAF6EE` | same | Hero panels, always light text |

Rules: Bloom is rare, one use per screen. Hero panels are canopy green in both themes. Status is never colour alone: always an icon and a label.

Contrast (WCAG ratio): ink on paper 15.9, ink soft on paper 5.4, white on canopy 12.2, ink on Bloom 14.1, canopy-text on canopy 9.2,
dark mode ink 16.9, dark ink soft 7.3, mint on dark 11.8, copper on paper 4.7, danger on paper 4.7. Everything used for text is above 4.5.

## Typography

**IBM Plex Sans Arabic** (SIL Open Font License), weights 400, 500, 600, 700, bundled in the app (`assets/fonts`). One family covers Arabic
and Latin, so mixed text and numbers sit on the same baseline. Chosen over Cairo for a more refined, confident look; tabular figures are
used for points, weights and codes.

| Style | Size / weight | Use |
| --- | --- | --- |
| Display | 34 to 56, 700, tight | Points, big numbers |
| Headline | 22 to 30, 700 | Screen titles |
| Title | 16 to 20, 600 to 700 | Card titles |
| Body | 14 to 16, 400 | Text |
| Label | 11 to 14, 600 | Chips, buttons |

Arabic first: layouts are written right to left, English mirrors them. Phone numbers and plates are always left to right.

## Shape and depth

Cards 22 px radius, controls 16 px, chips and badges fully round. Depth is a soft shadow (4 percent ink) plus a 1 px line; no heavy shadows.

## Motion

Premium means calm, not busy. Everything eases out (`easeOutCubic`); only celebrations bounce.

| Moment | Motion |
| --- | --- |
| Screen enter | Fade, 360 ms; screens opened on top also rise 6 percent |
| Content enter | Staggered fade and rise, 70 ms between items |
| Logo | Pops in with a spring, then one shimmer |
| Hero panel | Slow moving light (14 s loop), off when the phone asks for reduced motion |
| Points | Number counts up in 1.3 s; progress ring fills in 1.1 s |
| Buttons and cards | Scale to 97 percent on press with a light haptic |
| Loading | Shimmer skeletons, no spinners except on buttons |
| Success | Check pops with a spring and a ring expands once |

Tokens in code: `Motion` in `lib/app/theme.dart`.

## Voice

Warm, short, specific. Say what happened and what to do next ("Your bag rides along", not "Request processed"). Arabic uses simple Modern
Standard with Egyptian-friendly wording; never blame the user in errors.

## Where it applies

| Surface | State |
| --- | --- |
| Mobile app (Flutter) | Built: login, register, citizen, driver |
| Admin and factory dashboard (Flutter Web) | Not started; reuse the same tokens and widgets |
| Website | Not started; landing page with the hero panel, how it works in 4 steps, impact numbers, download buttons |
| Store assets, app icon, splash | Not made; icon is the mark on a canopy tile |

## Open decisions

Logo review with a designer, an Arabic wordmark, illustration style, photography direction, final store icon.
