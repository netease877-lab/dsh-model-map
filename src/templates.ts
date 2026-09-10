/**
 * Official-model capability resolution for mappings.
 *
 * The capability facts always come from the running dsh's own official
 * catalog, resolved host-side; there is no hardcoded model table anywhere.
 */

/** How the mapped endpoint expects the reasoning parameters spelled. */
export type ThinkingStyle = 'deepseek' | 'openai'

/** One official model's capability facts, resolved from the live dsh catalog. */
export interface OfficialCapability {
  /** Official display name. */
  label: string
  /** Request modalities the official entry admits. */
  input: readonly ('text' | 'image')[]
  /** Offered reasoning levels and their wire spellings. */
  efforts: Readonly<Record<string, string | null>>
}

/** DeepSeek official dialect: `thinking:{type}` plus `reasoning_effort`. */
const COMPAT_DEEPSEEK = {
  supportsStore: false,
  supportsDeveloperRole: false,
  maxTokensField: 'max_tokens',
  requiresReasoningContentOnAssistantMessages: true,
  thinkingFormat: 'deepseek',
} as const

/** Plain OpenAI dialect: `reasoning_effort` alone. */
const COMPAT_OPENAI = {
  supportsStore: false,
  supportsDeveloperRole: false,
  supportsReasoningEffort: true,
  maxTokensField: 'max_tokens',
  thinkingFormat: 'openai',
} as const

/**
 * The capability fields one mapping stamps onto a `llm-pi-ai` model entry.
 * `name`/`input`/`reasoningEfforts`/`compat` are exactly the fields the pi-ai
 * resolution folds into the materialized model, so the mapped id speaks the
 * official entry's wire dialect and admits its modalities.
 */
export interface MappedEntryFields {
  name: string
  input: readonly ('text' | 'image')[]
  reasoningEfforts: Readonly<Record<string, string | null>>
  compat: Readonly<Record<string, unknown>>
}

/** Build the capability fields for one mapping against its resolved official model. */
export function mappedEntryFields(
  target: string,
  style: ThinkingStyle,
  caps: OfficialCapability,
): MappedEntryFields {
  const compat = style === 'openai' ? COMPAT_OPENAI : COMPAT_DEEPSEEK
  return {
    name: caps.label,
    input: [...caps.input],
    reasoningEfforts: { ...caps.efforts },
    compat: { ...compat },
  }
}

/** The capability keys a mapping owns on an existing entry. */
const CAPABILITY_KEYS = ['name', 'input', 'reasoningEfforts', 'compat'] as const

/**
 * Whether one `models` entry's capability fields are byte-identical to what
 * the mapping would stamp. Removal uses this so a hand-edited entry is never
 * withdrawn by deleting a mapping.
 */
export function entryMatchesTemplate(
  entry: Record<string, unknown>,
  target: string,
  style: ThinkingStyle,
  caps: OfficialCapability,
): boolean {
  const fields = mappedEntryFields(target, style, caps)
  return CAPABILITY_KEYS.every((key) => {
    return JSON.stringify(entry[key]) === JSON.stringify(fields[key as keyof MappedEntryFields])
  })
}

/**
 * Stamp the mapping's capability fields over an existing entry, keeping the
 * capacities and any other fields the user configured themselves.
 */
export function stampCapabilities(
  entry: Record<string, unknown>,
  target: string,
  style: ThinkingStyle,
  caps: OfficialCapability,
): Record<string, unknown> {
  return { ...entry, ...mappedEntryFields(target, style, caps) }
}
