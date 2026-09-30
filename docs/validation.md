# Verification — 2026-09-29

- Full procedural build chain completed locally, from base course through optimized GLBs, architectural detail, textures, host walkway and compact MML.
- Both weathered GLBs: Khronos validation errors 0, warnings 0. Byte hashes and repeated placement counts are in evidence/asset-audit.json.
- Final static and compact MML: CLI 0.26.1 schema validation passed.
- Compact-script mock: all 80 doors created; riser contact triggers wall motion; midpoint matches the 9m horizontal / 4m vertical stroke. This is a simulated document test, not avatar physics.
- Audit: 241,792 triangles in GLB placements and all native cubes (including hidden collision proxies). The prior 242,056 ledger includes 264 estimated label triangles (132 x 2). Actual host label rendering may differ.
- Full-width cube geometry and runtime are rebuilt from the procedural sources. Generated output remains a prototype requiring native-world revalidation on the target client.
- Illustration: local 3D render captured September 24, showing course geometry. It does not demonstrate avatar movement.

Known limits: live editor persistence was unreliable in some prior sessions; verify a reopened saved document. Collider-based carry/release is host-dependent. No full 100-player load validation or secure host authorization is claimed. demo-reset is intentionally public.
