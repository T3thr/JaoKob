import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TRAY_GROUPS } from "../../src/core/domain/clash/clash-rules.js";
import { admitJourneyPackage } from "../../src/data/content/journey-package.js";
import { createJourneySession } from "../../src/core/use-cases/journey-session.js";
import { SCREENS, nextCommand, screenPackage, withPreconditions } from "../../docs/design-system/evidence/journey-v3-harness/screens.js";

/**
 * The PO harness of the 13 Mockups v3 screens shows real engine states (T5 · TC-S5-PROTO-001):
 * every screen package passes the real admission, its preconditions pass Core's restore, real
 * commands reach the beat, and Core's own view equals what the v3 README and the v3 screen-state
 * check say the screen shows. Trace: UX §8.2–§8.4, Mockups v3 README.
 */
const json = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const sources = {
  mini: json("../fixtures/journey/mini-journey.json"),
  story: json("../../docs/design-system/mechanics/story.json"),
  fixtures: json("../../docs/design-system/ux-mockups/v3/harness/fixtures.json"),
};
const NOW = "2026-11-09T05:30:00+07:00";
const same = (a, b) => [...a].sort().join(",") === [...b].sort().join(",");

/** The play view of a screen, reached through admission, restore and real commands. */
export function reach(screen) {
  const admitted = admitJourneyPackage(screenPackage(screen, sources), { role: "extension" });
  assert.ok(admitted.ok, `${screen.stem}: ${JSON.stringify(admitted.error)}`);
  const session = createJourneySession(admitted.value.package);
  let state = session.restore(withPreconditions(session.newGame({ sessionId: "12345678-1234-4123-8123-123456789abc", now: NOW }), screen));
  const progress = { pressed: 0 };
  for (let guard = 0; guard < 80; guard += 1) {
    const view = session.view(state);
    const command = nextCommand(view, screen, progress);
    if (command === null) return view;
    const result = session[command.kind](state, { revision: state.revision, now: NOW, ...(command.args ?? {}) });
    assert.ok(result.ok, `${screen.stem}: ${command.kind} ${JSON.stringify(result.error)}`);
    state = result.state;
  }
  throw new Error(`${screen.stem}: the screen was not reached`);
}

test("TC-S5-PROTO-001 the harness has the 13 screens of Mockups v3, each at its v3 viewport", () => {
  assert.deepEqual(SCREENS.map((screen) => screen.n), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
  const manifest = json("../../docs/design-system/ux-mockups/v3/harness/fixtures.json");
  assert.deepEqual(SCREENS.map((screen) => screen.stem), manifest.screens.map((screen) => screen.stem));
  for (const screen of SCREENS) assert.ok([390, 1440].includes(screen.viewport[0]), screen.stem);
});

for (const screen of SCREENS) {
  test(`TC-S5-PROTO-001 v3 screen ${screen.n} ${screen.stem} is a state the engine reaches`, () => {
    const view = reach(screen);
    const want = screen.expect;
    assert.equal(view.mode, want.mode);
    if (screen.kind === "clash") {
      const cards = TRAY_GROUPS.flatMap((group) => view.clash.groups[group]);
      assert.equal(view.clash.turn, want.turn, "turn");
      assert.equal(view.clash.light, want.light, "light");
      assert.equal(view.clash.intent.id, want.intent, "intent");
      assert.ok(same(cards.map((card) => card.id), want.cards), `cards ${cards.map((card) => card.id)}`);
      assert.ok(same(cards.filter((card) => card.answers).map((card) => card.id), want.counter), "counter");
      assert.ok(same(cards.filter((card) => card.homesick).map((card) => card.id), want.repeat), "repeat");
    }
    if (screen.kind === "choice") assert.deepEqual(view.decision.options.map((option) => option.key), want.options);
    if (screen.kind === "camp") assert.equal(view.camp.activities.length, want.activities);
    if (screen.kind === "micro") assert.equal(view.micro.kind, want.micro);
    if (screen.kind === "vn") {
      const line = screenPackage(screen, sources).texts.find((entry) => entry.id === view.line.text);
      assert.equal(line.speaker, "char_jao_teuk");
      assert.equal(line.body, sources.fixtures.vn.line, "the v3 line, verbatim");
    }
    if (screen.kind === "endings") {
      for (const [key, open] of Object.entries(want.open)) assert.equal(view.endings.options.find((option) => option.key === key).open, open, key);
      assert.equal(view.endings.fallback === true, want.fallback, "fallback");
    }
  });
}
