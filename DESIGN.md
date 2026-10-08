# Good Boy Atelier: design rationale

A speculative portfolio concept: a studio that sculpts your dog into keepsakes (**a keychain to carry, a sculpture for home, or an urn**), **commissioned while the dog is still alive**.

**Governing rule: the name smiles, the interface doesn't joke.** The brand is affectionate. The product is used during anticipatory grief, so the controls are plain, the language is direct, and nothing is rushed.

## Who it's for

**Primary segment: owners planning ahead.** Their dog is senior or terminally ill, and the vet has given them weeks or months.

| | |
|---|---|
| Known | 71M US households own a dog (APPA 2026). About 75% of pets are cremated rather than buried, which is why the urn is one of the three pieces. Vet care is the biggest share of dog-owner spending. |
| Likely | Owners of senior or ill dogs have time to capture a likeness and commission without pressure. Vets are the natural referral channel. |
| Unknown | Whether planning ahead feels caring or morbid. Willingness to pay. Whether phone photos give a convincing likeness. |

Proto-persona: **Linda, 61.** Her 13-year-old Lab, Bo, has kidney failure. She is afraid it won't look like *him*, and that she'll find out too late to fix it.

## Decision records

**1. Keepsakes, chosen as objects: a keychain, a sculpture or an urn.**
The service makes memorabilia, not grave markers. The first real question is *"What would you like to keep of Maple?"*, answered with three cards that each show the actual form: a keychain (about 4 cm, the head on a keyring), a sculpture (about 25 cm, head and chest) or an urn (the likeness on a sealed vessel with a name plaque). People choose objects, not locations, so this matches their mental model. Each piece offers only the materials that suit it: the keychain is carried every day, so it comes in sterling silver or bronze only. If switching pieces makes the current material invalid, it changes automatically and a toast explains why. Only the urn asks for the dog's weight (progressive disclosure), because the ash chamber is sized at about 1 cubic inch per pound. "Not sure" is allowed: it's priced as large and confirmed before casting. Principles: mental models, progressive disclosure, error prevention.

**1b. Delivery is a choice, and the default depends on the piece.**
A keychain is wanted *now*, to carry while the dog is still here, so it defaults to "Send it to me". An urn defaults to "Keep it safe until I ask". The owner can change either at review or later in settings. Principles: user control, smart defaults.

**2. The likeness is approved twice, and the second approval is harder.**
A wrong likeness discovered after casting is the worst failure this product can have, and it can't be undone. Digital likeness: approve, or "Something isn't right". Clay maquette: approval stays disabled until all three angles have been viewed, and the confirmation states plainly that the shape becomes fixed and the deposit stops being refundable. This is **necessary friction**, placed only at the irreversible step. Principles: error prevention, friction, user control.

**3. Compare against the owner's own photo, with their notes on screen.**
The review screen pairs "your photo" with the sculpture at the same angle and shows the owner's notes ("tilts his head when you say walk"). The user shouldn't have to remember what they told us. Change requests use feature chips plus free text, and the next version shows "changed since your last look". Principles: cognitive load, recognition over recall.

**4. Revision rounds are visible before they're spent.**
"This uses 1 of your 2 included rounds. 1 will be left." After that, the extra cost is stated before sending. No surprises at the end. Principles: trust, transparency.

**5. Photos are taken one at a time.**
Step 4 is a guided capture, not a grid of six slots. A single card asks for one angle ("Face, straight on"), with a dashed pose guide showing that angle, one tip and one primary button: **Take photo** (opens the rear camera on phones), with "or choose one you already have" as a quiet link. The other five wait in a filmstrip of small thumbnails above, which is the progress indicator and the way back to any photo. Six simultaneous demands become one.
- **Result handling:** each photo is checked on the device (size, exposure, blur) under a visible 0.7s scan. A good photo shows "Good to use", then moves on to the next missing angle by itself. A problem keeps you there, with **Retake** as the primary and "Use it anyway" as the secondary (a warning never blocks), and marks the thumbnail with an amber "!".
- **Optional and skipped photos:** the three needed photos come first. Optional ones can be skipped one by one or with "Skip the rest".
- **One primary at a time:** the dock's Continue is hidden until the needed photos exist, and stays secondary ("Continue with these photos") while an optional photo is still being asked for.
- **Continuity:** a thumbnail grows into the card and a finished photo shrinks back into its thumbnail (shared view-transition names `ph-<slot>`).
- **Fits one screen:** the frame is 4:3 so "Take photo" sits above the fold on a 375×812 phone.
Principles: cognitive load, focus, feedback, user control.

**6. Every step can wait.**
The draft autosaves, and "Save and finish later" is on every step. Delivery can be **held until the owner asks**, with no deadline (see 1b). Updates can be every step, approvals only, or off. The whole commission can be paused. Principles: user control, emotional context.

**7. Decide in advance what happens if the dog dies first.**
This is asked once, at reserve time, in plain words ("If Maple dies before it's finished"), and can be changed in settings. Euphemism here would make a consequential setting unclear. Principles: trust, comprehension.

