/** The 模型映射 settings section: page header plus the mapping row editor. */

import { useSyncExternalStore } from 'react'
import type { ModelMapCardController, ModelMapCardState } from './controller.ts'

const styles = {
  page: {
    padding: '4px 0 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  } as const,
  title: {
    fontSize: 20,
    fontWeight: 600,
    lineHeight: 1.3,
  } as const,
  description: {
    fontSize: 13,
    lineHeight: 1.6,
    opacity: 0.72,
    maxWidth: 640,
  } as const,
  table: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 4,
  } as const,
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr) minmax(0, 1.5fr) minmax(0, 0.8fr) auto',
    gap: 8,
    alignItems: 'center',
  } as const,
  header: {
    fontSize: 11.5,
    opacity: 0.6,
    fontWeight: 600,
  } as const,
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '6px 8px',
    fontSize: 13,
    borderRadius: 6,
    border: '1px solid var(--dsh-border, #8884)',
    background: 'transparent',
    color: 'inherit',
  } as const,
  footer: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    marginTop: 4,
  } as const,
  button: {
    padding: '6px 14px',
    fontSize: 13,
    borderRadius: 6,
    border: '1px solid var(--dsh-border, #8884)',
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
  } as const,
  primary: {
    padding: '6px 16px',
    fontSize: 13,
    borderRadius: 6,
    border: 'none',
    background: 'var(--dsh-accent, #4b6bfb)',
    color: '#fff',
    cursor: 'pointer',
  } as const,
  message: {
    fontSize: 12.5,
    opacity: 0.85,
  } as const,
  empty: {
    fontSize: 13,
    opacity: 0.65,
    lineHeight: 1.6,
  } as const,
}

/** Subscribe the component to the controller's render state. */
function useSection(controller: ModelMapCardController): ModelMapCardState {
  return useSyncExternalStore(
    listener => controller.subscribe(listener),
    () => controller.getSnapshot(),
  )
}

/**
 * Render the 模型映射 section: the mapping table with staged edits and one
 * atomic save.
 * @param props - the section face supplied by the registrant's inject().
 * @returns the section contents.
 */
export function ModelMapSection(props: { controller: ModelMapCardController }) {
  const state = useSection(props.controller)

  return (
    <div style={styles.page}>
      <div style={styles.title}>{'模型映射'}</div>
      <div style={styles.description}>
        {'把第三方供应商的模型映射成官方 DeepSeek 模型的能力：映射后该模型获得所选官方条目的识图（图片输入）与思考强度档位，请求仍发往第三方端点。供应商需先在「模型」页添加；保存后即时生效。'}
      </div>
      {state.status !== 'ready' ? (
        <div style={styles.empty}>{state.status === 'loading' ? '正在加载映射表…' : '设置在当前页面不可用。'}</div>
      ) : (
        <>
          {state.rows.length > 0 && (
            <>
              <div style={{ ...styles.row, ...styles.header }}>
                <span>{'供应商'}</span>
                <span>{'第三方模型'}</span>
                <span>{'映射到官方模型'}</span>
                <span>{'参数风格'}</span>
                <span />
              </div>
              {state.rows.map((row, index) => (
                <div key={`${row.provider}:${row.from}:${String(index)}`} style={styles.row}>
                  <select
                    value={row.provider}
                    disabled={!state.writable}
                    onChange={event => props.controller.updateRow(index, { provider: event.target.value })}
                    style={styles.input}
                  >
                    {state.providers.includes(row.provider) || row.provider.length === 0
                      ? null
                      : <option value={row.provider}>{`${row.provider}（已删除）`}</option>}
                    {state.providers.map(provider => (
                      <option key={provider} value={provider}>{provider}</option>
                    ))}
                  </select>
                  {state.modelsByProvider[row.provider]?.length
                    ? (
                      <select
                        value={row.from}
                        disabled={!state.writable}
                        onChange={event => props.controller.updateRow(index, { from: event.target.value })}
                        style={styles.input}
                      >
                        {row.from.length === 0 && <option value="" disabled>{'选择模型'}</option>}
                        {state.modelsByProvider[row.provider]!.includes(row.from) || row.from.length === 0
                          ? null
                          : <option value={row.from}>{`${row.from}（不在该供应商目录）`}</option>}
                        {state.modelsByProvider[row.provider]!.map(modelId => (
                          <option key={modelId} value={modelId}>{modelId}</option>
                        ))}
                      </select>
                    )
                    : (
                      <input
                        value={row.from}
                        placeholder="deepseek-chat"
                        disabled={!state.writable}
                        onChange={event => props.controller.updateRow(index, { from: event.target.value })}
                        style={styles.input}
                      />
                    )}
                  <select
                    value={row.to}
                    disabled={!state.writable}
                    onChange={event => props.controller.updateRow(index, { to: event.target.value })}
                    style={styles.input}
                  >
                    {row.to.length === 0 && <option value="" disabled>{'选择官方模型'}</option>}
                    {state.official.some(entry => entry.id === row.to) || row.to.length === 0
                      ? null
                      : <option value={row.to}>{`${row.to}（官方已下架）`}</option>}
                    {state.official.map(entry => (
                      <option key={entry.id} value={entry.id}>{entry.label}</option>
                    ))}
                  </select>
                  <select
                    value={row.style}
                    disabled={!state.writable}
                    onChange={event => props.controller.updateRow(index, { style: event.target.value as 'deepseek' | 'openai' })}
                    style={styles.input}
                  >
                    <option value="deepseek">deepseek</option>
                    <option value="openai">openai</option>
                  </select>
                  <button
                    type="button"
                    title="删除此映射"
                    disabled={!state.writable}
                    onClick={() => props.controller.removeRow(index)}
                    style={{ ...styles.button, padding: '6px 10px' }}
                  >
                    {'✕'}
                  </button>
                </div>
              ))}
            </>
          )}
          {state.rows.length === 0 && (
            <div style={styles.empty}>
              {state.providers.length === 0
                ? '还没有第三方供应商：先到「模型」页添加一个自定义供应商，再回到这里建立映射。'
                : '暂无映射。添加一行，让第三方模型获得官方模型的识图与思考档位。'}
            </div>
          )}
          {state.message !== undefined && <div style={styles.message}>{state.message}</div>}
          <div style={styles.footer}>
            <button
              type="button"
              disabled={!state.writable || state.saving}
              onClick={() => props.controller.addRow()}
              style={styles.button}
            >
              {'添加映射'}
            </button>
            {state.dirty && (
              <>
                <button
                  type="button"
                  disabled={state.saving}
                  onClick={() => props.controller.save()}
                  style={styles.primary}
                >
                  {state.saving ? '保存中…' : '保存'}
                </button>
                <button
                  type="button"
                  disabled={state.saving}
                  onClick={() => props.controller.discard()}
                  style={styles.button}
                >
                  {'放弃更改'}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
