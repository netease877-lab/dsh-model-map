window.__ModuleLoader__.load({ id: "dsh-model-map", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(index_exports);

// src/client/controller.ts
var ModelMapCardController = class {
  /**
   * @param scope - the model-map namespace scope (read + atomic write).
   * @param providersScope - the llm-pi-ai namespace scope (routes + models).
   * @param loadOfficial - reads the official entries from the model catalog.
   */
  constructor(scope, providersScope, loadOfficial) {
    this.scope = scope;
    const readScope = () => {
      const snap = scope.getSnapshot();
      if (snap.value !== void 0) this.rows = snap.value.mappings.map((row) => ({ ...row }));
      const profiles = providersScope.getSnapshot().value?.providers ?? {};
      this.providers = Object.keys(profiles);
      this.modelsByProvider = Object.fromEntries(Object.entries(profiles).map(([route, profile]) => [
        route,
        (profile.models ?? []).map((model) => String(model.id ?? "")).filter((id) => id.length > 0)
      ]));
      this.publish();
    };
    readScope();
    this.disposers.push(scope.subscribe(readScope), providersScope.subscribe(readScope));
    void loadOfficial().then((official) => {
      this.official = official;
      this.publish();
    }).catch((error) => {
      console.warn("[dsh-model-map] official model catalog unavailable; picker stays with current values:", error);
    });
  }
  scope;
  rows = [];
  providers = [];
  modelsByProvider = {};
  official = [];
  saving = false;
  message;
  listeners = /* @__PURE__ */ new Set();
  disposers = [];
  snapshot;
  /** @returns the current render state. */
  getSnapshot() {
    return this.snapshot;
  }
  /** Observe render-state replacements. */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  /** Release scope subscriptions; the page unmounted. */
  dispose() {
    for (const dispose of this.disposers.splice(0)) dispose();
  }
  /** Append one empty row, preselecting the provider's first catalog model. */
  addRow() {
    const provider = this.providers[0] ?? "";
    this.rows = [...this.rows, { provider, from: this.modelsByProvider[provider]?.[0] ?? "", to: "", style: "deepseek" }];
    this.publish();
  }
  /** Patch one row in place; a provider switch reselects its first model. */
  updateRow(index, patch) {
    this.rows = this.rows.map((row, i) => {
      if (i !== index) return row;
      const merged = { ...row, ...patch };
      if (patch.provider !== void 0 && patch.provider !== row.provider) {
        merged.from = this.modelsByProvider[patch.provider]?.[0] ?? "";
      }
      return merged;
    });
    this.publish();
  }
  /** Drop one row. */
  removeRow(index) {
    this.rows = this.rows.filter((_, i) => i !== index);
    this.publish();
  }
  /** Throw away the staged edits and reload the stored table. */
  discard() {
    const snap = this.scope.getSnapshot();
    this.rows = (snap.value?.mappings ?? []).map((row) => ({ ...row }));
    this.message = void 0;
    this.publish();
  }
  /**
   * Persist the staged table as one atomic field write.
   * @returns settlement after the Host accepted (or rejected) the write.
   */
  async save() {
    const valid = this.rows.every((row) => row.provider.length > 0 && row.from.trim().length > 0 && row.to.length > 0);
    if (!valid) {
      this.message = "\u6709\u884C\u672A\u586B\u5B8C\u6574\uFF1A\u4F9B\u5E94\u5546\u3001\u7B2C\u4E09\u65B9\u6A21\u578B\u548C\u5B98\u65B9\u6A21\u578B\u90FD\u8981\u9009\u597D\u3002";
      this.publish();
      return;
    }
    this.saving = true;
    this.publish();
    try {
      const normalized = this.rows.map((row) => ({ ...row, from: row.from.trim() }));
      await this.scope.set("mappings", normalized);
      this.message = void 0;
    } catch (error) {
      this.message = error instanceof Error ? error.message : String(error);
    } finally {
      this.saving = false;
      this.publish();
    }
  }
  publish() {
    const snap = this.scope.getSnapshot();
    const stored = JSON.stringify(snap.value?.mappings ?? []);
    const staged = JSON.stringify(this.rows);
    this.snapshot = {
      status: snap.status,
      writable: snap.writable,
      dirty: snap.status === "ready" && staged !== stored,
      rows: this.rows,
      providers: this.providers,
      modelsByProvider: this.modelsByProvider,
      official: this.official,
      saving: this.saving,
      message: this.message
    };
    for (const listener of [...this.listeners]) {
      try {
        listener();
      } catch (error) {
        console.error("[dsh-model-map] page listener threw:", error);
      }
    }
  }
};

// src/client/ModelMapSection.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var styles = {
  page: {
    padding: "4px 0 24px",
    display: "flex",
    flexDirection: "column",
    gap: 16
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    lineHeight: 1.3
  },
  description: {
    fontSize: 13,
    lineHeight: 1.6,
    opacity: 0.72,
    maxWidth: 640
  },
  table: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginTop: 4
  },
  row: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.2fr) minmax(0, 1.5fr) minmax(0, 0.8fr) auto",
    gap: 8,
    alignItems: "center"
  },
  header: {
    fontSize: 11.5,
    opacity: 0.6,
    fontWeight: 600
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "6px 8px",
    fontSize: 13,
    borderRadius: 6,
    border: "1px solid var(--dsh-border, #8884)",
    background: "transparent",
    color: "inherit"
  },
  footer: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    marginTop: 4
  },
  button: {
    padding: "6px 14px",
    fontSize: 13,
    borderRadius: 6,
    border: "1px solid var(--dsh-border, #8884)",
    background: "transparent",
    color: "inherit",
    cursor: "pointer"
  },
  primary: {
    padding: "6px 16px",
    fontSize: 13,
    borderRadius: 6,
    border: "none",
    background: "var(--dsh-accent, #4b6bfb)",
    color: "#fff",
    cursor: "pointer"
  },
  message: {
    fontSize: 12.5,
    opacity: 0.85
  },
  empty: {
    fontSize: 13,
    opacity: 0.65,
    lineHeight: 1.6
  }
};
function useSection(controller) {
  return (0, import_react.useSyncExternalStore)(
    (listener) => controller.subscribe(listener),
    () => controller.getSnapshot()
  );
}
function ModelMapSection(props) {
  const state = useSection(props.controller);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.page, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.title, children: "\u6A21\u578B\u6620\u5C04" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.description, children: "\u628A\u7B2C\u4E09\u65B9\u4F9B\u5E94\u5546\u7684\u6A21\u578B\u6620\u5C04\u6210\u5B98\u65B9 DeepSeek \u6A21\u578B\u7684\u80FD\u529B\uFF1A\u6620\u5C04\u540E\u8BE5\u6A21\u578B\u83B7\u5F97\u6240\u9009\u5B98\u65B9\u6761\u76EE\u7684\u8BC6\u56FE\uFF08\u56FE\u7247\u8F93\u5165\uFF09\u4E0E\u601D\u8003\u5F3A\u5EA6\u6863\u4F4D\uFF0C\u8BF7\u6C42\u4ECD\u53D1\u5F80\u7B2C\u4E09\u65B9\u7AEF\u70B9\u3002\u4F9B\u5E94\u5546\u9700\u5148\u5728\u300C\u6A21\u578B\u300D\u9875\u6DFB\u52A0\uFF1B\u4FDD\u5B58\u540E\u5373\u65F6\u751F\u6548\u3002" }),
    state.status !== "ready" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.empty, children: state.status === "loading" ? "\u6B63\u5728\u52A0\u8F7D\u6620\u5C04\u8868\u2026" : "\u8BBE\u7F6E\u5728\u5F53\u524D\u9875\u9762\u4E0D\u53EF\u7528\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      state.rows.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...styles.row, ...styles.header }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u4F9B\u5E94\u5546" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u7B2C\u4E09\u65B9\u6A21\u578B" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u6620\u5C04\u5230\u5B98\u65B9\u6A21\u578B" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u53C2\u6570\u98CE\u683C" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {})
        ] }),
        state.rows.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.row, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "select",
            {
              value: row.provider,
              disabled: !state.writable,
              onChange: (event) => props.controller.updateRow(index, { provider: event.target.value }),
              style: styles.input,
              children: [
                state.providers.includes(row.provider) || row.provider.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: row.provider, children: `${row.provider}\uFF08\u5DF2\u5220\u9664\uFF09` }),
                state.providers.map((provider) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: provider, children: provider }, provider))
              ]
            }
          ),
          state.modelsByProvider[row.provider]?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "select",
            {
              value: row.from,
              disabled: !state.writable,
              onChange: (event) => props.controller.updateRow(index, { from: event.target.value }),
              style: styles.input,
              children: [
                row.from.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", disabled: true, children: "\u9009\u62E9\u6A21\u578B" }),
                state.modelsByProvider[row.provider].includes(row.from) || row.from.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: row.from, children: `${row.from}\uFF08\u4E0D\u5728\u8BE5\u4F9B\u5E94\u5546\u76EE\u5F55\uFF09` }),
                state.modelsByProvider[row.provider].map((modelId) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: modelId, children: modelId }, modelId))
              ]
            }
          ) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              value: row.from,
              placeholder: "deepseek-chat",
              disabled: !state.writable,
              onChange: (event) => props.controller.updateRow(index, { from: event.target.value }),
              style: styles.input
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "select",
            {
              value: row.to,
              disabled: !state.writable,
              onChange: (event) => props.controller.updateRow(index, { to: event.target.value }),
              style: styles.input,
              children: [
                row.to.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", disabled: true, children: "\u9009\u62E9\u5B98\u65B9\u6A21\u578B" }),
                state.official.some((entry) => entry.id === row.to) || row.to.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: row.to, children: `${row.to}\uFF08\u5B98\u65B9\u5DF2\u4E0B\u67B6\uFF09` }),
                state.official.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: entry.id, children: entry.label }, entry.id))
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "select",
            {
              value: row.style,
              disabled: !state.writable,
              onChange: (event) => props.controller.updateRow(index, { style: event.target.value }),
              style: styles.input,
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "deepseek", children: "deepseek" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "openai", children: "openai" })
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              type: "button",
              title: "\u5220\u9664\u6B64\u6620\u5C04",
              disabled: !state.writable,
              onClick: () => props.controller.removeRow(index),
              style: { ...styles.button, padding: "6px 10px" },
              children: "\u2715"
            }
          )
        ] }, `${row.provider}:${row.from}:${String(index)}`))
      ] }),
      state.rows.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.empty, children: state.providers.length === 0 ? "\u8FD8\u6CA1\u6709\u7B2C\u4E09\u65B9\u4F9B\u5E94\u5546\uFF1A\u5148\u5230\u300C\u6A21\u578B\u300D\u9875\u6DFB\u52A0\u4E00\u4E2A\u81EA\u5B9A\u4E49\u4F9B\u5E94\u5546\uFF0C\u518D\u56DE\u5230\u8FD9\u91CC\u5EFA\u7ACB\u6620\u5C04\u3002" : "\u6682\u65E0\u6620\u5C04\u3002\u6DFB\u52A0\u4E00\u884C\uFF0C\u8BA9\u7B2C\u4E09\u65B9\u6A21\u578B\u83B7\u5F97\u5B98\u65B9\u6A21\u578B\u7684\u8BC6\u56FE\u4E0E\u601D\u8003\u6863\u4F4D\u3002" }),
      state.message !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.message, children: state.message }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.footer, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            disabled: !state.writable || state.saving,
            onClick: () => props.controller.addRow(),
            style: styles.button,
            children: "\u6DFB\u52A0\u6620\u5C04"
          }
        ),
        state.dirty && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              type: "button",
              disabled: state.saving,
              onClick: () => props.controller.save(),
              style: styles.primary,
              children: state.saving ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              type: "button",
              disabled: state.saving,
              onClick: () => props.controller.discard(),
              style: styles.button,
              children: "\u653E\u5F03\u66F4\u6539"
            }
          )
        ] })
      ] })
    ] })
  ] });
}

