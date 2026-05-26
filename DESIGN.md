# Design System Specification: Clinical Etherealism

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Clinical Sanctuary."** 

In the high-stakes world of healthcare AI, we move away from the cluttered, anxiety-inducing interfaces of the past toward a space of radical clarity and digital "breathability." This system is not a template; it is an editorial experience. By utilizing high-contrast typographic scales and intentional asymmetry, we guide the clinician’s eye through complex data with the grace of a premium lifestyle publication. 

We break the "grid-box" monotony by overlapping translucent layers and using excessive whitespace as a functional tool rather than a luxury. This approach transforms a diagnostic tool into a professional companion that feels intelligent, calm, and hyper-modern.

---

## 2. Colors & Tonal Architecture
The palette is rooted in medical purity (whites and light blues) but elevated through sophisticated Material Design logic and Apple-inspired translucency.

### The "No-Line" Rule
**Explicit Instruction:** Traditional 1px solid borders are strictly prohibited for sectioning. Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` component should sit on a `surface` background to create a "soft edge."

### Surface Hierarchy & Nesting
Treat the UI as physical layers of frosted glass.
*   **Base:** `surface` (#fcf8fb)
*   **Low Depth:** `surface-container-low` (#f6f3f5)
*   **High Priority:** `surface-container-highest` (#e4e2e4)
*   **The "Glass" Layer:** For floating modals or navigation, use `surface-container-lowest` (#ffffff) at 70% opacity with a `backdrop-filter: blur(20px)`.

### The "Glass & Gradient" Rule
To inject "soul" into the clinical environment, use the **Signature Gradient** (`primary-container` #60a5fa to `secondary` #8127cf) for high-impact areas like health-score visualizations, primary CTAs, and hero backgrounds. This prevents the interface from feeling "flat" or sterile.

---

## 3. Typography
We utilize a highly curated hierarchy to ensure clinical data is never overwhelming.

*   **Display (SF Pro Display / Inter):** Used for large, impactful metrics or welcome states. These are set with tight letter-spacing (-0.02em) to feel authoritative.
*   **Headlines & Titles:** Used to categorize patient data. These serve as the "anchors" of the page.
*   **Body (SF Pro Text / Inter):** Optimized for long-form diagnostic notes. 
*   **Label (Inter):** Used for micro-data and metadata, often in `on-surface-variant` to de-emphasize secondary information.

**Hierarchy Goal:** A 3.5rem `display-lg` headline should coexist with a 0.75rem `label-md` caption to create a "high-end editorial" contrast that defines importance at a glance.

---

## 4. Elevation & Depth
Depth in this system is achieved through light and physics, not lines.

*   **Tonal Layering:** Avoid shadows for most cards. Instead, place a `surface-container-lowest` card (Pure White) on a `surface-container` (#f0edef) background. The subtle shift in hex code provides enough "lift."
*   **Ambient Shadows:** When an element must float (e.g., a critical alert), use a shadow: `box-shadow: 0 20px 40px rgba(27, 27, 29, 0.05)`. The shadow color is a tinted version of `on-surface`, never pure black.
*   **The Ghost Border:** If accessibility requires a border, use `outline-variant` at 15% opacity.
*   **Roundedness Scale:**
    *   **Cards/Modals:** `xl` (3rem) or `lg` (2rem).
    *   **Buttons/Inputs:** `md` (1.5rem).
    *   **Status Tags:** `full` (9999px).

---

## 5. Components

### Floating Input Fields
Inputs do not have borders. They use `surface-container-high` as a background with a `xl` corner radius. Upon focus, the background transitions to `surface-container-lowest` with a subtle `primary` ambient shadow.

### Buttons
*   **Primary:** Uses the Signature Gradient (#60A5FA to #A855F7) with `on-primary` text. No border.
*   **Secondary:** `surface-container-highest` background with `primary` text.
*   **Glass Action:** Semi-transparent `surface-container-lowest` with a heavy backdrop blur for floating icon buttons.

### Medical Data Cards
**Constraint:** Forbid the use of divider lines. Use `1.5rem` (spacing-md) of vertical whitespace to separate patient vitals. Use `surface-container-low` to group related metrics.

### Pulse Indicator (Custom Component)
A small, glowing orb using the `tertiary` (#006686) token with an outer `tertiary-container` glow to indicate "AI Thinking" or "Live Monitoring" states.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use extreme whitespace. If it feels like too much, add 10% more.
*   **Do** use asymmetrical layouts (e.g., a wide 8-column diagnostic panel paired with a narrow 4-column sidebar).
*   **Do** use `on-surface-variant` for secondary labels to create depth through color, not just size.
*   **Do** apply `backdrop-filter: blur` to all overlays to maintain the "frosted glass" aesthetic.

### Don’t
*   **Don't** use 1px solid borders or `#000000` shadows. It breaks the "Ethereal" illusion.
*   **Don't** use sharp corners. Everything must feel organic and "held" by the user.
*   **Don't** use standard "Success Green" or "Error Red" at 100% saturation. Use the `error_container` and `tertiary_container` tokens to keep the palette soft and integrated.
*   **Don't** crowd the screen. If a view has more than 7 primary elements, use nesting and layers to hide secondary information.