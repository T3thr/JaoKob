# Sprint 3 presentation contract fixtures

Trace: CR-0003 D1/D3/D5/D6/D7; TC-S3-CONTRACT-001, TC-S3-ARCH-001, TC-S3-SAVE-001.

- `migration/act-01-2.0.0.json`: byte-exact original `559b6d7` production package, SHA-256 `cbb710d69e31a0bd4c24cb54a83d9b5c937f192a5566222bc011ad4174847582`. Source for compatibility evidence only; production must never import tests.
- `schema/published-schema-sha256.json`: hash locks for the published root/1.1 schemas. Update only through approved schema governance, never to hide drift.
- `schema/valid-v1.2-package.json`: small strict structural/reference fixture for all supported environment node types and legacy forms.
- `presentation-package.js`: derives schema 1.2/content 2.1.0 target from the archive using additive environment/portrait/manifest changes only. Metadata has localized alt/attribution and explicitly test-only license labels. No corresponding media files exist, no runtime fetch is expected, and no production media rights/provenance or art approval is claimed.

Unit tests generate malformed variants in memory so each rejection names the changed field. Migration tests compare old/new gameplay before admission and exercise all 12 routes with no/partial/full observations and exact resume at every page. Production assets, hashing of media bytes, file availability/decode, browser audio and concurrent write guards belong to Tasks 2/4/5.
