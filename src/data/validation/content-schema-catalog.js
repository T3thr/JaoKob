/** Generated from specs/schemas; update with the catalog parity test when contracts change.
 * Runtime-only local registry: no network or filesystem reads. Trace: CR-0002 D4, ADR-P0-013. */
import { deepFreeze } from "./content-values.js";

export const CONTENT_SCHEMA_CATALOG = deepFreeze({
  "character.schema.json": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://t3thr.github.io/JaoKob/specs/schemas/character.schema.json",
    "title": "JaoKob Character Catalog",
    "description": "บัญชีตัวละครและคุณลักษณะเชิงเรื่องเล่าของ JaoKob",
    "type": "object",
    "required": [
      "schemaVersion",
      "characters"
    ],
    "properties": {
      "schemaVersion": {
        "const": "1.0.0"
      },
      "characters": {
        "type": "array",
        "minItems": 1,
        "maxItems": 256,
        "items": {
          "$ref": "#/$defs/character"
        }
      }
    },
    "additionalProperties": false,
    "$defs": {
      "character": {
        "type": "object",
        "required": [
          "id",
          "name",
          "shortName",
          "narrativeRole",
          "description",
          "traits",
          "visualProfile"
        ],
        "properties": {
          "id": {
            "$ref": "common.schema.json#/$defs/identifier"
          },
          "name": {
            "$ref": "common.schema.json#/$defs/localizedShortText"
          },
          "shortName": {
            "$ref": "common.schema.json#/$defs/localizedShortText"
          },
          "narrativeRole": {
            "type": "string",
            "enum": [
              "protagonist",
              "family",
              "ally",
              "human",
              "observer",
              "antagonistic-force",
              "narrator"
            ]
          },
          "description": {
            "$ref": "common.schema.json#/$defs/localizedText"
          },
          "traits": {
            "$ref": "common.schema.json#/$defs/localizedStringList"
          },
          "visualProfile": {
            "type": "object",
            "required": [
              "species",
              "lifeStage",
              "appearance"
            ],
            "properties": {
              "species": {
                "$ref": "common.schema.json#/$defs/localizedShortText"
              },
              "lifeStage": {
                "type": "string",
                "enum": [
                  "tadpole",
                  "metamorph",
                  "frog",
                  "human",
                  "non-living",
                  "various"
                ]
              },
              "appearance": {
                "$ref": "common.schema.json#/$defs/localizedText"
              },
              "defaultPortraitAssetId": {
                "$ref": "common.schema.json#/$defs/identifier",
                "x-jaokob-reference": "asset.id"
              }
            },
            "additionalProperties": false
          },
          "tags": {
            "type": "array",
            "maxItems": 32,
            "uniqueItems": true,
            "items": {
              "$ref": "common.schema.json#/$defs/identifier"
            }
          }
        },
        "additionalProperties": false
      }
    }
  },
  "common.schema.json": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://t3thr.github.io/JaoKob/specs/schemas/common.schema.json",
    "title": "JaoKob Common Definitions",
    "description": "ข้อกำหนดชนิดข้อมูลร่วมสำหรับเนื้อหา สถานะเกม และการอ้างอิงข้ามเอกสารของ JaoKob",
    "$defs": {
      "identifier": {
        "type": "string",
        "minLength": 1,
        "maxLength": 96,
        "pattern": "^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$"
      },
      "semanticVersion": {
        "type": "string",
        "pattern": "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z.-]+)?(?:\\+[0-9A-Za-z.-]+)?$"
      },
      "localeTag": {
        "type": "string",
        "minLength": 2,
        "maxLength": 35,
        "pattern": "^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-(?:[A-Z]{2}|[0-9]{3}))?$"
      },
      "localizedText": {
        "type": "object",
        "description": "แผนที่ข้อความตาม BCP 47 แบบจำกัด โดยภาษาไทยเป็นข้อความฐานและต้องมีเสมอ",
        "required": [
          "th"
        ],
        "properties": {
          "th": {
            "type": "string",
            "minLength": 1,
            "maxLength": 12000
          }
        },
        "patternProperties": {
          "^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-(?:[A-Z]{2}|[0-9]{3}))?$": {
            "type": "string",
            "minLength": 1,
            "maxLength": 12000
          }
        },
        "additionalProperties": false
      },
      "localizedShortText": {
        "type": "object",
        "description": "ข้อความสั้นตามภาษา โดยภาษาไทยเป็นข้อความฐานและต้องมีเสมอ",
        "required": [
          "th"
        ],
        "properties": {
          "th": {
            "type": "string",
            "minLength": 1,
            "maxLength": 240
          }
        },
        "patternProperties": {
          "^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-(?:[A-Z]{2}|[0-9]{3}))?$": {
            "type": "string",
            "minLength": 1,
            "maxLength": 240
          }
        },
        "additionalProperties": false
      },
      "localizedStringList": {
        "type": "object",
        "description": "รายการข้อความตามภาษา แต่ละภาษาต้องมีจำนวนรายการและความหมายเรียงตรงกัน",
        "required": [
          "th"
        ],
        "properties": {
          "th": {
            "type": "array",
            "minItems": 1,
            "maxItems": 24,
            "items": {
              "type": "string",
              "minLength": 1,
              "maxLength": 500
            }
          }
        },
        "patternProperties": {
          "^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-(?:[A-Z]{2}|[0-9]{3}))?$": {
            "type": "array",
            "minItems": 1,
            "maxItems": 24,
            "items": {
              "type": "string",
              "minLength": 1,
              "maxLength": 500
            }
          }
        },
        "additionalProperties": false
      },
      "gameState": {
        "type": "string",
        "enum": [
          "Title",
          "Cutscene",
          "Exploration",
          "Decision",
          "GameOver",
          "Ending"
        ]
      },
      "metricName": {
        "type": "string",
        "enum": [
          "hp",
          "sanity",
          "bond"
        ]
      },
      "metricSnapshot": {
        "type": "object",
        "required": [
          "hp",
          "sanity",
          "bond"
        ],
        "properties": {
          "hp": {
            "type": "integer",
            "minimum": 0,
            "maximum": 100
          },
          "sanity": {
            "type": "integer",
            "minimum": 0,
            "maximum": 100
          },
          "bond": {
            "type": "integer",
            "minimum": 0,
            "maximum": 100
          }
        },
        "additionalProperties": false
      },
      "flagValue": {
        "oneOf": [
          {
            "type": "boolean"
          },
          {
            "type": "integer",
            "minimum": -1000000,
            "maximum": 1000000
          },
          {
            "type": "string",
            "maxLength": 240
          }
        ]
      },
      "flagEntry": {
        "type": "object",
        "required": [
          "id",
          "value"
        ],
        "properties": {
          "id": {
            "$ref": "#/$defs/identifier"
          },
          "value": {
            "$ref": "#/$defs/flagValue"
          }
        },
        "additionalProperties": false
      },
      "atomicCondition": {
        "oneOf": [
          {
            "type": "object",
            "required": [
              "kind"
            ],
            "properties": {
              "kind": {
                "const": "always"
              }
            },
            "additionalProperties": false
          },
          {
            "type": "object",
            "required": [
              "kind",
              "metric",
              "operator",
              "value"
            ],
            "properties": {
              "kind": {
                "const": "metric"
              },
              "metric": {
                "$ref": "#/$defs/metricName"
              },
              "operator": {
                "type": "string",
                "enum": [
                  "eq",
                  "neq",
                  "gt",
                  "gte",
                  "lt",
                  "lte"
                ]
              },
              "value": {
                "type": "integer",
                "minimum": 0,
                "maximum": 100
              }
            },
            "additionalProperties": false
          },
          {
            "type": "object",
            "required": [
              "kind",
              "flagId",
              "operator"
            ],
            "properties": {
              "kind": {
                "const": "flag"
              },
              "flagId": {
                "$ref": "#/$defs/identifier",
                "x-jaokob-reference": "flag.id"
              },
              "operator": {
                "type": "string",
                "enum": [
                  "exists",
                  "not-exists"
                ]
              }
            },
            "additionalProperties": false
          },
          {
            "type": "object",
            "required": [
              "kind",
              "flagId",
              "operator",
              "value"
            ],
            "properties": {
              "kind": {
                "const": "flag"
              },
              "flagId": {
                "$ref": "#/$defs/identifier",
                "x-jaokob-reference": "flag.id"
              },
              "operator": {
                "type": "string",
                "enum": [
                  "eq",
                  "neq"
                ]
              },
              "value": {
                "$ref": "#/$defs/flagValue"
              }
            },
            "additionalProperties": false
          }
        ]
      },
      "condition": {
        "oneOf": [
          {
            "$ref": "#/$defs/atomicCondition"
          },
          {
            "type": "object",
            "required": [
              "all"
            ],
            "properties": {
              "all": {
                "type": "array",
                "minItems": 1,
                "maxItems": 32,
                "items": {
                  "$ref": "#/$defs/condition"
                }
              }
            },
            "additionalProperties": false
          },
          {
            "type": "object",
            "required": [
              "any"
            ],
            "properties": {
              "any": {
                "type": "array",
                "minItems": 1,
                "maxItems": 32,
                "items": {
                  "$ref": "#/$defs/condition"
                }
              }
            },
            "additionalProperties": false
          },
          {
            "type": "object",
            "required": [
              "not"
            ],
            "properties": {
              "not": {
                "$ref": "#/$defs/condition"
              }
            },
            "additionalProperties": false
          }
        ]
      },
      "effect": {
        "oneOf": [
          {
            "type": "object",
            "required": [
              "type",
              "metric",
              "amount"
            ],
            "properties": {
              "type": {
                "const": "adjust-metric"
              },
              "metric": {
                "$ref": "#/$defs/metricName"
              },
              "amount": {
                "type": "integer",
                "minimum": -100,
                "maximum": 100
              }
            },
            "additionalProperties": false
          },
          {
            "type": "object",
            "required": [
              "type",
              "metric",
              "value"
            ],
            "properties": {
              "type": {
                "const": "set-metric"
              },
              "metric": {
                "$ref": "#/$defs/metricName"
              },
              "value": {
                "type": "integer",
                "minimum": 0,
                "maximum": 100
              }
            },
            "additionalProperties": false
          },
          {
            "type": "object",
            "required": [
              "type",
              "flagId",
              "value"
            ],
            "properties": {
              "type": {
                "const": "set-flag"
              },
              "flagId": {
                "$ref": "#/$defs/identifier",
                "x-jaokob-reference": "flag.id"
              },
              "value": {
                "$ref": "#/$defs/flagValue"
              }
            },
            "additionalProperties": false
          },
          {
            "type": "object",
            "required": [
              "type",
              "flagId",
              "amount"
            ],
            "properties": {
              "type": {
                "const": "adjust-flag"
              },
              "flagId": {
                "$ref": "#/$defs/identifier",
                "x-jaokob-reference": "flag.id"
              },
              "amount": {
                "type": "integer",
                "minimum": -1000000,
                "maximum": 1000000
              }
            },
            "additionalProperties": false
          },
          {
            "type": "object",
            "required": [
              "type",
              "flagId"
            ],
            "properties": {
              "type": {
                "const": "clear-flag"
              },
              "flagId": {
                "$ref": "#/$defs/identifier",
                "x-jaokob-reference": "flag.id"
              }
            },
            "additionalProperties": false
          },
          {
            "type": "object",
            "required": [
              "type",
              "checkpointId"
            ],
            "properties": {
              "type": {
                "const": "set-checkpoint"
              },
              "checkpointId": {
                "$ref": "#/$defs/identifier",
                "x-jaokob-reference": "checkpoint.id"
              }
            },
            "additionalProperties": false
          }
        ]
      },
      "settings": {
        "type": "object",
        "required": [
          "locale",
          "textSpeed",
          "fontScale",
          "reducedMotion",
          "highContrast",
          "storyAssist",
          "immersiveUi",
          "confirmHighImpactChoices",
          "typewriterEffect",
          "autoAdvance",
          "masterVolume",
          "musicVolume",
          "ambienceVolume",
          "effectsVolume",
          "reducedIntensityAudio"
        ],
        "properties": {
          "locale": {
            "$ref": "#/$defs/localeTag"
          },
          "textSpeed": {
            "type": "string",
            "enum": [
              "slow",
              "normal",
              "fast",
              "instant"
            ]
          },
          "fontScale": {
            "type": "number",
            "minimum": 0.875,
            "maximum": 2
          },
          "reducedMotion": {
            "type": "boolean"
          },
          "highContrast": {
            "type": "boolean"
          },
          "storyAssist": {
            "type": "boolean"
          },
          "immersiveUi": {
            "type": "boolean"
          },
          "confirmHighImpactChoices": {
            "type": "boolean"
          },
          "typewriterEffect": {
            "type": "boolean"
          },
          "autoAdvance": {
            "type": "boolean"
          },
          "masterVolume": {
            "type": "number",
            "minimum": 0,
            "maximum": 1
          },
          "musicVolume": {
            "type": "number",
            "minimum": 0,
            "maximum": 1
          },
          "ambienceVolume": {
            "type": "number",
            "minimum": 0,
            "maximum": 1
          },
          "effectsVolume": {
            "type": "number",
            "minimum": 0,
            "maximum": 1
          },
          "reducedIntensityAudio": {
            "type": "boolean"
          }
        },
        "additionalProperties": false
      }
    }
  },
  "content-package.schema.json": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://t3thr.github.io/JaoKob/specs/schemas/content-package.schema.json",
    "title": "JaoKob Content Package",
    "description": "หน่วยเผยแพร่เนื้อหาที่รวมรายการตัวละคร บทสนทนา เหตุการณ์ กราฟเรื่องเล่า สินทรัพย์ และค่าตั้งต้น",
    "type": "object",
    "required": [
      "schemaVersion",
      "contentVersion",
      "defaultLocale",
      "supportedLocales",
      "entryTreeId",
      "gameDefaults",
      "flagDefinitions",
      "contentWarnings",
      "assets",
      "characters",
      "dialogues",
      "events",
      "narrativeTrees"
    ],
    "properties": {
      "schemaVersion": {
        "const": "1.0.0"
      },
      "contentVersion": {
        "$ref": "common.schema.json#/$defs/semanticVersion"
      },
      "defaultLocale": {
        "const": "th"
      },
      "supportedLocales": {
        "type": "array",
        "minItems": 1,
        "maxItems": 32,
        "uniqueItems": true,
        "contains": {
          "const": "th"
        },
        "items": {
          "$ref": "common.schema.json#/$defs/localeTag"
        }
      },
      "entryTreeId": {
        "$ref": "common.schema.json#/$defs/identifier",
        "x-jaokob-reference": "narrative-tree.treeId"
      },
      "gameDefaults": {
        "type": "object",
        "required": [
          "metrics",
          "settings"
        ],
        "properties": {
          "metrics": {
            "$ref": "common.schema.json#/$defs/metricSnapshot"
          },
          "settings": {
            "$ref": "common.schema.json#/$defs/settings"
          }
        },
        "additionalProperties": false
      },
      "flagDefinitions": {
        "type": "array",
        "maxItems": 5000,
        "items": {
          "$ref": "#/$defs/flagDefinition"
        }
      },
      "contentWarnings": {
        "type": "array",
        "maxItems": 256,
        "items": {
          "$ref": "#/$defs/contentWarning"
        }
      },
      "assets": {
        "type": "array",
        "maxItems": 10000,
        "items": {
          "$ref": "#/$defs/asset"
        }
      },
      "characters": {
        "$ref": "character.schema.json"
      },
      "dialogues": {
        "$ref": "dialogue.schema.json"
      },
      "events": {
        "$ref": "event.schema.json"
      },
      "narrativeTrees": {
        "type": "array",
        "minItems": 1,
        "maxItems": 128,
        "items": {
          "$ref": "narrative-tree.schema.json"
        }
      }
    },
    "additionalProperties": false,
    "$defs": {
      "flagDefinition": {
        "type": "object",
        "required": [
          "id",
          "valueType",
          "defaultValue",
          "description"
        ],
        "properties": {
          "id": {
            "$ref": "common.schema.json#/$defs/identifier"
          },
          "valueType": {
            "type": "string",
            "enum": [
              "boolean",
              "integer",
              "string"
            ]
          },
          "defaultValue": {
            "$ref": "common.schema.json#/$defs/flagValue"
          },
          "description": {
            "$ref": "common.schema.json#/$defs/localizedText"
          }
        },
        "additionalProperties": false
      },
      "contentWarning": {
        "type": "object",
        "required": [
          "id",
          "title",
          "detail",
          "intensity"
        ],
        "properties": {
          "id": {
            "$ref": "common.schema.json#/$defs/identifier"
          },
          "title": {
            "$ref": "common.schema.json#/$defs/localizedShortText"
          },
          "detail": {
            "$ref": "common.schema.json#/$defs/localizedText"
          },
          "intensity": {
            "type": "string",
            "enum": [
              "mild",
              "moderate",
              "strong"
            ]
          }
        },
        "additionalProperties": false
      },
      "asset": {
        "type": "object",
        "required": [
          "id",
          "type",
          "path",
          "rights"
        ],
        "properties": {
          "id": {
            "$ref": "common.schema.json#/$defs/identifier"
          },
          "type": {
            "type": "string",
            "enum": [
              "image",
              "audio",
              "font"
            ]
          },
          "path": {
            "type": "string",
            "minLength": 1,
            "maxLength": 512,
            "pattern": "^(?![A-Za-z][A-Za-z0-9+.-]*:)(?!/)(?!.*(?:^|/)\\.\\.(?:/|$))[A-Za-z0-9_./-]+$"
          },
          "alt": {
            "$ref": "common.schema.json#/$defs/localizedShortText"
          },
          "rights": {
            "type": "object",
            "required": [
              "origin",
              "licenseId"
            ],
            "properties": {
              "origin": {
                "type": "string",
                "enum": [
                  "original",
                  "commissioned",
                  "licensed",
                  "public-domain"
                ]
              },
              "licenseId": {
                "type": "string",
                "minLength": 1,
                "maxLength": 120
              },
              "sourceUrl": {
                "type": "string",
                "format": "uri",
                "maxLength": 2048
              },
              "attribution": {
                "$ref": "common.schema.json#/$defs/localizedShortText"
              }
            },
            "additionalProperties": false
          }
        },
        "allOf": [
          {
            "if": {
              "properties": {
                "type": {
                  "const": "image"
                }
              },
              "required": [
                "type"
              ]
            },
            "then": {
              "properties": {
                "alt": true
              },
              "required": [
                "alt"
              ]
            }
          }
        ],
        "additionalProperties": false
      }
    }
  },
  "dialogue.schema.json": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://t3thr.github.io/JaoKob/specs/schemas/dialogue.schema.json",
    "title": "JaoKob Dialogue Catalog",
    "description": "บัญชีบรรทัดบทสนทนาและคำบรรยายภาษาไทยเป็นฐาน",
    "type": "object",
    "required": [
      "schemaVersion",
      "dialogues"
    ],
    "properties": {
      "schemaVersion": {
        "const": "1.0.0"
      },
      "dialogues": {
        "type": "array",
        "minItems": 1,
        "maxItems": 10000,
        "items": {
          "$ref": "#/$defs/dialogueLine"
        }
      }
    },
    "additionalProperties": false,
    "$defs": {
      "dialogueLine": {
        "type": "object",
        "required": [
          "id",
          "speakerCharacterId",
          "text",
          "delivery"
        ],
        "properties": {
          "id": {
            "$ref": "common.schema.json#/$defs/identifier"
          },
          "speakerCharacterId": {
            "$ref": "common.schema.json#/$defs/identifier",
            "x-jaokob-reference": "character.id"
          },
          "text": {
            "$ref": "common.schema.json#/$defs/localizedText"
          },
          "delivery": {
            "type": "object",
            "required": [
              "emotion",
              "pace"
            ],
            "properties": {
              "emotion": {
                "type": "string",
                "enum": [
                  "neutral",
                  "warm",
                  "hopeful",
                  "afraid",
                  "grieving",
                  "lonely",
                  "curious",
                  "relieved",
                  "urgent",
                  "tender"
                ]
              },
              "pace": {
                "type": "string",
                "enum": [
                  "slow",
                  "normal",
                  "fast"
                ]
              },
              "portraitAssetId": {
                "$ref": "common.schema.json#/$defs/identifier",
                "x-jaokob-reference": "asset.id"
              },
              "stageDirection": {
                "$ref": "common.schema.json#/$defs/localizedShortText"
              }
            },
            "additionalProperties": false
          },
          "accessibilityDescription": {
            "$ref": "common.schema.json#/$defs/localizedText"
          },
          "tags": {
            "type": "array",
            "maxItems": 24,
            "uniqueItems": true,
            "items": {
              "$ref": "common.schema.json#/$defs/identifier"
            }
          }
        },
        "additionalProperties": false
      }
    }
  },
  "event.schema.json": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://t3thr.github.io/JaoKob/specs/schemas/event.schema.json",
    "title": "JaoKob Event Catalog",
    "description": "ข้อกำหนดเหตุการณ์ เงื่อนไขกระตุ้น และผลลัพธ์แบบกำหนดด้วยข้อมูล",
    "type": "object",
    "required": [
      "schemaVersion",
      "events"
    ],
    "properties": {
      "schemaVersion": {
        "const": "1.0.0"
      },
      "events": {
        "type": "array",
        "maxItems": 5000,
        "items": {
          "$ref": "#/$defs/event"
        }
      }
    },
    "additionalProperties": false,
    "$defs": {
      "event": {
        "type": "object",
        "required": [
          "id",
          "category",
          "title",
          "priority",
          "trigger",
          "conditions",
          "maxOccurrences",
          "resolution"
        ],
        "properties": {
          "id": {
            "$ref": "common.schema.json#/$defs/identifier"
          },
          "category": {
            "type": "string",
            "enum": [
              "story",
              "hazard",
              "recovery",
              "observation",
              "system"
            ]
          },
          "title": {
            "$ref": "common.schema.json#/$defs/localizedShortText"
          },
          "priority": {
            "type": "integer",
            "minimum": -1000,
            "maximum": 1000
          },
          "trigger": {
            "$ref": "#/$defs/trigger"
          },
          "conditions": {
            "$ref": "common.schema.json#/$defs/condition"
          },
          "maxOccurrences": {
            "type": "integer",
            "minimum": 1,
            "maximum": 1000
          },
          "resolution": {
            "type": "object",
            "required": [
              "effects"
            ],
            "properties": {
              "dialogueIds": {
                "type": "array",
                "maxItems": 128,
                "items": {
                  "$ref": "common.schema.json#/$defs/identifier",
                  "x-jaokob-reference": "dialogue.id"
                }
              },
              "effects": {
                "type": "array",
                "maxItems": 64,
                "items": {
                  "$ref": "common.schema.json#/$defs/effect"
                }
              },
              "nextNodeId": {
                "$ref": "common.schema.json#/$defs/identifier",
                "x-jaokob-reference": "narrative-node.id"
              }
            },
            "additionalProperties": false
          },
          "tags": {
            "type": "array",
            "maxItems": 24,
            "uniqueItems": true,
            "items": {
              "$ref": "common.schema.json#/$defs/identifier"
            }
          }
        },
        "additionalProperties": false
      },
      "trigger": {
        "oneOf": [
          {
            "type": "object",
            "required": [
              "type",
              "state"
            ],
            "properties": {
              "type": {
                "const": "state-entered"
              },
              "state": {
                "$ref": "common.schema.json#/$defs/gameState"
              }
            },
            "additionalProperties": false
          },
          {
            "type": "object",
            "required": [
              "type",
              "nodeId"
            ],
            "properties": {
              "type": {
                "const": "node-entered"
              },
              "nodeId": {
                "$ref": "common.schema.json#/$defs/identifier",
                "x-jaokob-reference": "narrative-node.id"
              }
            },
            "additionalProperties": false
          },
          {
            "type": "object",
            "required": [
              "type",
              "choiceId"
            ],
            "properties": {
              "type": {
                "const": "choice-committed"
              },
              "choiceId": {
                "$ref": "common.schema.json#/$defs/identifier",
                "x-jaokob-reference": "choice.id"
              }
            },
            "additionalProperties": false
          },
          {
            "type": "object",
            "required": [
              "type",
              "metric",
              "operator",
              "value"
            ],
            "properties": {
              "type": {
                "const": "metric-threshold"
              },
              "metric": {
                "$ref": "common.schema.json#/$defs/metricName"
              },
              "operator": {
                "type": "string",
                "enum": [
                  "eq",
                  "gt",
                  "gte",
                  "lt",
                  "lte"
                ]
              },
              "value": {
                "type": "integer",
                "minimum": 0,
                "maximum": 100
              }
            },
            "additionalProperties": false
          },
          {
            "type": "object",
            "required": [
              "type",
              "flagId"
            ],
            "properties": {
              "type": {
                "const": "flag-changed"
              },
              "flagId": {
                "$ref": "common.schema.json#/$defs/identifier",
                "x-jaokob-reference": "flag.id"
              }
            },
            "additionalProperties": false
          }
        ]
      }
    }
  },
  "narrative-tree.schema.json": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://t3thr.github.io/JaoKob/specs/schemas/narrative-tree.schema.json",
    "title": "JaoKob Narrative Tree",
    "description": "กราฟเรื่องเล่าห้าองก์แบบกำหนดด้วยข้อมูล พร้อมทางเลือก เงื่อนไข และผลลัพธ์",
    "type": "object",
    "required": [
      "schemaVersion",
      "treeId",
      "title",
      "description",
      "entryNodeId",
      "nodes"
    ],
    "properties": {
      "schemaVersion": {
        "const": "1.0.0"
      },
      "treeId": {
        "$ref": "common.schema.json#/$defs/identifier"
      },
      "title": {
        "$ref": "common.schema.json#/$defs/localizedShortText"
      },
      "description": {
        "$ref": "common.schema.json#/$defs/localizedText"
      },
      "entryNodeId": {
        "$ref": "common.schema.json#/$defs/identifier",
        "x-jaokob-reference": "narrative-node.id"
      },
      "nodes": {
        "type": "array",
        "minItems": 1,
        "maxItems": 10000,
        "items": {
          "$ref": "#/$defs/node"
        }
      }
    },
    "additionalProperties": false,
    "$defs": {
      "effects": {
        "type": "array",
        "maxItems": 64,
        "items": {
          "$ref": "common.schema.json#/$defs/effect"
        }
      },
      "dialogueIds": {
        "type": "array",
        "minItems": 1,
        "maxItems": 256,
        "items": {
          "$ref": "common.schema.json#/$defs/identifier",
          "x-jaokob-reference": "dialogue.id"
        }
      },
      "contentWarningIds": {
        "type": "array",
        "maxItems": 32,
        "uniqueItems": true,
        "items": {
          "$ref": "common.schema.json#/$defs/identifier",
          "x-jaokob-reference": "content-warning.id"
        }
      },
      "testReferenceIds": {
        "type": "array",
        "minItems": 1,
        "maxItems": 64,
        "uniqueItems": true,
        "items": {
          "$ref": "common.schema.json#/$defs/identifier",
          "x-jaokob-reference": "test-case.id"
        }
      },
      "checkpointPolicy": {
        "type": "string",
        "enum": [
          "none",
          "before-node",
          "after-node"
        ]
      },
      "interaction": {
        "type": "object",
        "required": [
          "id",
          "label",
          "condition",
          "unavailableBehavior",
          "impact",
          "effects",
          "immediateFeedback",
          "nextNodeId"
        ],
        "properties": {
          "id": {
            "$ref": "common.schema.json#/$defs/identifier"
          },
          "label": {
            "$ref": "common.schema.json#/$defs/localizedShortText"
          },
          "condition": {
            "$ref": "common.schema.json#/$defs/condition"
          },
          "unavailableBehavior": {
            "type": "string",
            "enum": [
              "hidden",
              "disabled"
            ]
          },
          "impact": {
            "type": "string",
            "enum": [
              "standard",
              "high",
              "irreversible"
            ]
          },
          "disabledReason": {
            "$ref": "common.schema.json#/$defs/localizedShortText"
          },
          "effects": {
            "$ref": "#/$defs/effects"
          },
          "immediateFeedback": {
            "$ref": "common.schema.json#/$defs/localizedText"
          },
          "nextNodeId": {
            "$ref": "common.schema.json#/$defs/identifier",
            "x-jaokob-reference": "narrative-node.id"
          }
        },
        "additionalProperties": false
      },
      "choice": {
        "type": "object",
        "required": [
          "id",
          "label",
          "condition",
          "unavailableBehavior",
          "impact",
          "effects",
          "immediateFeedback",
          "nextNodeId"
        ],
        "properties": {
          "id": {
            "$ref": "common.schema.json#/$defs/identifier"
          },
          "label": {
            "$ref": "common.schema.json#/$defs/localizedShortText"
          },
          "condition": {
            "$ref": "common.schema.json#/$defs/condition"
          },
          "unavailableBehavior": {
            "type": "string",
            "enum": [
              "hidden",
              "disabled"
            ]
          },
          "impact": {
            "type": "string",
            "enum": [
              "standard",
              "high",
              "irreversible"
            ]
          },
          "disabledReason": {
            "$ref": "common.schema.json#/$defs/localizedShortText"
          },
          "effects": {
            "$ref": "#/$defs/effects"
          },
          "immediateFeedback": {
            "$ref": "common.schema.json#/$defs/localizedText"
          },
          "nextNodeId": {
            "$ref": "common.schema.json#/$defs/identifier",
            "x-jaokob-reference": "narrative-node.id"
          },
          "outcomePreview": {
            "$ref": "common.schema.json#/$defs/localizedShortText"
          },
          "callbackEventIds": {
            "type": "array",
            "maxItems": 32,
            "uniqueItems": true,
            "items": {
              "$ref": "common.schema.json#/$defs/identifier",
              "x-jaokob-reference": "event.id"
            }
          }
        },
        "additionalProperties": false
      },
      "node": {
        "oneOf": [
          {
            "$ref": "#/$defs/cutsceneNode"
          },
          {
            "$ref": "#/$defs/explorationNode"
          },
          {
            "$ref": "#/$defs/decisionNode"
          },
          {
            "$ref": "#/$defs/gameOverNode"
          },
          {
            "$ref": "#/$defs/endingNode"
          }
        ]
      },
      "cutsceneNode": {
        "type": "object",
        "required": [
          "id",
          "type",
          "act",
          "title",
          "entryCondition",
          "contentWarningIds",
          "checkpointPolicy",
          "testReferenceIds",
          "dialogueIds",
          "onEnterEffects",
          "nextNodeId"
        ],
        "properties": {
          "id": {
            "$ref": "common.schema.json#/$defs/identifier"
          },
          "type": {
            "const": "cutscene"
          },
          "act": {
            "type": "integer",
            "minimum": 1,
            "maximum": 5
          },
          "title": {
            "$ref": "common.schema.json#/$defs/localizedShortText"
          },
          "entryCondition": {
            "$ref": "common.schema.json#/$defs/condition"
          },
          "contentWarningIds": {
            "$ref": "#/$defs/contentWarningIds"
          },
          "checkpointPolicy": {
            "$ref": "#/$defs/checkpointPolicy"
          },
          "testReferenceIds": {
            "$ref": "#/$defs/testReferenceIds"
          },
          "dialogueIds": {
            "$ref": "#/$defs/dialogueIds"
          },
          "onEnterEffects": {
            "$ref": "#/$defs/effects"
          },
          "checkpointId": {
            "$ref": "common.schema.json#/$defs/identifier"
          },
          "nextNodeId": {
            "$ref": "common.schema.json#/$defs/identifier",
            "x-jaokob-reference": "narrative-node.id"
          }
        },
        "additionalProperties": false
      },
      "explorationNode": {
        "type": "object",
        "required": [
          "id",
          "type",
          "act",
          "title",
          "entryCondition",
          "contentWarningIds",
          "checkpointPolicy",
          "testReferenceIds",
          "description",
          "onEnterEffects",
          "interactions"
        ],
        "properties": {
          "id": {
            "$ref": "common.schema.json#/$defs/identifier"
          },
          "type": {
            "const": "exploration"
          },
          "act": {
            "type": "integer",
            "minimum": 1,
            "maximum": 5
          },
          "title": {
            "$ref": "common.schema.json#/$defs/localizedShortText"
          },
          "entryCondition": {
            "$ref": "common.schema.json#/$defs/condition"
          },
          "contentWarningIds": {
            "$ref": "#/$defs/contentWarningIds"
          },
          "checkpointPolicy": {
            "$ref": "#/$defs/checkpointPolicy"
          },
          "testReferenceIds": {
            "$ref": "#/$defs/testReferenceIds"
          },
          "description": {
            "$ref": "common.schema.json#/$defs/localizedText"
          },
          "backgroundAssetId": {
            "$ref": "common.schema.json#/$defs/identifier",
            "x-jaokob-reference": "asset.id"
          },
          "onEnterEffects": {
            "$ref": "#/$defs/effects"
          },
          "checkpointId": {
            "$ref": "common.schema.json#/$defs/identifier"
          },
          "interactions": {
            "type": "array",
            "minItems": 1,
            "maxItems": 32,
            "items": {
              "$ref": "#/$defs/interaction"
            }
          }
        },
        "additionalProperties": false
      },
      "decisionNode": {
        "type": "object",
        "required": [
          "id",
          "type",
          "act",
          "title",
          "entryCondition",
          "contentWarningIds",
          "checkpointPolicy",
          "testReferenceIds",
          "prompt",
          "onEnterEffects",
          "choices"
        ],
        "properties": {
          "id": {
            "$ref": "common.schema.json#/$defs/identifier"
          },
          "type": {
            "const": "decision"
          },
          "act": {
            "type": "integer",
            "minimum": 1,
            "maximum": 5
          },
          "title": {
            "$ref": "common.schema.json#/$defs/localizedShortText"
          },
          "entryCondition": {
            "$ref": "common.schema.json#/$defs/condition"
          },
          "contentWarningIds": {
            "$ref": "#/$defs/contentWarningIds"
          },
          "checkpointPolicy": {
            "$ref": "#/$defs/checkpointPolicy"
          },
          "testReferenceIds": {
            "$ref": "#/$defs/testReferenceIds"
          },
          "prompt": {
            "$ref": "common.schema.json#/$defs/localizedText"
          },
          "onEnterEffects": {
            "$ref": "#/$defs/effects"
          },
          "checkpointId": {
            "$ref": "common.schema.json#/$defs/identifier"
          },
          "choices": {
            "type": "array",
            "minItems": 2,
            "maxItems": 12,
            "items": {
              "$ref": "#/$defs/choice"
            }
          }
        },
        "additionalProperties": false
      },
      "gameOverNode": {
        "type": "object",
        "required": [
          "id",
          "type",
          "act",
          "title",
          "entryCondition",
          "contentWarningIds",
          "checkpointPolicy",
          "testReferenceIds",
          "summary",
          "onEnterEffects",
          "retryNodeId"
        ],
        "properties": {
          "id": {
            "$ref": "common.schema.json#/$defs/identifier"
          },
          "type": {
            "const": "game-over"
          },
          "act": {
            "type": "integer",
            "minimum": 1,
            "maximum": 5
          },
          "title": {
            "$ref": "common.schema.json#/$defs/localizedShortText"
          },
          "entryCondition": {
            "$ref": "common.schema.json#/$defs/condition"
          },
          "contentWarningIds": {
            "$ref": "#/$defs/contentWarningIds"
          },
          "checkpointPolicy": {
            "$ref": "#/$defs/checkpointPolicy"
          },
          "testReferenceIds": {
            "$ref": "#/$defs/testReferenceIds"
          },
          "summary": {
            "$ref": "common.schema.json#/$defs/localizedText"
          },
          "onEnterEffects": {
            "$ref": "#/$defs/effects"
          },
          "retryNodeId": {
            "$ref": "common.schema.json#/$defs/identifier",
            "x-jaokob-reference": "narrative-node.id"
          }
        },
        "additionalProperties": false
      },
      "endingNode": {
        "type": "object",
        "required": [
          "id",
          "type",
          "act",
          "endingId",
          "title",
          "entryCondition",
          "contentWarningIds",
          "checkpointPolicy",
          "testReferenceIds",
          "summary",
          "dialogueIds",
          "onEnterEffects"
        ],
        "properties": {
          "id": {
            "$ref": "common.schema.json#/$defs/identifier"
          },
          "type": {
            "const": "ending"
          },
          "act": {
            "const": 5
          },
          "endingId": {
            "$ref": "common.schema.json#/$defs/identifier"
          },
          "title": {
            "$ref": "common.schema.json#/$defs/localizedShortText"
          },
          "entryCondition": {
            "$ref": "common.schema.json#/$defs/condition"
          },
          "contentWarningIds": {
            "$ref": "#/$defs/contentWarningIds"
          },
          "checkpointPolicy": {
            "$ref": "#/$defs/checkpointPolicy"
          },
          "testReferenceIds": {
            "$ref": "#/$defs/testReferenceIds"
          },
          "summary": {
            "$ref": "common.schema.json#/$defs/localizedText"
          },
          "dialogueIds": {
            "$ref": "#/$defs/dialogueIds"
          },
          "onEnterEffects": {
            "$ref": "#/$defs/effects"
          }
        },
        "additionalProperties": false
      }
    }
  },
  "v1.1.0/content-package.schema.json": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://t3thr.github.io/JaoKob/specs/schemas/v1.1.0/content-package.schema.json",
    "title": "JaoKob Content Package",
    "description": "หน่วยเผยแพร่เนื้อหาที่รวมรายการตัวละคร บทสนทนา เหตุการณ์ กราฟเรื่องเล่า สินทรัพย์ และค่าตั้งต้น",
    "type": "object",
    "required": [
      "schemaVersion",
      "contentVersion",
      "defaultLocale",
      "supportedLocales",
      "entryTreeId",
      "gameDefaults",
      "flagDefinitions",
      "contentWarnings",
      "assets",
      "characters",
      "dialogues",
      "events",
      "narrativeTrees"
    ],
    "properties": {
      "schemaVersion": {
        "const": "1.1.0"
      },
      "contentVersion": {
        "$ref": "../common.schema.json#/$defs/semanticVersion"
      },
      "defaultLocale": {
        "const": "th"
      },
      "supportedLocales": {
        "type": "array",
        "minItems": 1,
        "maxItems": 32,
        "uniqueItems": true,
        "contains": {
          "const": "th"
        },
        "items": {
          "$ref": "../common.schema.json#/$defs/localeTag"
        }
      },
      "entryTreeId": {
        "$ref": "../common.schema.json#/$defs/identifier",
        "x-jaokob-reference": "narrative-tree.treeId"
      },
      "gameDefaults": {
        "type": "object",
        "required": [
          "metrics",
          "settings"
        ],
        "properties": {
          "metrics": {
            "$ref": "../common.schema.json#/$defs/metricSnapshot"
          },
          "settings": {
            "$ref": "../common.schema.json#/$defs/settings"
          }
        },
        "additionalProperties": false
      },
      "flagDefinitions": {
        "type": "array",
        "maxItems": 5000,
        "items": {
          "$ref": "#/$defs/flagDefinition"
        }
      },
      "contentWarnings": {
        "type": "array",
        "maxItems": 256,
        "items": {
          "$ref": "#/$defs/contentWarning"
        }
      },
      "assets": {
        "type": "array",
        "maxItems": 10000,
        "items": {
          "$ref": "#/$defs/asset"
        }
      },
      "characters": {
        "$ref": "../character.schema.json"
      },
      "dialogues": {
        "$ref": "../dialogue.schema.json"
      },
      "events": {
        "$ref": "../event.schema.json"
      },
      "narrativeTrees": {
        "type": "array",
        "minItems": 1,
        "maxItems": 128,
        "items": {
          "$ref": "narrative-tree.schema.json"
        }
      }
    },
    "additionalProperties": false,
    "$defs": {
      "flagDefinition": {
        "type": "object",
        "required": [
          "id",
          "valueType",
          "defaultValue",
          "description",
          "policy"
        ],
        "properties": {
          "id": {
            "$ref": "../common.schema.json#/$defs/identifier"
          },
          "valueType": {
            "type": "string",
            "enum": [
              "boolean",
              "integer",
              "string"
            ]
          },
          "defaultValue": {
            "$ref": "../common.schema.json#/$defs/flagValue"
          },
          "description": {
            "$ref": "../common.schema.json#/$defs/localizedText"
          },
          "policy": {
            "$ref": "#/$defs/flagPolicy"
          }
        },
        "additionalProperties": false
      },
      "contentWarning": {
        "type": "object",
        "required": [
          "id",
          "title",
          "detail",
          "intensity"
        ],
        "properties": {
          "id": {
            "$ref": "../common.schema.json#/$defs/identifier"
          },
          "title": {
            "$ref": "../common.schema.json#/$defs/localizedShortText"
          },
          "detail": {
            "$ref": "../common.schema.json#/$defs/localizedText"
          },
          "intensity": {
            "type": "string",
            "enum": [
              "mild",
              "moderate",
              "strong"
            ]
          }
        },
        "additionalProperties": false
      },
      "asset": {
        "type": "object",
        "required": [
          "id",
          "type",
          "path",
          "rights"
        ],
        "properties": {
          "id": {
            "$ref": "../common.schema.json#/$defs/identifier"
          },
          "type": {
            "type": "string",
            "enum": [
              "image",
              "audio",
              "font"
            ]
          },
          "path": {
            "type": "string",
            "minLength": 1,
            "maxLength": 512,
            "pattern": "^(?![A-Za-z][A-Za-z0-9+.-]*:)(?!/)(?!.*(?:^|/)\\.\\.(?:/|$))[A-Za-z0-9_./-]+$"
          },
          "alt": {
            "$ref": "../common.schema.json#/$defs/localizedShortText"
          },
          "rights": {
            "type": "object",
            "required": [
              "origin",
              "licenseId"
            ],
            "properties": {
              "origin": {
                "type": "string",
                "enum": [
                  "original",
                  "commissioned",
                  "licensed",
                  "public-domain"
                ]
              },
              "licenseId": {
                "type": "string",
                "minLength": 1,
                "maxLength": 120
              },
              "sourceUrl": {
                "type": "string",
                "format": "uri",
                "maxLength": 2048
              },
              "attribution": {
                "$ref": "../common.schema.json#/$defs/localizedShortText"
              }
            },
            "additionalProperties": false
          }
        },
        "allOf": [
          {
            "if": {
              "properties": {
                "type": {
                  "const": "image"
                }
              },
              "required": [
                "type"
              ]
            },
            "then": {
              "properties": {
                "alt": true
              },
              "required": [
                "alt"
              ]
            }
          }
        ],
        "additionalProperties": false
      },
      "flagPolicy": {
        "oneOf": [
          {
            "type": "object",
            "required": [
              "kind",
              "reversible"
            ],
            "properties": {
              "kind": {
                "const": "boolean"
              },
              "reversible": {
                "type": "boolean"
              }
            },
            "additionalProperties": false
          },
          {
            "type": "object",
            "required": [
              "kind",
              "reversible"
            ],
            "properties": {
              "kind": {
                "const": "marker"
              },
              "reversible": {
                "const": false
              }
            },
            "additionalProperties": false
          },
          {
            "type": "object",
            "required": [
              "kind",
              "values",
              "reversible"
            ],
            "properties": {
              "kind": {
                "const": "enum"
              },
              "values": {
                "type": "array",
                "minItems": 1,
                "maxItems": 64,
                "uniqueItems": true,
                "items": {
                  "type": "string",
                  "maxLength": 240
                }
              },
              "reversible": {
                "type": "boolean"
              }
            },
            "additionalProperties": false
          },
          {
            "type": "object",
            "required": [
              "kind",
              "min",
              "max",
              "overflow",
              "monotonic",
              "reversible"
            ],
            "properties": {
              "kind": {
                "const": "counter"
              },
              "min": {
                "type": "integer",
                "minimum": -1000000,
                "maximum": 1000000
              },
              "max": {
                "type": "integer",
                "minimum": -1000000,
                "maximum": 1000000
              },
              "overflow": {
                "enum": [
                  "saturate",
                  "reject"
                ]
              },
              "monotonic": {
                "type": "boolean"
              },
              "reversible": {
                "type": "boolean"
              }
            },
            "additionalProperties": false
          }
        ]
      }
    }
  },
  "v1.1.0/narrative-tree.schema.json": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://t3thr.github.io/JaoKob/specs/schemas/v1.1.0/narrative-tree.schema.json",
    "title": "JaoKob Narrative Tree",
    "description": "กราฟเรื่องเล่าห้าองก์แบบกำหนดด้วยข้อมูล พร้อมทางเลือก เงื่อนไข และผลลัพธ์",
    "type": "object",
    "required": [
      "schemaVersion",
      "treeId",
      "title",
      "description",
      "entryNodeId",
      "nodes"
    ],
    "properties": {
      "schemaVersion": {
        "const": "1.1.0"
      },
      "treeId": {
        "$ref": "../common.schema.json#/$defs/identifier"
      },
      "title": {
        "$ref": "../common.schema.json#/$defs/localizedShortText"
      },
      "description": {
        "$ref": "../common.schema.json#/$defs/localizedText"
      },
      "entryNodeId": {
        "$ref": "../common.schema.json#/$defs/identifier",
        "x-jaokob-reference": "narrative-node.id"
      },
      "nodes": {
        "type": "array",
        "minItems": 1,
        "maxItems": 10000,
        "items": {
          "$ref": "#/$defs/node"
        }
      }
    },
    "additionalProperties": false,
    "$defs": {
      "effects": {
        "type": "array",
        "maxItems": 64,
        "items": {
          "$ref": "../common.schema.json#/$defs/effect"
        }
      },
      "dialogueIds": {
        "type": "array",
        "minItems": 1,
        "maxItems": 256,
        "items": {
          "$ref": "../common.schema.json#/$defs/identifier",
          "x-jaokob-reference": "dialogue.id"
        }
      },
      "contentWarningIds": {
        "type": "array",
        "maxItems": 32,
        "uniqueItems": true,
        "items": {
          "$ref": "../common.schema.json#/$defs/identifier",
          "x-jaokob-reference": "content-warning.id"
        }
      },
      "testReferenceIds": {
        "type": "array",
        "minItems": 1,
        "maxItems": 64,
        "uniqueItems": true,
        "items": {
          "$ref": "../common.schema.json#/$defs/identifier",
          "x-jaokob-reference": "test-case.id"
        }
      },
      "checkpointPolicy": {
        "type": "string",
        "enum": [
          "none",
          "before-node",
          "after-node"
        ]
      },
      "interaction": {
        "type": "object",
        "required": [
          "id",
          "label",
          "condition",
          "unavailableBehavior",
          "impact",
          "effects",
          "immediateFeedback",
          "nextNodeId"
        ],
        "properties": {
          "id": {
            "$ref": "../common.schema.json#/$defs/identifier"
          },
          "label": {
            "$ref": "../common.schema.json#/$defs/localizedShortText"
          },
          "condition": {
            "$ref": "../common.schema.json#/$defs/condition"
          },
          "unavailableBehavior": {
            "type": "string",
            "enum": [
              "hidden",
              "disabled"
            ]
          },
          "impact": {
            "type": "string",
            "enum": [
              "standard",
              "high",
              "irreversible"
            ]
          },
          "disabledReason": {
            "$ref": "../common.schema.json#/$defs/localizedShortText"
          },
          "effects": {
            "$ref": "#/$defs/effects"
          },
          "immediateFeedback": {
            "$ref": "../common.schema.json#/$defs/localizedText"
          },
          "nextNodeId": {
            "$ref": "../common.schema.json#/$defs/identifier",
            "x-jaokob-reference": "narrative-node.id"
          }
        },
        "additionalProperties": false
      },
      "choice": {
        "type": "object",
        "required": [
          "id",
          "label",
          "condition",
          "unavailableBehavior",
          "impact",
          "effects",
          "immediateFeedback",
          "nextNodeId"
        ],
        "properties": {
          "id": {
            "$ref": "../common.schema.json#/$defs/identifier"
          },
          "label": {
            "$ref": "../common.schema.json#/$defs/localizedShortText"
          },
          "condition": {
            "$ref": "../common.schema.json#/$defs/condition"
          },
          "unavailableBehavior": {
            "type": "string",
            "enum": [
              "hidden",
              "disabled"
            ]
          },
          "impact": {
            "type": "string",
            "enum": [
              "standard",
              "high",
              "irreversible"
            ]
          },
          "disabledReason": {
            "$ref": "../common.schema.json#/$defs/localizedShortText"
          },
          "effects": {
            "$ref": "#/$defs/effects"
          },
          "immediateFeedback": {
            "$ref": "../common.schema.json#/$defs/localizedText"
          },
          "nextNodeId": {
            "$ref": "../common.schema.json#/$defs/identifier",
            "x-jaokob-reference": "narrative-node.id"
          },
          "outcomePreview": {
            "$ref": "../common.schema.json#/$defs/localizedShortText"
          },
          "callbackEventIds": {
            "type": "array",
            "maxItems": 32,
            "uniqueItems": true,
            "items": {
              "$ref": "../common.schema.json#/$defs/identifier",
              "x-jaokob-reference": "event.id"
            }
          }
        },
        "additionalProperties": false
      },
      "node": {
        "oneOf": [
          {
            "$ref": "#/$defs/cutsceneNode"
          },
          {
            "$ref": "#/$defs/explorationNode"
          },
          {
            "$ref": "#/$defs/decisionNode"
          },
          {
            "$ref": "#/$defs/gameOverNode"
          },
          {
            "$ref": "#/$defs/endingNode"
          }
        ]
      },
      "cutsceneNode": {
        "type": "object",
        "required": [
          "id",
          "type",
          "act",
          "title",
          "entryCondition",
          "contentWarningIds",
          "checkpointPolicy",
          "testReferenceIds",
          "dialogueIds",
          "onEnterEffects"
        ],
        "properties": {
          "id": {
            "$ref": "../common.schema.json#/$defs/identifier"
          },
          "type": {
            "const": "cutscene"
          },
          "act": {
            "type": "integer",
            "minimum": 1,
            "maximum": 5
          },
          "title": {
            "$ref": "../common.schema.json#/$defs/localizedShortText"
          },
          "entryCondition": {
            "$ref": "../common.schema.json#/$defs/condition"
          },
          "contentWarningIds": {
            "$ref": "#/$defs/contentWarningIds"
          },
          "checkpointPolicy": {
            "$ref": "#/$defs/checkpointPolicy"
          },
          "testReferenceIds": {
            "$ref": "#/$defs/testReferenceIds"
          },
          "dialogueIds": {
            "$ref": "#/$defs/dialogueIds"
          },
          "onEnterEffects": {
            "$ref": "#/$defs/effects"
          },
          "checkpointId": {
            "$ref": "../common.schema.json#/$defs/identifier"
          },
          "nextNodeId": {
            "$ref": "../common.schema.json#/$defs/identifier",
            "x-jaokob-reference": "narrative-node.id"
          },
          "completion": {
            "type": "object",
            "required": [
              "kind",
              "flagId",
              "message",
              "actionLabel"
            ],
            "properties": {
              "kind": {
                "const": "act-rest"
              },
              "flagId": {
                "$ref": "../common.schema.json#/$defs/identifier",
                "x-jaokob-reference": "flag.id"
              },
              "message": {
                "$ref": "../common.schema.json#/$defs/localizedText"
              },
              "actionLabel": {
                "$ref": "../common.schema.json#/$defs/localizedShortText"
              }
            },
            "additionalProperties": false
          }
        },
        "additionalProperties": false,
        "oneOf": [
          {
            "required": [
              "nextNodeId"
            ],
            "not": {
              "required": [
                "completion"
              ]
            }
          },
          {
            "required": [
              "completion",
              "checkpointId"
            ],
            "not": {
              "required": [
                "nextNodeId"
              ]
            },
            "properties": {
              "act": {
                "const": 1
              },
              "checkpointPolicy": {
                "const": "after-node"
              }
            }
          }
        ]
      },
      "explorationNode": {
        "type": "object",
        "required": [
          "id",
          "type",
          "act",
          "title",
          "entryCondition",
          "contentWarningIds",
          "checkpointPolicy",
          "testReferenceIds",
          "description",
          "onEnterEffects",
          "interactions"
        ],
        "properties": {
          "id": {
            "$ref": "../common.schema.json#/$defs/identifier"
          },
          "type": {
            "const": "exploration"
          },
          "act": {
            "type": "integer",
            "minimum": 1,
            "maximum": 5
          },
          "title": {
            "$ref": "../common.schema.json#/$defs/localizedShortText"
          },
          "entryCondition": {
            "$ref": "../common.schema.json#/$defs/condition"
          },
          "contentWarningIds": {
            "$ref": "#/$defs/contentWarningIds"
          },
          "checkpointPolicy": {
            "$ref": "#/$defs/checkpointPolicy"
          },
          "testReferenceIds": {
            "$ref": "#/$defs/testReferenceIds"
          },
          "description": {
            "$ref": "../common.schema.json#/$defs/localizedText"
          },
          "backgroundAssetId": {
            "$ref": "../common.schema.json#/$defs/identifier",
            "x-jaokob-reference": "asset.id"
          },
          "onEnterEffects": {
            "$ref": "#/$defs/effects"
          },
          "checkpointId": {
            "$ref": "../common.schema.json#/$defs/identifier"
          },
          "interactions": {
            "type": "array",
            "minItems": 1,
            "maxItems": 32,
            "items": {
              "$ref": "#/$defs/interaction"
            }
          }
        },
        "additionalProperties": false
      },
      "decisionNode": {
        "type": "object",
        "required": [
          "id",
          "type",
          "act",
          "title",
          "entryCondition",
          "contentWarningIds",
          "checkpointPolicy",
          "testReferenceIds",
          "prompt",
          "onEnterEffects",
          "choices"
        ],
        "properties": {
          "id": {
            "$ref": "../common.schema.json#/$defs/identifier"
          },
          "type": {
            "const": "decision"
          },
          "act": {
            "type": "integer",
            "minimum": 1,
            "maximum": 5
          },
          "title": {
            "$ref": "../common.schema.json#/$defs/localizedShortText"
          },
          "entryCondition": {
            "$ref": "../common.schema.json#/$defs/condition"
          },
          "contentWarningIds": {
            "$ref": "#/$defs/contentWarningIds"
          },
          "checkpointPolicy": {
            "$ref": "#/$defs/checkpointPolicy"
          },
          "testReferenceIds": {
            "$ref": "#/$defs/testReferenceIds"
          },
          "prompt": {
            "$ref": "../common.schema.json#/$defs/localizedText"
          },
          "onEnterEffects": {
            "$ref": "#/$defs/effects"
          },
          "checkpointId": {
            "$ref": "../common.schema.json#/$defs/identifier"
          },
          "choices": {
            "type": "array",
            "minItems": 2,
            "maxItems": 12,
            "items": {
              "$ref": "#/$defs/choice"
            }
          }
        },
        "additionalProperties": false
      },
      "gameOverNode": {
        "type": "object",
        "required": [
          "id",
          "type",
          "act",
          "title",
          "entryCondition",
          "contentWarningIds",
          "checkpointPolicy",
          "testReferenceIds",
          "summary",
          "onEnterEffects",
          "retryNodeId"
        ],
        "properties": {
          "id": {
            "$ref": "../common.schema.json#/$defs/identifier"
          },
          "type": {
            "const": "game-over"
          },
          "act": {
            "type": "integer",
            "minimum": 1,
            "maximum": 5
          },
          "title": {
            "$ref": "../common.schema.json#/$defs/localizedShortText"
          },
          "entryCondition": {
            "$ref": "../common.schema.json#/$defs/condition"
          },
          "contentWarningIds": {
            "$ref": "#/$defs/contentWarningIds"
          },
          "checkpointPolicy": {
            "$ref": "#/$defs/checkpointPolicy"
          },
          "testReferenceIds": {
            "$ref": "#/$defs/testReferenceIds"
          },
          "summary": {
            "$ref": "../common.schema.json#/$defs/localizedText"
          },
          "onEnterEffects": {
            "$ref": "#/$defs/effects"
          },
          "retryNodeId": {
            "$ref": "../common.schema.json#/$defs/identifier",
            "x-jaokob-reference": "narrative-node.id"
          }
        },
        "additionalProperties": false
      },
      "endingNode": {
        "type": "object",
        "required": [
          "id",
          "type",
          "act",
          "endingId",
          "title",
          "entryCondition",
          "contentWarningIds",
          "checkpointPolicy",
          "testReferenceIds",
          "summary",
          "dialogueIds",
          "onEnterEffects"
        ],
        "properties": {
          "id": {
            "$ref": "../common.schema.json#/$defs/identifier"
          },
          "type": {
            "const": "ending"
          },
          "act": {
            "const": 5
          },
          "endingId": {
            "$ref": "../common.schema.json#/$defs/identifier"
          },
          "title": {
            "$ref": "../common.schema.json#/$defs/localizedShortText"
          },
          "entryCondition": {
            "$ref": "../common.schema.json#/$defs/condition"
          },
          "contentWarningIds": {
            "$ref": "#/$defs/contentWarningIds"
          },
          "checkpointPolicy": {
            "$ref": "#/$defs/checkpointPolicy"
          },
          "testReferenceIds": {
            "$ref": "#/$defs/testReferenceIds"
          },
          "summary": {
            "$ref": "../common.schema.json#/$defs/localizedText"
          },
          "dialogueIds": {
            "$ref": "#/$defs/dialogueIds"
          },
          "onEnterEffects": {
            "$ref": "#/$defs/effects"
          }
        },
        "additionalProperties": false
      }
    }
  }
});
