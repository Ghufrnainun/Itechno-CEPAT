---
name: Hyperlocal Trust Framework
colors:
  surface: '#e8fff0'
  surface-dim: '#c9dfd1'
  surface-bright: '#e8fff0'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#e2f9ea'
  surface-container: '#ddf3e5'
  surface-container-high: '#d7eedf'
  surface-container-highest: '#d1e8d9'
  on-surface: '#0c1f16'
  on-surface-variant: '#3e4947'
  inverse-surface: '#21342b'
  inverse-on-surface: '#dff6e7'
  outline: '#6e7977'
  outline-variant: '#bdc9c6'
  surface-tint: '#006a63'
  primary: '#005c55'
  on-primary: '#ffffff'
  primary-container: '#0f766e'
  on-primary-container: '#a3faef'
  inverse-primary: '#80d5cb'
  secondary: '#416900'
  on-secondary: '#ffffff'
  secondary-container: '#acf847'
  on-secondary-container: '#457000'
  tertiary: '#7d4200'
  on-tertiary: '#ffffff'
  tertiary-container: '#a15600'
  on-tertiary-container: '#ffe6d5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9cf2e8'
  primary-fixed-dim: '#80d5cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#00504a'
  secondary-fixed: '#acf847'
  secondary-fixed-dim: '#91db2a'
  on-secondary-fixed: '#102000'
  on-secondary-fixed-variant: '#304f00'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#e8fff0'
  on-background: '#0c1f16'
  surface-variant: '#d1e8d9'
typography:
  headline-xl:
    fontFamily: Outfit
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Outfit
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-padding: 16px
  gutter: 16px
---

## Brand & Style

The design system is built on a foundation of **Practical Minimalism**. It serves a hyperlocal marketplace where speed and reliability are paramount. The aesthetic is intentionally clean and "un-designed" to reduce cognitive load for students and local micro-taskers.

The brand personality is **composed, industrious, and transparent**. It avoids the frenetic energy of typical gig-economy apps in favor of a calm, institutional reliability. Every interface element is designed to feel like a utility—stable, predictable, and fast.

**Visual Principles:**
- **Clarity over Decoration:** No gradients, shadows, or complex glass effects. Depth is communicated through subtle tonal shifts.
- **Contextual Density:** Information-rich layouts that maintain breathability through strict alignment and consistent gutters.
- **Trust Indicators:** High-contrast labels and status indicators that provide immediate feedback on task security (Escrow) and verification.

## Colors

The palette is rooted in a "Nature-Tech" hybrid, utilizing deep teals and soft greens to evoke a sense of growth and stability.

- **Primary (Teal):** Used for all primary actions, navigation, and trust-related signals. It is the color of progress.
- **Success/Reward (Lime):** Reserved strictly for completed tasks, earnings, and positive status updates. 
- **Escrow/Pending (Amber):** Communicates temporary states, funds in holding, or high-priority deadlines.
- **Neutrals:** The background is a very pale green-tinted grey to reduce eye strain, while borders use a cool grey-green to maintain a cohesive environment.

## Typography

This design system employs a three-font strategy to differentiate between intent, narrative, and data.

- **Headings (Outfit):** A geometric sans-serif that provides a modern, approachable face for the marketplace.
- **Body (Inter):** Highly legible and neutral, used for all descriptions, task requirements, and general interface text.
- **Data (JetBrains Mono):** Used specifically for distances (e.g., "1.2 km"), price points, timestamps, and ID numbers. This creates a clear visual distinction between "what to do" and "the metrics of the task."

## Layout & Spacing

The layout follows a **4px baseline grid** to ensure mathematical consistency. 

- **Grid Model:** 12-column grid for desktop (max-width 1280px), 4-column grid for mobile.
- **Logic:** Use `16px (md)` for standard component internal padding and `24px (lg)` for vertical spacing between distinct content sections.
- **Micro-tasks List:** On mobile, use a "Full-Bleed Card" approach where cards have no horizontal margin from the screen edge, but utilize internal 16px padding for content, separated by 1px border dividers to maximize screen real estate.

## Elevation & Depth

This system avoids ambient shadows in favor of **Tonal Layering and Borders**.

- **Level 0 (Background):** `#F7FAF8` - The canvas for all content.
- **Level 1 (Surface):** `#FFFFFF` - Primary cards and containers. Defined by a 1px solid border in `#DDE7E1`.
- **Level 2 (Interaction):** `#EEF5EF` - Used for hover states or to distinguish secondary content within a white card (e.g., a task footer).
- **Focus State:** 2px solid Teal (#0F766E) with a 2px offset.

Depth is purely structural; an element is "above" another only if it is a modal or a floating action button, in which case a sharp, 4px hard shadow (non-diffused) may be used to maintain the practical aesthetic.

## Shapes

The design system uses a **Soft (0.25rem)** rounding strategy. This provides enough friendliness to feel "student-oriented" while maintaining the rigid, professional structure of a marketplace.

- **Standard Elements:** 4px radius (Buttons, Input fields).
- **Large Elements:** 8px radius (Cards, Modals).
- **Status Pills:** Fully rounded (pill-shaped) to distinguish them from interactive buttons.

## Components

### Buttons
- **Primary:** Teal (#0F766E) background with White text. Bold weight.
- **Secondary:** White background with Teal border and text.
- **Ghost:** No background/border, Teal text. Used for "Cancel" or "Back" actions.

### Task Cards
- White background, `#DDE7E1` border.
- Header contains the Task Title (Outfit) and Distance (JetBrains Mono).
- Footer contains the Price (JetBrains Mono) and the SDG 8 badge.

### Badges & Chips
- **SDG 8 Badge:** Uses a specialized Icon + "Decent Work" text in a small, muted pill.
- **Status Pills:** 
  - *Success:* Lime text on a 10% opacity Lime background.
  - *Escrow:* Amber text on a 10% opacity Amber background.

### Input Fields
- 1px border (`#DDE7E1`), White background.
- Label in Inter (Body-sm, Text-muted).
- On focus, border changes to Teal (#0F766E).

### Trust Signals
- **Verified Badge:** Small Teal checkmark next to user names.
- **Distance Indicator:** Always paired with a location pin icon in the Label-sm font (JetBrains Mono).