// src/client/index.ts
var name = "dsh-model-map-client";
var inject = ["slots", "settingsScope", "remote", "remote.session"];
var MODEL_MAP_NS = "model-map";
var PI_AI_NS = "llm-pi-ai";
async function loadOfficialOptions(ctx) {
  const remote = ctx.remote;
  const reply = await remote.session.modelCatalog();
  if (!reply.ok) throw new Error(reply.value === void 0 ? "model catalog unavailable" : "model catalog failed");
  const group = reply.value?.groups?.find((entry) => entry.id === "deepseek-official");
  return (group?.models ?? []).map((model) => ({ id: model.id, label: model.name }));
}
function apply(ctx) {
  const scope = ctx.settingsScope.bind({
    namespace: MODEL_MAP_NS,
    decode: (section) => section
  });
  const providersScope = ctx.settingsScope.bind({
    namespace: PI_AI_NS,
    decode: (section) => section
  });
  const controller = new ModelMapCardController(scope, providersScope, () => loadOfficialOptions(ctx));
  ctx.effect(() => () => controller.dispose(), "dsh-model-map: section controller");
  ctx.slots.inject("settings.section", () => ctx.slots.register({
    name: "settings.section",
    id: "model-map",
    order: 12,
    label: () => "\u6A21\u578B\u6620\u5C04",
    inject: () => ({ controller })
  }, ModelMapSection));
}
return module.exports; } });
