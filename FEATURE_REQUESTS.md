# Stratbook Feature Requests – May 2026

This document consolidates all observed UX and product improvements for Stratbook’s map-first research workspace.

---

## 1. Map Screenshot Tool with Screenshot Library

Add a dedicated screenshot capture workflow for the map, including preset sizes, a movable capture window, and a persistent screenshots library.

### 1.1 Screenshot Controls (Top‑Left UI)

- Introduce a **Screenshot** control in the top‑left of the map UI.
- When clicked, it opens a small panel to select **screenshot size presets** (e.g. 16:9, 4:3, possibly Custom later).
- After selecting a size, the system displays a **highlighted capture window** overlay on top of the map with the chosen aspect ratio.

### 1.2 Capture Window Behavior

- The capture window is **movable** (click‑and‑drag to reposition) and can optionally be resizable while maintaining the selected aspect ratio.
- The map beneath continues to behave normally (panning, zooming, etc.).
- Just above or inside the capture window, show a subtle instruction such as:  
  “Press Enter to capture”.
- When the user presses Enter:
  - A screenshot of the content inside the capture window is taken.
  - The screenshot is stored as a **static image** (no live linkage to the underlying map).
  - The image is added to the screenshot library.

### 1.3 Screenshot Library (Right‑Hand Side Panel)

- Add a new **Screenshot Library** panel on the right side of the main map UI.
- Every captured screenshot appears here with:
  - A thumbnail.
  - A timestamp.
  - Basic metadata (e.g. dimensions, format).
- Clicking an item opens a larger preview.
- Each screenshot can be downloaded in multiple formats, e.g.:
  - JPEG
  - PNG
- Future enhancements (optional, not required for v1):
  - Rename screenshot.
  - Delete screenshot.
  - Tag or annotate screenshot.

### 1.4 Static, Non‑Live Images

- Screenshots are **one‑time captures**:
  - They do not update automatically if the user later moves the map or changes layers.
- This keeps the feature simple, reliable, and optimized for exporting, sharing, and documentation.

---

## 2. Distance & Measurement Enhancements

Extend existing draw tools (lines, range rings, polygons) to show distances and add a dedicated measuring tape tool, with user control over whether metrics are displayed.

### 2.1 Distances on Drawn Lines

- When the user draws a line:
  - Display the **distance between the two endpoints** of that line.
  - Position the distance label near or at the midpoint of the line.
- Respect the map’s current unit settings (e.g. kilometers, miles).
- If multi‑segment polylines are supported later:
  - Optionally show **per‑segment distances** and **total length**.

### 2.2 Distances on Range Rings

- For each range ring:
  - Display its **radius distance** (e.g. “50 km”) inside or near the ring.
- When multiple concentric rings are present:
  - Each ring should have its own label with its specific radius.

### 2.3 Distances on Polygons

- At minimum:
  - Display a **total perimeter distance** for the polygon.
- Optionally:
  - Show **segment lengths** along each edge of the polygon, consistent with existing styles.

### 2.4 Toggle for Metrics

- Provide a **global toggle** to enable or disable all measurement labels for drawn objects:
  - When off: lines, polygons, and range rings remain visible, but their distance labels are hidden.
  - When on: all applicable labels are shown.
- Location for this toggle could be near the existing draw tools (lines, polygons, range rings) for quick access.

### 2.5 Dedicated Measuring Tape Tool

- Add a separate **Measure distance** tool in the draw tools toolbar.
- Behavior:
  - When activated, the cursor switches to a measuring mode.
  - User clicks a start point and then an end point on the map.
  - A temporary line appears with a **clear distance label**.
  - Pressing Esc or right‑clicking cancels/clears the measurement and returns to the normal cursor.
- These measurements are **ad hoc only**:
  - They are not saved as permanent objects in the workspace the way normal drawn lines are.

---

## 3. Strategist Deep Research Upgrade

Upgrade the Strategist from a local/map‑only assistant into a deep‑research AI with internet connectivity and integrations to external research tools.

### 3.1 Internet‑Connected Research Mode

- Strategist should support **live web research**, not just local project/map context.
- Core capabilities:
  - Discover and surface **relevant links** (articles, reports, datasets, maps, PDFs).
  - Summarize sources and extract key insights.
  - Relate findings back to locations, markers, lines, polygons, and notes on the map.

### 3.2 Integrations with Deep Research Services

- Add plugin‑style integrations with external deep research tools, starting with:
  - Exa AI.
  - Parallel / Parallel Deep Research.
  - Additional similar services over time.
- Strategist can route queries through these integrations as appropriate.
- Responses should clearly include **source links** originating from these tools.

### 3.3 Link‑Rich Output

- Strategist responses should contain:
  - Clickable links to key sources.
  - Optionally, grouping of links by type (e.g. official docs, think‑tank reports, news, data).
- Enable attaching specific sources to:
  - Markers.
  - Lines.
  - Polygons.
  - Notes.

### 3.4 Controls, Safety, and Workspace Settings

- Provide a per‑workspace or per‑user setting to:
  - Enable/disable internet research.
  - Toggle individual integrations (e.g. enable Exa AI, disable others).
- Clearly indicate when Strategist’s answer is based on:
  - Live web research vs.
  - Existing internal workspace data.

