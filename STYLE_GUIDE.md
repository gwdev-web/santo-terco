# Santo Terço — Style Guide

Version 1.0 · The visual and editorial rules every screen follows, so the whole site keeps the same mood: **serene, clear and welcoming** for people who are starting to pray.

Implementation lives in [`src/styles/tokens.css`](src/styles/tokens.css). This document is the source of truth; when they disagree, fix the code.

---

## 1. Principles

| Principle | What it means on screen |
|---|---|
| **Serene** | Beige background instead of pure white, generous space around text, no flashy animation. The screen invites silence. |
| **Clear** | One main action per screen. The prayer text is always the most legible element; buttons and markers stay secondary. |
| **Welcoming** | Nothing is mandatory: marking prayers is optional and there is no "error". Copy guides without demanding, written for beginners. |
| **Obviously clickable** | Much of the audience is older and not used to websites. Nothing clickable is loose text (see [Affordance](#62-affordance-everything-clickable-looks-clickable)). |

---

## 2. Color

Four base colors. Derived tones exist to guarantee legibility (dark golds for text) and states (success, danger).

### 2.1 Base

| Name | Hex | Token | Use |
|---|---|---|---|
| Beige | `#F4F1EA` | `--color-beige` | Main page background. |
| Light beige | `#FAF8F5` | `--color-beige-light` | Headers, sticky bars and reading pages. |
| White | `#FFFFFF` | `--color-white` | Cards, dialogs and fields. |
| Navy | `#1C2B4B` | `--color-navy` | Main text, strong secondary button, highlight blocks. |
| Gold | `#C29B62` | `--color-gold` | Primary button, beads, icons and details. **Never text.** |
| Bright gold | `#D4AF37` | `--color-gold-bright` | Button hover and details on navy. |

### 2.2 Derived and states

| Name | Hex | Token | Use |
|---|---|---|---|
| Gold heading | `#9C7638` | `--color-gold-heading` | Gold headings **24px and up only**; icons on light backgrounds. |
| Gold text | `#7D5D28` | `--color-gold-text` | Small gold labels and text. |
| Soft gold | `#F2E6CB` | `--color-gold-soft` | "Do dia" badge, completed step chips. |
| Cream | `#F7F0E1` | `--color-cream` | Icon chips, hover on outline buttons. |
| Navy hover | `#2A3D66` | `--color-navy-hover` | Hover of navy buttons. |
| Navy 2 | `#26375C` | `--color-navy-2` | Surfaces on navy backgrounds. |
| Text | `#3A4660` | `--color-text` | Body text. |
| Muted text | `#5B6478` | `--color-text-muted` | Supporting text, captions. |
| Border | `#E6DFD0` | `--color-border` | Card and divider borders. |
| Damask | `#E0D5BE` | `--color-damask` | Damask ornament stroke. |
| Success | `#2F6B4A` / bg `#E7F1EA` | `--color-success(-bg)` | "Rezado" states. |
| Danger | `#9B2C2C` / bg `#FBEFEF` | `--color-danger(-bg)` | Destructive actions. |

On navy backgrounds, use light beige `#FAF8F5` for text, `#D9D4C7` for muted text and `#E7CB86` (light gold) or bright gold for highlights.

### 2.3 Proportion

**Beige 60% · White 20% · Navy 12% · Gold 8%.** Gold is seasoning: primary button, icons, rosary beads and details. Never in large background blocks.

### 2.4 Contrast (WCAG)

Approved pairs: 4.5:1 for normal text, 3:1 for text 24px and up.

| Text / background | Ratio | Status | Use |
|---|---|---|---|
| `#1C2B4B` / `#F4F1EA` | 12.4:1 | AAA | Main text |
| `#1C2B4B` / `#FFFFFF` | 14:1 | AAA | Text on cards |
| `#1C2B4B` / `#C29B62` | 5.4:1 | AA | Text on gold button |
| `#7D5D28` / `#FFFFFF` | 6.1:1 | AA | Small gold labels |
| `#5B6478` / `#FFFFFF` | 5.9:1 | AA | Supporting text |
| `#D4AF37` / `#1C2B4B` | 6.7:1 | AA | Highlights on navy |
| `#9C7638` / `#F4F1EA` | 3.7:1 | 24px+ only | Large gold headings |
| `#FFFFFF` / `#C29B62` | 2.6:1 | **Fail** | Never white on gold |
| `#C29B62` / `#F4F1EA` | 2.3:1 | **Fail** | Decoration only, never text |

---

## 3. Typography

| Family | Role | Weights |
|---|---|---|
| **Playfair Display** | Headings, prayer text, quotes. Classic and liturgical; invites slow reading. | 500, 600, 700; italic 500 for quotes and highlights |
| **Lato** | Interface: buttons, labels, navigation, explanations, UI numbers. Humanist and legible on small screens. | 400, 700 |

Tokens: `--font-heading`, `--font-body`.

### 3.1 Scale

Desktop sizes; mobile shrinks headings by about 35% and keeps prayer text at 17px. Implemented as fluid `clamp()` tokens.

| Style | Spec (desktop) | Mobile | Token | Example |
|---|---|---|---|---|
| Display | Playfair 700 · 64/1.05 · gold heading | 40 | `--text-display` | Terço do Dia |
| H1 | Playfair 700 · 52/1.1 | 32 | `--text-h1` | Orações iniciais |
| H2 | Playfair 600 · 34/1.25 | 22 | `--text-h2` | Hoje contemplamos os Mistérios Luminosos |
| H3 | Playfair 600 · 24/1.3 | 20 | `--text-h3` | Pai Nosso |
| Quote | Playfair 500 italic · 28/1.45 | 22 | `--text-quote` | “Fazei tudo o que ele vos disser.” |
| Prayer | Playfair 400 · 20/1.7 | 17 | `--text-prayer` | Ave Maria, cheia de graça… |
| Eyebrow | Lato 700 · 14 · uppercase · .16em · gold text | 12–14 | `--text-eyebrow` | ETAPA 1 DE 7 |
| Body large | Lato 400 · 18/1.6 | 18 | `--text-body-lg` | Cada oração aparece no momento certo. |
| Body | Lato 400 · 16/1.6 | 16 | `--text-body` | Reze com calma. |
| Button | Lato 700 · 16–17 | 16–17 | `--text-button` | Começar o terço |
| Caption | Lato 400 · 13–14 · muted | 13 | `--text-caption` | Reze os 4 terços no mesmo dia… |

Prayer pages offer a **text size control** (three steps, "A A A") so readers can enlarge prayer text.

---

## 4. Space and shape

### 4.1 Spacing (4px base)

`--space-1` 4 · `--space-2` 8 · `--space-3` 12 · `--space-4` 16 · `--space-6` 24 · `--space-8` 32 · `--space-12` 48 · `--space-16` 64.

### 4.2 Radii

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 12px | Icon chips, segments |
| `--radius-md` | 16px | Mobile buttons, fields |
| `--radius-lg` | 22px | Cards |
| `--radius-xl` | 28px | Hero, large blocks |
| `--radius-pill` | 999px | Pill buttons, badges, beads |

### 4.3 Shadows

| Token | Value |
|---|---|
| `--shadow-sm` | `0 6px 18px rgba(28,43,75,.05)` |
| `--shadow-md` | `0 8px 24px rgba(28,43,75,.08)` |
| `--shadow-lg` | `0 24px 60px rgba(28,43,75,.10)` |
| `--shadow-gold` | `0 10px 24px rgba(156,118,56,.28)` |

### 4.4 Layout

- **Reading width:** running text up to 720px; pages up to 1200px; side gutter at least 16px.
- **Touch targets:** everything clickable is at least 44×44px. Primary buttons on mobile are 52px tall. Rosary beads are 52–56px.
- **Breakpoints:** mobile ≤ 640px · tablet ≤ 1024px · desktop > 1024px · large ≥ 1440px. Grids use `auto-fit` instead of fixed columns.

---

## 5. Brand

### 5.1 Logo

- **Emblem:** Our Lady in prayer (eyes closed, hands joined), drawn in a fine line, inside a navy circle wrapped by a gold rosary whose beads meet at the hanging cross. A gold halo with rays and stars.
  - *Our Lady in prayer:* the gesture of someone praying the rosary with her.
  - *Halo and stars:* light and holiness; Mary, Morning Star.
  - *Circle and rosary:* the circle is unending prayer; the beads wrap it and meet at the cross, where the rosary begins.
- **Wordmark:** "Santo ✦ Terço" in Playfair Display 500, **small caps**, letter-spacing .04em, with a gold four-point star between the words (star size .42em, gap .26em).
- **Colors:** line in navy `#1C2B4B`, beads and details in gold `#C29B62`.

### 5.2 Versions

| Version | Where |
|---|---|
| Horizontal (emblem + wordmark) | Site header and light backgrounds. Desktop: emblem 43×55, name 29px. Mobile: 33×42, name 24px. |
| On navy | Lines in light beige, beads and star in bright gold. |
| Full logo (emblem + name + "Terço diário guiado") | Splash, Open Graph image, print. |
| Emblem only | App icon, large illustrations, print. |
| Favicon (16–32px) | Only a gold "M" (`#E7CB86`) on navy, rounded square. |

### 5.3 Rules

- Emblem minimum height: **48px** (below that, Mary's face stops being legible); use the favicon "M" instead.
- Clear space around the logo: **half the emblem width**.
- The final logo files must be vector (SVG).

### 5.4 Ornaments

- **Damask:** subtle pattern only at the top of heroes, fading out with a mask. Stroke `#E0D5BE` on light, `#2A3D66` on navy.
- **Four-point star (✦):** separator in the wordmark, streak indicator and celebration sparkles.

---

## 6. Components

### 6.1 Buttons and links

| Variant | Class | Use |
|---|---|---|
| Primary (gold) | `.button--primary` | The main action, **once per screen**. Navy text on gold, gold shadow; hover bright gold. |
| Strong secondary (navy) | `.button--secondary` | Alternative to gold. Light text on navy; hover navy hover. |
| Outline | `.button--outline` | Action already done ("Rezar novamente") or second choice. Gold 1.5px border. |
| On navy | `.button--on-navy` | Secondary actions on navy blocks. |
| Danger | `.button--danger` | Destructive ("Limpar meus dados"). **Always asks for confirmation.** |
| Link | `.link` | Text link, always **underlined in gold**. |

Sizes: `--small`, default, `--large`; `--full` for full width (mobile). Shape: pill on desktop, 16px radius on mobile. Buttons start with a clear verb ("Rezei", "Ir para o 1º mistério") and directional actions end with an arrow.

### 6.2 Affordance: everything clickable looks clickable

- Buttons are always filled or have a gold border.
- Text links are always underlined in gold.
- Clickable cards have a border and an arrow, and **lift on hover**.
- The **next step breathes slowly** (`next-pulse`) so the user always knows where to go.

### 6.3 Guided rosary

- **Prayer step card:** number, title (Playfair 24px), optional hint (e.g. "Abre a dezena · 1 vez") and the prayer text in a light-beige box with a 4px gold left border (Playfair 20/1.75; 18/1.7 on mobile).
  - States: *current* (gold border + soft gold shadow), *done* (soft green border `#BFD9C8`), *upcoming* (neutral border).
  - One "Rezei" button per step lights up the next step. Marking is optional.
- **Mark toggle:** pill with label on desktop, 44px circle with check on mobile. Uses `aria-pressed`.
- **Decade beads:** 10 beads, 52–56px, all clickable. *Gold* = prayed · *dashed and pulsing* = next · *white* = remaining. Tapping the last gold bead unmarks it. Desktop: row/grid; mobile: a ring of beads around a navy center button ("+ Rezei uma"). The opening has 3 larger beads for the three Hail Marys.
- **Steps:** Início · 1º–5º · Final. Done (soft gold + ✓) · current (navy) · upcoming (white). On mobile it becomes a segmented bar.
- **Daily trail ("Sua caminhada de hoje"):** row of medals for the day's steps plus the streak ("3 dias seguidos ✦"). A completed step turns its medal gold.
- **Medals:** small circular badges with an illustration; earned for finishing the opening, each mystery, a terço, a full Rosary and streaks.

### 6.4 Other components

- **Badges:** "Do dia" (soft gold, uppercase), "Rezado hoje" (success with check), "Exemplo" (dashed border), mystery chip ("1º Batismo no Jordão").
- **Mystery card:** set illustration in a cream chip, name, days, the 5 mysteries each with its own illustration and ordinal, and the action ("Rezar este terço" / "Rezar novamente").
- **Week strip:** the seven days with each day's set illustration; today highlighted in navy (desktop) or gold (mobile).
- **Rosary progress:** 4 segments or a ring, "1 de 4 terços".
- **Litany:** invocation (left, navy) and response (right or below, gold text), "Mostrar a ladainha inteira".
- **Text size control:** three "A" buttons with `aria-pressed`.
- **Inline confirmation:** destructive actions show "Apagar todo o histórico?" with Cancel / Confirm in place, no browser dialogs.

---

## 7. Iconography

### 7.1 Interface icons: Phosphor

Menu, arrows, buttons and notices use [Phosphor Icons](https://phosphoricons.com/) (MIT): **Light** in the menu (24px) and for info cards, **Regular** in buttons and notices (18–22px), **Fill** only for the "play" triangle. Navy `#1C2B4B` on light; cream or bright gold `#D4AF37` on navy; the current menu item in dark gold. Served from the `public/icons.svg` sprite (no icon font, 22 icons + the brand star).

- **An icon always comes with a visible label.** Never an icon on its own: older users need the word.
- Phosphor only for the interface; illustrations only for mysteries and prayers. Never mix the roles.
- Never another icon family (Lucide, Tabler, Font Awesome…) and never emoji.

| Icon | Weight | Use |
|---|---|---|
| `church`, `cross`, `hands-praying`, `calendar-check` | Light | Menu: Início, Mistérios, Orações, Histórico |
| `play` | Fill | Começar o terço |
| `arrow-right`, `arrow-left` | Regular | Next / previous |
| `caret-left`, `caret-right`, `caret-down`, `arrow-down` | Regular | Back (mobile), open item, expand, go to section |
| `x`, `check`, `plus` | Regular | Leave the rosary, prayed, "Rezei uma Ave Maria" |
| `arrows-clockwise`, `hand-pointing` | Regular | Replay the animation, "tap here" hint |
| `calendar-blank`, `copy`, `trash` | Regular | Today's date, copy text, clear data |
| `info`, `lock-simple`, `code` | Light | Tip, data privacy, project code |

| Menu | Icon | Meaning |
|---|---|---|
| Início | Church | Where we set out to pray. |
| Mistérios | Cross | The center of every mystery. |
| Orações | Praying hands | Every prayer, full text. |
| Histórico | Calendar check | The days you prayed. |

### 7.2 Rosary illustrations (38, custom)

Hand-drawn fine-line illustrations (single-path SVGs in `src/assets/illustrations/`), used as a mask so the color comes from `currentColor`. Minimum **32px** (mysteries **40px**). Always shown with its name written nearby (title, caption or the button's label); decorative ones get `aria-hidden="true"`.

| Combination | Use |
|---|---|
| Navy on beige | Default |
| Dark gold on white | Highlights in cards |
| Navy on a light medal over navy | Trail and celebrations |
| Gold on navy | Simple drawings only |

- **Mystery sets (4):** `gozosos` (Annunciation angel), `dolorosos` (crown of thorns), `gloriosos` (risen Christ with the banner), `luminosos` (Holy Spirit dove).
- **Each mystery (20):** `m-anunciacao`, `m-visitacao`, `m-nascimento`, `m-apresentacao`, `m-perda-encontro`, `m-agonia`, `m-flagelacao`, `m-coroacao-espinhos`, `m-carregamento-cruz`, `m-crucifixao`, `m-ressurreicao`, `m-ascensao`, `m-pentecostes`, `m-assuncao`, `m-coroacao`, `m-batismo`, `m-bodas-cana`, `m-anuncio-reino`, `m-transfiguracao`, `m-eucaristia`.
- **Prayers and others (14):** `oracao` (Sign of the Cross), `oferecimento`, `creio`, `pai-nosso`, `ave-maria`, `gloria`, `dezenas` (O my Jesus), `terco` (thanksgiving, full Rosary), `salve-rainha`, `dolorosos-coracao` (Act of Contrition), `gloriosos-coroa` (medals), `ladainha-nossa-senhora`, `ladainha-sagrado-coracao`, `ladainha-todos-santos`.

```html
<span class="illustration illustration--lg illustration--gozosos" aria-hidden="true"></span>
```

Sizes: `--sm` 32px, `--md` 44px, `--lg` 56px, `--xl` 72px (or set `--illustration-size`).

---

## 8. Motion

- **Short and soft:** 150–450ms for taps and state changes, 700ms for progress bars.
- **Curve:** `cubic-bezier(.3, .7, .4, 1)`.
- **Patterns:** entrance fade-up with stagger; hover lift on cards; press scale(.95–.98); bead fill; next step breathing (1.8s, ease-in-out, infinite); progress fill; accordion open.
- **Celebration** (end of a terço and full Rosary): the ring draws, medals pop in one by one, a rotating ray halo, sparkles, ripples and falling gold beads/confetti. A "Ver de novo" button is always present.
- **Reduced motion:** with `prefers-reduced-motion`, everything becomes an instant change without losing information (no entrance animations, no loops).

---

## 9. Voice and tone

Speak like someone praying beside the user: close, simple, unhurried and never demanding. Address the user as "você".

| Do | Avoid |
|---|---|
| Reze com calma. Marcar é opcional. | Você precisa marcar todas as orações. |
| Hoje contemplamos os Mistérios Luminosos. | Mistério obrigatório de quinta-feira. |
| Que a paz de Cristo fique com você. | PARABÉNS!!! Missão cumprida!!! |
| Ou escolha outro mistério | Clique aqui para mudar a configuração |
| Apagar todo o histórico? Não dá para desfazer. | Erro: ação irreversível detectada. |

### Writing conventions

- Prayer texts are always complete, in the traditional version used in Brazil.
- Ordinals with "º"/"ª": 1º Mistério, 2ª Ave Maria.
- Mystery names capitalized: Mistérios Gozosos, Dolorosos, Gloriosos e Luminosos.
- Bible references in the "Lc 22,39-46" format.

---

## 10. Accessibility checklist

- Text contrast at least 4.5:1 (3:1 from 24px).
- Touch targets at least 44×44px.
- Buttons are `<button>`, links are `<a>`; nothing clickable on a `<div>`.
- Icon-only buttons have `aria-label`.
- Prayer marking uses `aria-pressed`; the current step uses `aria-current`.
- The Hail Mary counter is announced with `aria-live="polite"`.
- Decorative icons and illustrations have `aria-hidden="true"`.
- Respect `prefers-reduced-motion`: no entrance animations.
