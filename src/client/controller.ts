/**
 * Page controller for the model-map settings section: local row editing over
 * the namespace snapshot, one atomic save. The third-party model dropdown
 * reads the selected provider's models from the llm-pi-ai snapshot, and the
 * official-model dropdown reads the session model catalog RPC.
 */

import type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { ThinkingStyle } from '../templates.ts'

/** One mapping row as edited in the page. */
export interface MappingRow {
  provider: string
  from: string
  to: string
  style: ThinkingStyle
}

/** One official model entry offered by the mapping picker. */
export interface OfficialOption {
  id: string
  label: string
}

interface ModelMapSection {
  mappings: MappingRow[]
}

/** Structural face of one provider profile this plugin reads. */
interface ProviderProfileView {
  models?: { id?: unknown }[]
}

interface ProvidersSection {
  providers?: Record<string, ProviderProfileView>
}

/** What the page component renders from; stable reference per change. */
export interface ModelMapCardState {
  status: 'loading' | 'ready' | 'unavailable'
  writable: boolean
  dirty: boolean
  rows: MappingRow[]
  providers: string[]
  /** Third-party model ids per provider route, from the llm-pi-ai snapshot. */
  modelsByProvider: Record<string, string[]>
  /** Official catalog entries for the mapping picker. */
  official: OfficialOption[]
  saving: boolean
  message: string | undefined
}

/**
 * Owns the page's staged edits and the two namespace scopes it reads, and
 * keeps the official picker filled from the session model catalog.
 * Rendering subscribes through {@link getSnapshot}/{@link subscribe}.
 */
export class ModelMapCardController {
  private rows: MappingRow[] = []
  private providers: string[] = []
  private modelsByProvider: Record<string, string[]> = {}
  private official: OfficialOption[] = []
  private saving = false
  private message: string | undefined
  private readonly listeners = new Set<() => void>()
  private readonly disposers: (() => void)[] = []
  private snapshot: ModelMapCardState

  /**
   * @param scope - the model-map namespace scope (read + atomic write).
   * @param providersScope - the llm-pi-ai namespace scope (routes + models).
   * @param loadOfficial - reads the official entries from the model catalog.
   */
  constructor(
    private readonly scope: SettingsScope<ModelMapSection>,
    providersScope: SettingsScope<ProvidersSection>,
    loadOfficial: () => Promise<OfficialOption[]>,
  ) {
    const readScope = (): void => {
      const snap = scope.getSnapshot()
      if (snap.value !== undefined) this.rows = snap.value.mappings.map(row => ({ ...row }))
      const profiles = providersScope.getSnapshot().value?.providers ?? {}
      this.providers = Object.keys(profiles)
      this.modelsByProvider = Object.fromEntries(Object.entries(profiles).map(([route, profile]) => [
        route,
        (profile.models ?? []).map(model => String(model.id ?? '')).filter(id => id.length > 0),
      ]))
      this.publish()
    }
    readScope()
    this.disposers.push(scope.subscribe(readScope), providersScope.subscribe(readScope))
    void loadOfficial().then((official) => {
      this.official = official
      this.publish()
    }).catch((error: unknown) => {
      console.warn('[dsh-model-map] official model catalog unavailable; picker stays with current values:', error)
    })
  }

  /** @returns the current render state. */
  getSnapshot(): ModelMapCardState {
    return this.snapshot
  }

  /** Observe render-state replacements. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  /** Release scope subscriptions; the page unmounted. */
  dispose(): void {
    for (const dispose of this.disposers.splice(0)) dispose()
  }

  /** Append one empty row, preselecting the provider's first catalog model. */
  addRow(): void {
    const provider = this.providers[0] ?? ''
    this.rows = [...this.rows, { provider, from: this.modelsByProvider[provider]?.[0] ?? '', to: '', style: 'deepseek' }]
    this.publish()
  }

  /** Patch one row in place; a provider switch reselects its first model. */
  updateRow(index: number, patch: Partial<MappingRow>): void {
    this.rows = this.rows.map((row, i) => {
      if (i !== index) return row
      const merged = { ...row, ...patch }
      if (patch.provider !== undefined && patch.provider !== row.provider) {
        merged.from = this.modelsByProvider[patch.provider]?.[0] ?? ''
      }
      return merged
    })
    this.publish()
  }

  /** Drop one row. */
  removeRow(index: number): void {
    this.rows = this.rows.filter((_, i) => i !== index)
    this.publish()
  }

  /** Throw away the staged edits and reload the stored table. */
  discard(): void {
    const snap = this.scope.getSnapshot()
    this.rows = (snap.value?.mappings ?? []).map(row => ({ ...row }))
    this.message = undefined
    this.publish()
  }

  /**
   * Persist the staged table as one atomic field write.
   * @returns settlement after the Host accepted (or rejected) the write.
   */
  async save(): Promise<void> {
    const valid = this.rows.every(row => row.provider.length > 0 && row.from.trim().length > 0 && row.to.length > 0)
    if (!valid) {
      this.message = '有行未填完整：供应商、第三方模型和官方模型都要选好。'
      this.publish()
      return
    }
    this.saving = true
    this.publish()
    try {
      const normalized = this.rows.map(row => ({ ...row, from: row.from.trim() }))
      await this.scope.set('mappings', normalized)
      this.message = undefined
    } catch (error) {
      this.message = error instanceof Error ? error.message : String(error)
    } finally {
      this.saving = false
      this.publish()
    }
  }

  private publish(): void {
    const snap = this.scope.getSnapshot()
    const stored = JSON.stringify(snap.value?.mappings ?? [])
    const staged = JSON.stringify(this.rows)
    this.snapshot = {
      status: snap.status,
      writable: snap.writable,
      dirty: snap.status === 'ready' && staged !== stored,
      rows: this.rows,
      providers: this.providers,
      modelsByProvider: this.modelsByProvider,
      official: this.official,
      saving: this.saving,
      message: this.message,
    }
    for (const listener of [...this.listeners]) {
      try {
        listener()
      } catch (error) {
        console.error('[dsh-model-map] page listener threw:', error)
      }
    }
  }
}
