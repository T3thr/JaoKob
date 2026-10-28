> **[STATUS AS OF 2026-10-29: SUPERSEDED BY ADR-P0-025 — DO NOT USE DEFAULT HEART POSE]**
> ถูกแทนที่โดย [ADR-P0-025](./ADR-P0-025-childhood-keepsake-default-stance-and-heart-emote-decoupling.md) (ระหว่างเล่นเกมห้ามใช้ท่าถือหัวใจสีแดงเป็นค่าเริ่มต้น)

# ADR-P0-017: Childhood Keepsake Accessory Export

Date: 2026-10-14. Status: **Accepted for Milestone 1B by explicit Product Owner instruction.**

## Context and decision

[CR-0004 Milestone 1B](../rfc/CR-0004-adult-plush-model-spike.md#milestone-1b--childhood-crochet-owner-authorized-2026-10-14) authorizes a childhood crochet doll whose red heart is optional. Keep the heart as a separate Blender collection/object and a separate named GLB mesh node `Accessory_RedHeart`; export the rest as `JaoKob_Childhood_Body`. The default asset includes both. Node names, rather than exporter-dependent numeric indexes, identify these parts.

This extends [ADR-P0-016](ADR-P0-016-keepsake-model-viewer-spike.md) only for the childhood asset's export structure: its one-mesh adult export remains unchanged. Combine body copies to reduce primitives while preserving editable source parts. Use a small packed tangent-space normal texture for crochet relief; keep self-contained GLB, metre/Y-up convention, pinned same-origin demand-loaded model-viewer and the isolated spike boundary.

## Alternatives and consequences

Joining the heart into the body saves a draw call but prevents clean removal. A separate node adds a small rendering cost and preserves the requested accessory contract. Do not add rigs, morph targets, emotion variants or a heart-toggle UI. Art parts and names are spike contracts, not published save/content IDs.

## Verification, compatibility and rollback

Validate independent body/heart nodes, triangle/byte limits, embedded normal image and zero glTF errors/warnings. Browser selection must load only the chosen doll and ignore obsolete asynchronous loads. No migration or production deployment. Rollback reverts Milestone 1B to the existing adult-only spike.

Trace: `CR-0004` Milestone 1B; `NFR-PE-004`; `FR-ACC-001/003`. Final owner likeness review and physical-device performance are separate gates.
