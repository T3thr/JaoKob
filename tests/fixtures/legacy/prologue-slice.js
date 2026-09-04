/** @deprecated Sprint 1 fixture. Production replacement: src/data/content/packages/act-01.json. */
/**
 * Approved mock content for Sprint 1's first playable slice.
 *
 * This resource deliberately holds player-facing Thai copy, stable content
 * identifiers, choice effects, and navigation declarations. Bootstrap only
 * projects this data and dispatches the Core commands it declares; it does not
 * embed narrative or game-rule values of its own.
 *
 * Trace: FR-STA-001, FR-STA-004, FR-ENG-002, FR-ENG-003, FR-LOC-001,
 * GDD-LOOP-001..003, GDD-MEC-002..004, GDD-PIL-005.
 */

export const PROLOGUE_CONTENT_VERSION = "1.0.0";

/**
 * A small, self-contained Act 1 resource. It is intentionally not presented
 * as the production Content Package: Task 5 needs a deterministic, reviewed
 * in-repository fixture while the JSON content repository is still future
 * work. Its stable IDs and effect shapes match the established Core contract.
 */
export const PROLOGUE_SLICE = deepFreeze({
  version: PROLOGUE_CONTENT_VERSION,
  locale: "th",
  tree: {
    id: "tree.prologue",
    entryNodeId: "node.prologue.introduction",
    titleNodeId: "node.prologue.title",
    decisionNodeId: "node.prologue.decision",
    crisisNodeId: "node.prologue.crisis",
    recoveryNodeId: "node.prologue.recovery",
    initialCheckpointId: "checkpoint.prologue.entry",
  },
  defaults: {
    metrics: { hp: 80, sanity: 70, bond: 0 },
    rng: { algorithm: "xorshift32-v1", seed: 1, state: 1 },
    settings: {
      locale: "th",
      textSpeed: "normal",
      fontScale: 1,
      reducedMotion: false,
      highContrast: false,
      storyAssist: false,
      immersiveUi: true,
      confirmHighImpactChoices: true,
      typewriterEffect: true,
      autoAdvance: false,
      masterVolume: 1,
      musicVolume: 0,
      ambienceVolume: 0,
      effectsVolume: 0,
      reducedIntensityAudio: false,
    },
  },
  flags: [
    {
      id: "story.called-for-friends",
      valueType: "boolean",
      defaultValue: false,
      policy: { kind: "marker", reversible: false },
    },
  ],
  ui: {
    labels: {
      saveStatus: "สถานะการบันทึก",
    },
    firstRunNotice: {
      title: "ก่อนเริ่มการเดินทาง",
      items: [
        "นี่คือการผจญภัยเชิงเรื่องเล่าที่เล่นด้วยการสังเกตและตัดสินใจ",
        "ฉากแรกกล่าวถึงฝน การพลัดหลง และความรู้สึกโดดเดี่ยวอย่างอ่อนโยน",
        "ความคืบหน้าจะบันทึกไว้ในเบราว์เซอร์ของอุปกรณ์นี้เมื่อพร้อมใช้งาน",
        "ทุกปุ่มใช้คีย์บอร์ดได้ และสามารถอ่านผลของการเลือกจากข้อความได้",
      ],
    },
    messages: {
      actionUnavailable: "การกระทำนี้ยังไม่พร้อมใช้งานในฉากปัจจุบัน",
      choiceRejected: "ยังไม่สามารถยืนยันทางเลือกนี้ได้ โปรดลองอีกครั้ง",
      saveSucceeded: "บันทึกความคืบหน้าแล้ว",
      saveUnavailable: "ยังเล่นต่อได้ในหน้านี้ แต่ยังไม่สามารถบันทึกความคืบหน้าได้",
      saveRecovered: "พบความคืบหน้าที่เล่นต่อได้ เลือกเล่นต่อหรือเริ่มการเดินทางใหม่",
      saveIgnored: "ไม่สามารถใช้ความคืบหน้าเดิมได้ จึงเริ่มจากฉากเปิดตัวอย่างปลอดภัย",
      resumeReady: "กลับสู่ช่วงล่าสุดของการเดินทางแล้ว",
      retryReady: "เจ้ากบกลับมาที่จุดพักล่าสุดแล้ว",
      storyAssistEnabled: "เปิดโหมดช่วยเล่าเรื่องสำหรับทางเลือกถัดไปแล้ว",
      settingsUnavailable: "การตั้งค่าเพิ่มเติมจะพร้อมในช่วงถัดไปของการพัฒนา",
    },
  },
  nodes: [
    {
      id: "node.prologue.title",
      type: "title",
      scene: {
        title: "เจ้ากบ",
        dialogue: "ริมคลองหลังฝนตก — เจ้ากบตื่นขึ้นมาพบว่าตัวเองพลัดหลงจากบึงบัว",
      },
      actions: [
        {
          id: "action.prologue.new-game",
          label: "เริ่มการเดินทาง",
          command: "NEW_GAME",
        },
        {
          id: "action.prologue.resume",
          label: "เล่นต่อจากจุดล่าสุด",
          command: "CONTINUE",
        },
      ],
    },
    {
      id: "node.prologue.introduction",
      type: "cutscene",
      scene: {
        title: "ริมคลองหลังฝนตก",
        speaker: "เจ้ากบ",
        dialogue: "ละอองฝนยังเกาะตามใบหญ้า เสียงคลองค่อย ๆ เบาลง และทางกลับบึงบัวซ่อนอยู่หลังม่านหมอก",
      },
      actions: [
        {
          id: "action.prologue.open-decision",
          label: "มองไปรอบตัวอย่างตั้งใจ",
          command: "REQUEST_DECISION",
          targetNodeId: "node.prologue.decision",
        },
      ],
    },
    {
      id: "node.prologue.decision",
      type: "decision",
      scene: {
        title: "เสียงจากม่านหมอก",
        dialogue: "หยดน้ำไหลผ่านปลายเท้า เจ้ากบอยากเลือกทางที่พาตัวเองไปต่อได้อย่างอ่อนโยน",
      },
      choices: [
        {
          id: "choice.prologue.jump-to-leaf",
          label: "กระโดดข้ามแอ่งน้ำไปสำรวจใบไม้ใหญ่",
          condition: { kind: "always" },
          effects: [
            { type: "adjust-metric", metric: "hp", amount: -5 },
            { type: "adjust-metric", metric: "bond", amount: 10 },
          ],
          nextNodeId: "node.prologue.after-leaf",
          feedback: "การกระโดดทำให้เหนื่อยนิดหน่อย แต่ใบไม้ใหญ่ช่วยบังฝนและเปิดมุมมองใหม่",
        },
        {
          id: "choice.prologue.rest-in-rain",
          label: "นั่งนิ่ง ๆ สังเกตเสียงฝนและฟื้นฟูกำลัง",
          condition: { kind: "always" },
          effects: [
            { type: "adjust-metric", metric: "sanity", amount: 10 },
          ],
          nextNodeId: "node.prologue.after-rest",
          feedback: "เมื่อฟังฝนอย่างไม่เร่งรีบ ลมหายใจของเจ้ากบก็ค่อย ๆ กลับมาเป็นจังหวะ",
        },
        {
          id: "choice.prologue.call-through-mist",
          label: "ส่งเสียงร้องเรียกหาเพื่อนในม่านหมอก",
          condition: { kind: "always" },
          effects: [
            { type: "adjust-metric", metric: "sanity", amount: -5 },
            { type: "set-flag", flagId: "story.called-for-friends", value: true },
          ],
          nextNodeId: "node.prologue.after-call",
          feedback: "เสียงร้องหายเข้าไปในหมอก แม้หัวใจสั่นไหว แต่มีบางสิ่งในคลองรับรู้การตามหานั้น",
        },
      ],
    },
    {
      id: "node.prologue.after-leaf",
      type: "cutscene",
      scene: {
        title: "ใต้ใบไม้ใหญ่",
        dialogue: "ใต้เงาใบไม้ เจ้ากบเห็นทางน้ำเล็ก ๆ ที่อาจพาไปใกล้บึงบัวกว่าเดิม",
      },
      actions: [
        {
          id: "action.prologue.reflect-after-leaf",
          label: "สำรวจรอบตัวต่อ",
          command: "REQUEST_DECISION",
          targetNodeId: "node.prologue.decision",
        },
      ],
    },
    {
      id: "node.prologue.after-rest",
      type: "cutscene",
      scene: {
        title: "จังหวะของฝน",
        dialogue: "เมื่อฝนเบาลง เจ้ากบเริ่มแยกเสียงน้ำไหลออกจากเสียงลมที่พัดผ่านกอหญ้าได้",
      },
      actions: [
        {
          id: "action.prologue.reflect-after-rest",
          label: "สำรวจรอบตัวต่อ",
          command: "REQUEST_DECISION",
          targetNodeId: "node.prologue.decision",
        },
      ],
    },
    {
      id: "node.prologue.after-call",
      type: "cutscene",
      scene: {
        title: "เสียงตอบจากไกล ๆ",
        dialogue: "ยังไม่มีคำตอบชัดเจน แต่กระแสน้ำสั่นไหวราวกับกำลังพาเสียงนั้นเดินทางต่อไป",
      },
      actions: [
        {
          id: "action.prologue.reflect-after-call",
          label: "สำรวจรอบตัวต่อ",
          command: "REQUEST_DECISION",
          targetNodeId: "node.prologue.decision",
        },
      ],
    },
    {
      id: "node.prologue.crisis",
      type: "game-over",
      scene: {
        title: "มุมพักใต้กอหญ้า",
        dialogue: "เจ้ากบต้องการเวลาพักและจุดเริ่มต้นที่อ่อนโยนกว่าเดิม",
      },
    },
    {
      id: "node.prologue.recovery",
      type: "cutscene",
      scene: {
        title: "แสงอุ่นริมคลอง",
        dialogue: "แม้วันนี้จะหนักเกินไป เจ้ากบยังมีพื้นที่ให้พักหายใจและเริ่มก้าวต่ออีกครั้ง",
      },
      actions: [
        {
          id: "action.prologue.recovery-decision",
          label: "กลับมาสังเกตทางข้างหน้า",
          command: "REQUEST_DECISION",
          targetNodeId: "node.prologue.decision",
        },
      ],
    },
  ],
});

