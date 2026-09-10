/**
 * dsh-model-map — host half.
 *
 * Registers the `model-map` settings namespace (the mapping table edited from
 * the web settings page) and translates every change into capability stamps on
 * the corresponding `llm-pi-ai` provider profiles: each mapped third-party
 * model id gains the official DeepSeek entry's input modalities, reasoning
 * effort levels, and wire compat. The actual request still goes to the
 * third-party endpoint — only the capability declaration moves.
 *
 * Capability facts always resolve from the running dsh's own official catalog
 * (`deepseek-official`); the browser's picker reads the same catalog through
 * the standard session modelCatalog RPC, so no model list is ever hardcoded
 * here.
 */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-llm'
import type {} from '@deepseek-ai/dsh-settings'
import z from '@deepseek-ai/schemastery'
import {
  entryMatchesTemplate,
  mappedEntryFields,
  stampCapabilities,
  type OfficialCapability,
  type ThinkingStyle,
} from './templates.ts'

/** Stable Cordis plugin name. */
export const name = 'dsh-model-map'

/** Settings namespace the browser page edits; the join key for both halves. */
export const MODEL_MAP_NS = 'model-map'

/** The settings namespace owned by the llm-pi-ai plugin. */
const PI_AI_NS = 'llm-pi-ai'

/** The provider route whose catalog defines the mapping targets. */
const OFFICIAL_PROVIDER = 'deepseek-official'

/** One mapping row: a third-party model id onto an official model. */
export interface ModelMapping {
  /** The `llm-pi-ai` provider route the third-party model lives under. */
  provider: string
  /** The third-party wire model id. */
  from: string
  /** The official model id whose capabilities the mapping stamps. */
  to: string
  /** Reasoning-parameter wire dialect the endpoint expects. */
  style: ThinkingStyle
}

export interface Config {
  mappings: ModelMapping[]
}

export const Config: z<Config> = z.object({
  mappings: z.array(z.object({
    provider: z.string().required(),
    from: z.string().required(),
    to: z.string().required(),
    style: z.union([z.const('deepseek'), z.const('openai')]).default('deepseek'),
  })).default([]),
})

/** Structural view of one `llm-pi-ai` provider profile as stored in settings. */
interface ProviderProfile {
  displayName?: string
  apiKeyEnv?: string
  api?: string
  baseURL?: string
  models?: Record<string, unknown>[]
  [key: string]: unknown
}

/** What the settings provider reports for one namespace. */
interface NamespaceDescriptor {
  ns: string
  value?: unknown
  user?: unknown
  revision?: number
}

/** Required services: settings persistence plus the official catalog reader. */
export const inject = ['settings', 'llm']

/**
 * Mount the namespace and the live translator.
 * @param ctx - the host plugin context.
 */
export function apply(ctx: Context): void {
  const officialCapabilities = officialCapabilityTable(ctx)

  ctx.inject(['settings'], (settingsCtx) => {
    const settings = settingsCtx.settings
    const scope = settings.register(MODEL_MAP_NS, Config, { applies: 'live' })

    // Serialize translations: watcher invocations already run one at a time in
    // commit order, and the writes below land on llm-pi-ai's own serialized
    // chain, so a burst of card saves cannot interleave two read-modify-writes.
    let tail: Promise<void> = Promise.resolve()
    scope.watch((next, prev) => {
      tail = tail.then(async () => {
        // Stamp only from the live catalog: while it is unreadable the
        // mappings stay pending until the next commit instead of writing
        // invented capability facts.
        const capsOf = await officialCapabilities()
        await translate(settings, next, prev, capsOf)
      }).catch((error: unknown) => {
        console.warn('[dsh-model-map] official catalog unavailable; mappings stay pending:', error)
      })
    })
  })
}

/**
 * Live official capability table: each catalog model's display name,
 * modalities, and resolved reasoning efforts. Memoized per process — the
 * catalog is static for a running dsh; a failed read is retried next call.
 * @param ctx - context carrying the `llm` runtime.
 * @returns an async lookup of one official model id's capability facts.
 */
function officialCapabilityTable(ctx: Context): () => Promise<(id: string) => OfficialCapability | undefined> {
  let pending: Promise<(id: string) => OfficialCapability | undefined> | undefined
  return () => {
    pending ??= (async () => {
      const models = await ctx.llm.listModels(OFFICIAL_PROVIDER)
      const table = new Map<string, OfficialCapability>()
      for (const model of models) {
        const resolved = await ctx.llm.resolveModelInfo(OFFICIAL_PROVIDER, model.id).catch(() => undefined)
        table.set(model.id, {
          label: model.name,
          input: (model.inputModalities ?? ['text']).filter((m): m is 'text' | 'image' => m === 'text' || m === 'image'),
          efforts: {
            off: null,
            ...Object.fromEntries((resolved?.reasoning?.efforts ?? []).filter(effort => effort.id !== 'off').map(effort => [effort.id, effort.id])),
          },
        })
      }
      if (table.size === 0) throw new Error('official catalog listed no models')
      return (id: string) => table.get(id)
    })().catch((error: unknown) => {
      pending = undefined
      throw error
    })
    return pending
  }
}

