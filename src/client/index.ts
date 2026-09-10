/**
 * dsh-model-map — browser half. Registers the mapping table as its own
 * top-level settings section (alongside 模型 / 插件), keyed by the `model-map`
 * namespace the host half registers. The official-model picker and the
 * third-party model dropdown both read existing channels: the session model
 * catalog RPC and the llm-pi-ai settings snapshot.
 */

import type { Context as ClientContext } from '@deepseek-ai/cordis'
// Type-only merges: ctx.slots / ctx.settingsScope declarations. Cross-plugin
// collaboration goes through cordis services; a value import would fail the
// client bundle-purity gate.
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { ModelMapCardController, type OfficialOption } from './controller.ts'
import { ModelMapSection } from './ModelMapSection.tsx'

/** Stable Cordis plugin name. */
export const name = 'dsh-model-map-client'

/** Required browser services. */
export const inject = ['slots', 'settingsScope', 'remote', 'remote.session']

/** The settings namespace both halves key on. */
const MODEL_MAP_NS = 'model-map'

/** The llm-pi-ai namespace, read for the provider route and model lists only. */
const PI_AI_NS = 'llm-pi-ai'

/** Structural face of the session modelCatalog reply this plugin reads. */
interface CatalogReply {
  ok: boolean
  value?: {
    groups?: { id: string; models?: { id: string; name: string }[] }[]
  }
}

/**
 * Read the official DeepSeek entries from the standard session model catalog —
 * the same RPC the composer model selector consumes.
 * @param ctx - the browser plugin context.
 */
async function loadOfficialOptions(ctx: ClientContext): Promise<OfficialOption[]> {
  const remote = ctx.remote as unknown as {
    session: { modelCatalog(): Promise<CatalogReply> }
  }
  const reply = await remote.session.modelCatalog()
  if (!reply.ok) throw new Error(reply.value === undefined ? 'model catalog unavailable' : 'model catalog failed')
  const group = reply.value?.groups?.find(entry => entry.id === 'deepseek-official')
  return (group?.models ?? []).map(model => ({ id: model.id, label: model.name }))
}

/**
 * Mount the 模型映射 settings section.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  const scope = ctx.settingsScope.bind<{ mappings: { provider: string; from: string; to: string; style: 'deepseek' | 'openai' }[] }>({
    namespace: MODEL_MAP_NS,
    decode: section => section as { mappings: { provider: string; from: string; to: string; style: 'deepseek' | 'openai' }[] },
  })
  const providersScope = ctx.settingsScope.bind<{ providers?: Record<string, unknown> }>({
    namespace: PI_AI_NS,
    decode: section => section as { providers?: Record<string, unknown> },
  })
  const controller = new ModelMapCardController(scope, providersScope, () => loadOfficialOptions(ctx))
  ctx.effect(() => () => controller.dispose(), 'dsh-model-map: section controller')

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'model-map',
    order: 12,
    label: () => '模型映射',
    inject: () => ({ controller }),
  }, ModelMapSection))
}