/**
 * Validate only the compact Sprint-1 data contract at its trust boundary.
 * The formal JSON Content Package validator belongs to the future content
 * repository; this prevents malformed injected mock data from booting play.
 *
 * @param {unknown} value
 * @returns {Readonly<{valid: true}> | Readonly<{valid: false, issue: Readonly<{code: string, reason: string}>}>}
 */
export function validatePrologueSlice(value) {
  const issue = validateSlice(value);
  return issue === null
    ? Object.freeze({ valid: true })
    : Object.freeze({ valid: false, issue: Object.freeze(issue) });
}

function validateSlice(value) {
  if (!isRecord(value)) return invalid("CONTENT_NOT_OBJECT");
  if (!isSemanticVersion(value.version)) return invalid("INVALID_CONTENT_VERSION");
  if (value.locale !== "th") return invalid("MISSING_THAI_SOURCE_LOCALE");
  if (!isRecord(value.tree) || !isIdentifier(value.tree.id)) return invalid("INVALID_TREE");
  if (!isRecord(value.defaults) || !isRecord(value.defaults.metrics)) return invalid("INVALID_DEFAULTS");
  if (!isRecord(value.ui) || !isRecord(value.ui.labels) || !isThaiText(value.ui.labels.saveStatus)) {
    return invalid("INVALID_UI_RESOURCE");
  }
  if (!Array.isArray(value.flags) || !Array.isArray(value.nodes)) return invalid("INVALID_COLLECTION");

  const nodeIds = new Set();
  for (const node of value.nodes) {
    if (!isRecord(node) || !isIdentifier(node.id) || nodeIds.has(node.id)) {
      return invalid("INVALID_OR_DUPLICATE_NODE_ID");
    }
    if (!isRecord(node.scene) || !isThaiText(node.scene.title) || !isThaiText(node.scene.dialogue)) {
      return invalid("INVALID_NODE_TEXT");
    }
    nodeIds.add(node.id);
  }

  for (const field of [
    "entryNodeId",
    "titleNodeId",
    "decisionNodeId",
    "crisisNodeId",
    "recoveryNodeId",
  ]) {
    if (!isIdentifier(value.tree[field]) || !nodeIds.has(value.tree[field])) {
      return invalid("DANGLING_TREE_REFERENCE");
    }
  }

  const flagIds = new Set();
  for (const flag of value.flags) {
    if (!isRecord(flag)
      || !isIdentifier(flag.id)
      || flagIds.has(flag.id)
      || !["boolean", "integer", "string"].includes(flag.valueType)) {
      return invalid("INVALID_OR_DUPLICATE_FLAG");
    }
    flagIds.add(flag.id);
  }

  for (const node of value.nodes) {
    if (node.type === "decision") {
      if (!Array.isArray(node.choices) || node.choices.length < 2) {
        return invalid("DECISION_NEEDS_ELIGIBLE_CHOICES");
      }
      for (const choice of node.choices) {
        if (!isRecord(choice)
          || !isIdentifier(choice.id)
          || !isThaiText(choice.label)
          || !isRecord(choice.condition)
          || !Array.isArray(choice.effects)
          || !isIdentifier(choice.nextNodeId)
          || !nodeIds.has(choice.nextNodeId)
          || !isThaiText(choice.feedback)) {
          return invalid("INVALID_DECISION_CHOICE");
        }
      }
    }

    if (Array.isArray(node.actions)) {
      for (const action of node.actions) {
        if (!isRecord(action)
          || !isIdentifier(action.id)
          || !isThaiText(action.label)
          || !["NEW_GAME", "CONTINUE", "REQUEST_DECISION"].includes(action.command)) {
          return invalid("INVALID_NODE_ACTION");
        }
        if (action.command === "REQUEST_DECISION"
          && (!isIdentifier(action.targetNodeId) || !nodeIds.has(action.targetNodeId))) {
          return invalid("DANGLING_ACTION_TARGET");
        }
      }
    }
  }

  return null;
}

function invalid(reason) {
  return { code: "CONTENT_SCHEMA", reason };
}

function isThaiText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isIdentifier(value) {
  return typeof value === "string"
    && /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/.test(value);
}

function isSemanticVersion(value) {
  return typeof value === "string"
    && /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.test(value);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function deepFreeze(value) {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}