**8. Exactly one "now" state on the tracker.**
Home shows a single card for what, if anything, needs the owner: paused, Ines is revising, needs your eyes, finished and held, or nothing needed from you. The timeline marks which stages need approval. Principle: system status.

**9. The reverse path is acknowledged, not ignored.**
"My dog has already passed" is a quiet link on the welcome screen. It opens a sheet that is honest about the trade-off (slower, more questions) and offers to continue with existing photos.

## Visual system: "an open sky"

Rebranded 2026-10-08 from a reference the user supplied (a playful habit-tracker concept: sky-blue gradient, white sticker circles, navy ink, lime pill). The sky also suits a memorial: open, light, calm.

- **Colour:** a sky gradient (`--sky-top` #9ec8f7 → `--paper` #eef5ff) with white sticker surfaces. Navy `--ink` #0d2a5a is 14:1 on white, and navy `--primary` (white text, 11:1) is used for the one main action per view. **Lime** `--lime` #dbf27c is the single highlight (needs your eyes, the current step, new version, age pill), always with navy text (11:1). **Mint** `--mint` marks finished. Secondary text is at least 5.9:1 and captions at least 4.9:1 on every surface they're used on.
- **Type:** Instrument Serif (narrow, editorial, one weight) for display and headings at 46/36/26px with 1.0–1.04 leading, with italics for emphasis ("*still beside you.*"). Geist 400/500/600 for UI, with a 17px body. Tabular numbers on prices and counts.
- **Stickers:** the dog sits in a white ring at the top of their own tracker, with their name in a tilted white serif pill and their age in a lime pill ("13 years good"), orbited by white circles (🦴 🧸 🎾). These are decorative and `aria-hidden`.
- **Surfaces:** cards are white with layered, ink-tinted shadows and no border. Borders are kept only where they mean something: form fields, selected choices, dashed empty photo slots and warnings.
- **Concentric radii:** card 28 = inner well 12 + padding 16. Slot 20 = thumb 12 + padding 8. Standalone wells use 28.
- **States:** selected choices and checked chips go navy (with a ✓, so colour isn't the only cue), like the reference's filled habit checks. Done timeline marks are navy discs, and the current mark is lime.
- **Press:** buttons scale to `0.96` with transitions on named properties only, using `cubic-bezier(0.2, 0, 0, 1)` at 150ms. Images get a 1px `oklch(0 0 0 / 0.1)` outline.
- **Illustration:** one parametric SVG bust (`Sculpture.tsx`) serves as the dog's "photo" (fur, cropped to fill like a real photo), the navy-line sketch, the grey digital render, the clay and the final material.

## Validation plan

1. Run 6–8 interviews with owners of senior or ill dogs, recruited through vets: does planning ahead feel caring or morbid?
2. Run a prototype test of the review screen: can owners say what's wrong with a likeness using the chips and their own words?
3. Make photo-only test pieces and check whether owners can pick out their own dog.
4. Put up a landing page with three price tiers and measure deposits paid, not clicks.

## Motion and perceived experience

**Rule: motion should feel like careful hands, not a celebration.** Everything enters quickly and settles (`--ease-enter`, 280ms), leaves faster than it came (`--ease-exit`, 160ms), and the only spring (`--spring`) is heavily damped: one small overshoot, no wobble. There is no confetti, no haptic buzz and no bounce near anything to do with loss. With reduced motion on, every effect is off and all state is still shown.

| Where | What happens | Why |
|---|---|---|
| Every navigation | A View Transition slides the screen forward or back. The top bar and step bar stay anchored, and the step bar's fill morphs. | Continuity: the user always knows which direction they moved. |
| Home → Review | The sculpture card morphs into the review image (`view-transition-name: likeness`). | Shared element: it's the same object, viewed closer. |
| Revising | The sculpture stays on screen with a slow light sweep while Ines works. When version 2 lands, the same element changes in place: the ears drop (CSS `d` path morph), the head tilts and the grey fades in. A badge says "Version 2 has arrived". | Labour illusion plus the reveal: the owner *sees* their note being acted on. |
| Review: press and hold | Holding morphs the sculpture back to the previous version, and letting go morphs it forward again. Works with touch, mouse and the keyboard (Space or Enter). | Before and after without hunting: a recognition aid, not decoration. |
| Angle switch | A single thumb slides between Front, Left and Right. The image squashes briefly sideways (`scaleX`), so it reads as turning the piece rather than swapping pictures. | Spatial continuity. |
| Photo slot | The chosen photo shows at once (an object URL) under a scan line, and the result pops in. The check takes about 50ms, so the scan is held to 700ms. | Optimistic UI plus honest labour illusion: "Good to use" is believed because it visibly looked. |
| Price | Changing size or material counts the total toward its new value. | A change reads as a change, not a flicker. |
| Sheets | They rise in and slide out, and the backdrop dims and blurs the page. | Focal dampening: only the decision is left. |
| A completed step | The mark settles in, its check draws, and the line grows down to the next step. Plays once, the next time you return to Home. | A quiet peak-end moment at the only milestones that matter. |
| First visit | Content reveals in a short stagger, and the hero bust lowers onto its plinth. | Structure first, detail after. |
