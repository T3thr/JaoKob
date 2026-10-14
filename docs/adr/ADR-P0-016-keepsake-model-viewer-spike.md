# ADR-P0-016: Lazy-loaded Keepsake Inspection Candidate

Date: 2026-10-14. Status: **Accepted for Milestone 1 by explicit Product Owner instruction; game integration deferred.**

## Context

[CR-0004](../rfc/CR-0004-adult-plush-model-spike.md) authorizes a seated adult plush base mesh and first interactive GLB inspection. The owner explicitly selected Google's model-viewer and demand-driven loading to preserve the initial game payload.

## Decision

- Use pinned `@google/model-viewer` 4.4.0 as a development dependency in the isolated spike. Import the component and request the GLB only after the open button is activated.
- Serve the component, model and poster from the same origin. The base GLB uses no compressed-extension decoder or external image URI, so no runtime CDN calls are needed.
- Preserve separate editable Blender objects; export copies joined into one mesh with two material primitives. Export in metres with Y up.
- Keep all spike artifacts under `docs/proposals/3d-keepsake-spike/`, excluded from production deployment. No import from the game's entry point, Core, Data or UI is added in Milestone 1.
- Record exported bytes, geometry/material counts, glTF validation and browser inspection evidence. Do not infer phone performance from desktop browser checks.

## Alternatives and consequences

Three.js offers finer scene control but requires additional camera/renderer lifecycle work for the first inspection. It remains an option if later inventory requirements exceed model-viewer's API. A photo alone is retained as fallback but does not demonstrate the requested 3D spin.

The component is an additional runtime library on the spike page; it is not described as dependency-free Vanilla JS. Future game wiring must preserve architecture boundaries, localization, fallback, initial payload and resource lifecycle, and needs its own approved contract/verification.

## Scope, supersession and rollback

Records the owner's new library decision for the spike only. Does not supersede accepted state/save/Canon decisions or approve production deployment. Rollback removes the isolated page and model files; no save migration is needed.

Trace: `CR-0004`, `GDD-VIS-003`, `NAR-SC-A5-007-HOME`, `NFR-PE-004`, `FR-ACC-001/003`.