/**
 * Apply the mapping-table delta onto the `llm-pi-ai` provider profiles.
 * @param settings - the settings provider.
 * @param next - the committed mapping table.
 * @param prev - the mapping table this run supersedes.
 * @param capsOf - resolved capability facts per official model id.
 */
async function translate(
  settings: { describe(options?: object): NamespaceDescriptor[]; mutate(ns: string, ops: readonly unknown[]): Promise<void> },
  next: Config,
  prev: Config,
  capsOf: (id: string) => OfficialCapability | undefined,
): Promise<void> {
  const descriptor = settings.describe().find(entry => entry.ns === PI_AI_NS)
  if (descriptor === undefined) {
    console.warn('[dsh-model-map] no llm-pi-ai namespace served; mappings stay pending')
    return
  }
  const resolved = (descriptor.user ?? descriptor.value) as { providers?: Record<string, ProviderProfile> } | undefined
  const providers = resolved?.providers
  if (providers === undefined) {
    console.warn('[dsh-model-map] no llm-pi-ai providers configured; mappings stay pending')
    return
  }

  const capsByTarget = new Map<string, OfficialCapability | undefined>()
  for (const mapping of [...next.mappings, ...prev.mappings]) {
    if (!capsByTarget.has(mapping.to)) capsByTarget.set(mapping.to, capsOf(mapping.to))
  }

  const nextKeys = new Set(next.mappings.map(mapping => mappingKey(mapping)))
  const prevKeys = new Set(prev.mappings.map(mapping => mappingKey(mapping)))
  const routes = new Set<string>()
  for (const mapping of next.mappings) routes.add(mapping.provider)
  for (const mapping of prev.mappings) routes.add(mapping.provider)

  const ops: { op: 'set'; path: string[]; value: unknown }[] = []
  for (const route of routes) {
    const profile = providers[route]
    if (profile === undefined) {
      // The page only offers existing routes; a stale row (provider deleted
      // after the mapping was written) stays dormant until it is removed.
      if (next.mappings.some(mapping => mapping.provider === route)) {
        console.warn(`[dsh-model-map] provider "${route}" no longer exists; mapping kept in the table`)
      }
      continue
    }
    const models = [...(Array.isArray(profile.models) ? profile.models : [])]
    let changed = false

    // Withdraw entries this run's delta removed — but only when their
    // capability fields are still exactly what the mapping stamped, so a
    // hand-edited entry survives deleting its mapping.
    for (const mapping of prev.mappings) {
      if (mapping.provider !== route || nextKeys.has(mappingKey(mapping))) continue
      const caps = capsByTarget.get(mapping.to)
      if (caps === undefined) continue
      const index = models.findIndex(entry => entry['id'] === mapping.from)
      if (index < 0) continue
      if (entryMatchesTemplate(models[index]!, mapping.to, mapping.style, caps)) {
        models.splice(index, 1)
        changed = true
      }
    }

    // Stamp or add the entries this run's delta introduced or re-targeted.
    for (const mapping of next.mappings) {
      if (mapping.provider !== route) continue
      const caps = capsByTarget.get(mapping.to)
      if (caps === undefined) {
        console.warn(`[dsh-model-map] official model "${mapping.to}" is not in the catalog; mapping "${mapping.from}" stays pending`)
        continue
      }
      const index = models.findIndex(entry => entry['id'] === mapping.from)
      if (index < 0) {
        models.push({ id: mapping.from, ...mappedEntryFields(mapping.to, mapping.style, caps) })
        changed = true
        continue
      }
      if (!entryMatchesTemplate(models[index]!, mapping.to, mapping.style, caps)) {
        models[index] = stampCapabilities(models[index]!, mapping.to, mapping.style, caps)
        changed = true
      }
    }

    if (changed) ops.push({ op: 'set', path: ['providers', route], value: { ...profile, models } })
  }

  if (ops.length === 0) return
  await settings.mutate(PI_AI_NS, ops)
  console.log(`[dsh-model-map] applied ${ops.length} provider profile update(s)`)
}

/** The identity of one mapping row: same provider and third-party id = same row. */
function mappingKey(mapping: ModelMapping): string {
  return `${mapping.provider}::${mapping.from}`
}