---

## 4. Instant Marker Creation

Improve marker creation so that placing a marker feels immediate, without any visible lag or heavy processing on the critical path.

### 4.1 Current Issue

- Creating a marker currently exhibits a noticeable delay before:
  - The marker appears.
  - It becomes fully interactive.
- This disrupts rapid exploration and annotation.

### 4.2 Desired Behavior

- As soon as the user clicks to place a marker:
  - The marker appears on the map **instantly**.
- Any secondary processes (saving to backend, generating default note content, invoking Strategist) should occur **in the background**.

### 4.3 Behavioral Implementation Direction

- Use an **optimistic UI** approach:
  - Show the marker immediately, assume success, then sync with the server.
- If background operations are still running:
  - The marker can show a subtle “syncing” or “loading” indicator.
  - Marker should still be draggable, editable, and deletable while syncing.
- Network errors or failures should be handled gracefully (e.g. small warning on the marker) without blocking initial placement.

---

## 5. In‑App Feature Request & Help Channel

Add a simple, always‑available way for users to send feedback, feature ideas, or help requests directly to the founders.

### 5.1 Entry Point

- Add a small, persistent control such as:
  - “Feedback / Help” button or icon in the main UI, e.g. bottom‑right corner or in the main top bar.
- Clicking this opens a compact panel or modal.

### 5.2 Message Form

- Core element: a **single text box** where users can:
  - Describe feature requests.
  - Report bugs.
  - Ask for help.
- Optional supporting fields:
  - Contact email (if not already known).
  - Category dropdown (Feature request / Bug / Question).

### 5.3 Direct Delivery to Founders

- When the user submits:
  - The message is sent to a channel that founders actively monitor (e.g. email inbox, Slack channel, internal admin tool).
- Automatically include helpful context:
  - User ID / email.
  - Current map/workspace name.
  - Timestamp.
  - Browser and platform information (if useful).

### 5.4 Confirmation

- After sending:
  - Show a short confirmation message indicating that the feedback has been **sent directly to the founders**.
- Optionally clarify expectations:
  - For example, that every message is read even if not all receive a direct reply.

---

## 6. Social Login Options (Google & Apple)

Add modern identity providers to streamline login and reduce friction for new and returning users.

### 6.1 New Login Options

- On the login screen, add:
  - “Continue with Google” (Google OAuth / OpenID Connect).
  - “Continue with Apple” (Sign in with Apple).
- These options appear alongside existing email/password or magic link flows, **not** as replacements.

### 6.2 Behavior

- First‑time login with Google or Apple:
  - Create a Stratbook account tied to that identity.
- Returning via the same Google/Apple identity:
  - Log the user into the existing linked account.
- Maintain standard security and UX best practices:
  - Clear error messages on failed authentication.
  - Respect Apple and Google UI guidelines for branding.

---

## 7. Faster Auth Page Load & Transitions

Improve the performance and feel of moving between login and sign‑up so it feels instant and fluid.

### 7.1 Current Issue

- Switching between:
  - “Log in”
  - “Sign up”
- Currently feels slow, as if each toggle triggers a full reload or heavy re‑render.

### 7.2 Desired Behavior

- Switching between login and sign‑up should feel:
  - Immediate.
  - Seamless.
- The UI should behave like a single auth view with two states rather than two separate heavy pages.

### 7.3 Behavioral Implementation Direction

- Treat login and sign‑up as **two states** (e.g. tabs or toggles) within a single client‑side view.
- Avoid full page reloads on toggle; update content client‑side.
- Preload or cache any configuration needed so that toggling does not trigger new network round trips.
- If background work is unavoidable:
  - Keep forms visible.
  - Use subtle, non‑blocking loading indicators rather than blank or frozen screens.

---

## 8. Precomputed Dashboard Images for Fast Initial Load

Optimize the initial dashboard experience by serving precomputed images instead of generating them on demand.

### 8.1 Current Issue

- On first dashboard load:
  - Images appear to be generated/rendered **on the fly**.
  - This leads to slow and staggered loading, degrading perceived performance.

### 8.2 Desired Behavior

- When the user first opens the dashboard:
  - All key thumbnails/previews are **already computed** and ready.
  - The dashboard feels fast, with immediate visual feedback rather than waiting for image generation.

### 8.3 Behavioral Implementation Direction

- Move image generation to **precompute steps**, e.g.:
  - When a map or board is saved or updated.
  - Via background jobs shortly after changes.
- On dashboard load:
  - The system simply fetches existing images (e.g. from a CDN or optimized storage).
  - No expensive image processing occurs on the critical path.
- Regenerate images only when underlying content changes, not on every view.

### 8.4 Outcome

- Dashboard feels **much smoother and more polished**.
- Users perceive Stratbook as fast and professionally engineered due to minimal waiting on first load.


Last but not least, in next emails that are going to go out to the customers and the change log that is going to be published, one of the major things we're going to share is the feature where the live map updates in the OG image. Whenever you share in social media or in WhatsApp groups, there is always an OG image, which is nicer for sharing.


We need the ability to have the full name of the user because otherwise it's very hard to identify who the user is. We should also have login with LinkedIn, login with Google as options.We should also hook up the tool called post-hoc to look at more detailed user interactions.