var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../deepseek-harness/vendor/cosmokit/src/misc.ts
function noop() {
}
function isNullable(value) {
  return value === null || value === void 0;
}
function isNonNullable(value) {
  return !isNullable(value);
}
function isPlainObject(data) {
  return data && typeof data === "object" && !Array.isArray(data);
}
function filterKeys(object, filter) {
  return Object.fromEntries(Object.entries(object).filter(([key, value]) => filter(key, value)));
}
function mapValues(object, transform) {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, transform(value, key)]));
}
function pick(source, keys, forced) {
  if (!keys) return { ...source };
  const result = {};
  for (const key of keys) {
    if (forced || source[key] !== void 0) result[key] = source[key];
  }
  return result;
}
function omit(source, keys) {
  if (!keys) return { ...source };
  const result = { ...source };
  for (const key of keys) {
    Reflect.deleteProperty(result, key);
  }
  return result;
}
function defineProperty(object, key, value) {
  return Object.defineProperty(object, key, { writable: true, value, enumerable: false });
}
var init_misc = __esm({
  "../deepseek-harness/vendor/cosmokit/src/misc.ts"() {
    "use strict";
  }
});

// ../deepseek-harness/vendor/cosmokit/src/array.ts
function contain(array1, array2) {
  return array2.every((item) => array1.includes(item));
}
function intersection(array1, array2) {
  return array1.filter((item) => array2.includes(item));
}
function difference(array1, array2) {
  return array1.filter((item) => !array2.includes(item));
}
function union(array1, array2) {
  return Array.from(/* @__PURE__ */ new Set([...array1, ...array2]));
}
function deduplicate(array) {
  return [...new Set(array)];
}
function remove(list, item) {
  const index = list?.indexOf(item);
  if (index >= 0) {
    list.splice(index, 1);
    return true;
  } else {
    return false;
  }
}
function makeArray(source) {
  return Array.isArray(source) ? source : isNullable(source) ? [] : [source];
}
var init_array = __esm({
  "../deepseek-harness/vendor/cosmokit/src/array.ts"() {
    "use strict";
    init_misc();
  }
});

// ../deepseek-harness/vendor/cosmokit/src/types.ts
function is(type, value) {
  if (arguments.length === 1) return (value2) => is(type, value2);
  return type in globalThis && value instanceof globalThis[type] || Object.prototype.toString.call(value).slice(8, -1) === type;
}
function isArrayBufferLike(value) {
  return is("ArrayBuffer", value) || is("SharedArrayBuffer", value);
}
function isArrayBufferSource(value) {
  return isArrayBufferLike(value) || ArrayBuffer.isView(value);
}
function clone(source, refs = /* @__PURE__ */ new Map()) {
  if (!source || typeof source !== "object") return source;
  if (is("Date", source)) return new Date(source.valueOf());
  if (is("RegExp", source)) return new RegExp(source.source, source.flags);
  if (isArrayBufferLike(source)) return source.slice(0);
  if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
  const cached = refs.get(source);
  if (cached) return cached;
  if (Array.isArray(source)) {
    const result2 = [];
    refs.set(source, result2);
    source.forEach((value, index) => {
      result2[index] = Reflect.apply(clone, null, [value, refs]);
    });
    return result2;
  }
  const result = Object.create(Object.getPrototypeOf(source));
  refs.set(source, result);
  for (const key of Reflect.ownKeys(source)) {
    const descriptor = { ...Reflect.getOwnPropertyDescriptor(source, key) };
    if ("value" in descriptor) {
      descriptor.value = Reflect.apply(clone, null, [descriptor.value, refs]);
    }
    Reflect.defineProperty(result, key, descriptor);
  }
  return result;
}
function deepEqual(a, b, strict) {
  if (a === b) return true;
  if (!strict && isNullable(a) && isNullable(b)) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;
  if (!a || !b) return false;
  function check(test, then) {
    return test(a) ? test(b) ? then(a, b) : false : test(b) ? false : void 0;
  }
  return check(Array.isArray, (a2, b2) => a2.length === b2.length && a2.every((item, index) => deepEqual(item, b2[index]))) ?? check(is("Date"), (a2, b2) => a2.valueOf() === b2.valueOf()) ?? check(is("RegExp"), (a2, b2) => a2.source === b2.source && a2.flags === b2.flags) ?? check(isArrayBufferLike, (a2, b2) => {
    if (a2.byteLength !== b2.byteLength) return false;
    const viewA = new Uint8Array(a2);
    const viewB = new Uint8Array(b2);
    for (let i = 0; i < viewA.length; i++) {
      if (viewA[i] !== viewB[i]) return false;
    }
    return true;
  }) ?? Object.keys({ ...a, ...b }).every((key) => deepEqual(a[key], b[key], strict));
}
var Binary, base64ToArrayBuffer, arrayBufferToBase64, hexToArrayBuffer, arrayBufferToHex;
var init_types = __esm({
  "../deepseek-harness/vendor/cosmokit/src/types.ts"() {
    "use strict";
    init_misc();
    ((Binary2) => {
      Binary2.is = isArrayBufferLike;
      Binary2.isSource = isArrayBufferSource;
      function fromSource(source) {
        if (ArrayBuffer.isView(source)) {
          return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
        } else {
          return source;
        }
      }
      Binary2.fromSource = fromSource;
      function toBase64(source) {
        source = fromSource(source);
        if (typeof Buffer !== "undefined") {
          return Buffer.from(source).toString("base64");
        }
        let binary = "";
        const bytes = new Uint8Array(source);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      }
      Binary2.toBase64 = toBase64;
      function fromBase64(source) {
        if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "base64"));
        return Uint8Array.from(atob(source), (c) => c.charCodeAt(0));
      }
      Binary2.fromBase64 = fromBase64;
      function toHex(source) {
        source = fromSource(source);
        if (typeof Buffer !== "undefined") return Buffer.from(source).toString("hex");
        return Array.from(new Uint8Array(source), (byte) => byte.toString(16).padStart(2, "0")).join("");
      }
      Binary2.toHex = toHex;
      function fromHex(source) {
        if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "hex"));
        const hex = source.length % 2 === 0 ? source : source.slice(0, source.length - 1);
        const buffer = [];
        for (let i = 0; i < hex.length; i += 2) {
          buffer.push(parseInt(`${hex[i]}${hex[i + 1]}`, 16));
        }
        return Uint8Array.from(buffer).buffer;
      }
      Binary2.fromHex = fromHex;
    })(Binary || (Binary = {}));
    base64ToArrayBuffer = Binary.fromBase64;
    arrayBufferToBase64 = Binary.toBase64;
    hexToArrayBuffer = Binary.fromHex;
    arrayBufferToHex = Binary.toHex;
  }
});

// ../deepseek-harness/vendor/cosmokit/src/string.ts
function capitalize(source) {
  return source.charAt(0).toUpperCase() + source.slice(1);
}
function uncapitalize(source) {
  return source.charAt(0).toLowerCase() + source.slice(1);
}
function camelCase(source) {
  return source.replace(/[_-][a-z]/g, (str) => str.slice(1).toUpperCase());
}
function tokenize(source, delimiters, delimiter) {
  const output = [];
  let state = 0 /* DELIM */;
  for (let i = 0; i < source.length; i++) {
    const code = source.charCodeAt(i);
    if (code >= 65 && code <= 90) {
      if (state === 1 /* UPPER */) {
        const next = source.charCodeAt(i + 1);
        if (next >= 97 && next <= 122) {
          output.push(delimiter);
        }
        output.push(code + 32);
      } else {
        if (state !== 0 /* DELIM */) {
          output.push(delimiter);
        }
        output.push(code + 32);
      }
      state = 1 /* UPPER */;
    } else if (code >= 97 && code <= 122) {
      output.push(code);
      state = 2 /* LOWER */;
    } else if (delimiters.includes(code)) {
      if (state !== 0 /* DELIM */) {
        output.push(delimiter);
      }
      state = 0 /* DELIM */;
    } else {
      output.push(code);
    }
  }
  return String.fromCharCode(...output);
}
function paramCase(source) {
  return tokenize(source, [45, 95], 45);
}
function snakeCase(source) {
  return tokenize(source, [45, 95], 95);
}
function formatProperty(key) {
  if (typeof key !== "string") return `[${key.toString()}]`;
  return /^[a-z_$][\w$]*$/i.test(key) ? `.${key}` : `[${JSON.stringify(key)}]`;
}
function trimSlash(source) {
  return source.replace(/\/$/, "");
}
function sanitize(source) {
  if (!source.startsWith("/")) source = "/" + source;
  return trimSlash(source);
}
var camelize, hyphenate;
var init_string = __esm({
  "../deepseek-harness/vendor/cosmokit/src/string.ts"() {
    "use strict";
    camelize = camelCase;
    hyphenate = paramCase;
  }
});

// ../deepseek-harness/vendor/cosmokit/src/time.ts
var Time;
var init_time = __esm({
  "../deepseek-harness/vendor/cosmokit/src/time.ts"() {
    "use strict";
    ((Time2) => {
      Time2.millisecond = 1;
      Time2.second = 1e3;
      Time2.minute = Time2.second * 60;
      Time2.hour = Time2.minute * 60;
      Time2.day = Time2.hour * 24;
      Time2.week = Time2.day * 7;
      let timezoneOffset = (/* @__PURE__ */ new Date()).getTimezoneOffset();
      function setTimezoneOffset(offset) {
        timezoneOffset = offset;
      }
      Time2.setTimezoneOffset = setTimezoneOffset;
      function getTimezoneOffset() {
        return timezoneOffset;
      }
      Time2.getTimezoneOffset = getTimezoneOffset;
      function getDateNumber(date = /* @__PURE__ */ new Date(), offset) {
        if (typeof date === "number") date = new Date(date);
        if (offset === void 0) offset = timezoneOffset;
        return Math.floor((date.valueOf() / Time2.minute - offset) / 1440);
      }
      Time2.getDateNumber = getDateNumber;
      function fromDateNumber(value, offset) {
        const date = new Date(value * Time2.day);
        if (offset === void 0) offset = timezoneOffset;
        return new Date(+date + offset * Time2.minute);
      }
      Time2.fromDateNumber = fromDateNumber;
      const numeric = /\d+(?:\.\d+)?/.source;
      const timeRegExp = new RegExp(`^${[
        "w(?:eek(?:s)?)?",
        "d(?:ay(?:s)?)?",
        "h(?:our(?:s)?)?",
        "m(?:in(?:ute)?(?:s)?)?",
        "s(?:ec(?:ond)?(?:s)?)?"
      ].map((unit) => `(${numeric}${unit})?`).join("")}$`);
      function parseTime(source) {
        const capture = timeRegExp.exec(source);
        if (!capture) return 0;
        return (parseFloat(capture[1]) * Time2.week || 0) + (parseFloat(capture[2]) * Time2.day || 0) + (parseFloat(capture[3]) * Time2.hour || 0) + (parseFloat(capture[4]) * Time2.minute || 0) + (parseFloat(capture[5]) * Time2.second || 0);
      }
      Time2.parseTime = parseTime;
      function parseDate(date) {
        const parsed = parseTime(date);
        if (parsed) {
          date = Date.now() + parsed;
        } else if (/^\d{1,2}(:\d{1,2}){1,2}$/.test(date)) {
          date = `${(/* @__PURE__ */ new Date()).toLocaleDateString()}-${date}`;
        } else if (/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(date)) {
          date = `${(/* @__PURE__ */ new Date()).getFullYear()}-${date}`;
        }
        return date ? new Date(date) : /* @__PURE__ */ new Date();
      }
      Time2.parseDate = parseDate;
      function format(ms) {
        const abs = Math.abs(ms);
        if (abs >= Time2.day - Time2.hour / 2) {
          return Math.round(ms / Time2.day) + "d";
        } else if (abs >= Time2.hour - Time2.minute / 2) {
          return Math.round(ms / Time2.hour) + "h";
        } else if (abs >= Time2.minute - Time2.second / 2) {
          return Math.round(ms / Time2.minute) + "m";
        } else if (abs >= Time2.second) {
          return Math.round(ms / Time2.second) + "s";
        }
        return ms + "ms";
      }
      Time2.format = format;
      function toDigits(source, length = 2) {
        return source.toString().padStart(length, "0");
      }
      Time2.toDigits = toDigits;
      function template(template2, time = /* @__PURE__ */ new Date()) {
        return template2.replace("yyyy", time.getFullYear().toString()).replace("yy", time.getFullYear().toString().slice(2)).replace("MM", toDigits(time.getMonth() + 1)).replace("dd", toDigits(time.getDate())).replace("hh", toDigits(time.getHours())).replace("mm", toDigits(time.getMinutes())).replace("ss", toDigits(time.getSeconds())).replace("SSS", toDigits(time.getMilliseconds(), 3));
      }
      Time2.template = template;
    })(Time || (Time = {}));
  }
});

// ../deepseek-harness/vendor/cosmokit/src/index.ts
var src_exports = {};
__export(src_exports, {
  Binary: () => Binary,
  Time: () => Time,
  arrayBufferToBase64: () => arrayBufferToBase64,
  arrayBufferToHex: () => arrayBufferToHex,
  base64ToArrayBuffer: () => base64ToArrayBuffer,
  camelCase: () => camelCase,
  camelize: () => camelize,
  capitalize: () => capitalize,
  clone: () => clone,
  contain: () => contain,
  deduplicate: () => deduplicate,
  deepEqual: () => deepEqual,
  defineProperty: () => defineProperty,
  difference: () => difference,
  filterKeys: () => filterKeys,
  formatProperty: () => formatProperty,
  hexToArrayBuffer: () => hexToArrayBuffer,
  hyphenate: () => hyphenate,
  intersection: () => intersection,
  is: () => is,
  isNonNullable: () => isNonNullable,
  isNullable: () => isNullable,
  isPlainObject: () => isPlainObject,
  makeArray: () => makeArray,
  mapValues: () => mapValues,
  noop: () => noop,
  omit: () => omit,
  paramCase: () => paramCase,
  pick: () => pick,
  remove: () => remove,
  sanitize: () => sanitize,
  snakeCase: () => snakeCase,
  trimSlash: () => trimSlash,
  uncapitalize: () => uncapitalize,
  union: () => union,
  valueMap: () => mapValues
});
var init_src = __esm({
  "../deepseek-harness/vendor/cosmokit/src/index.ts"() {
    "use strict";
    init_array();
    init_types();
    init_misc();
    init_string();
    init_time();
  }
});

// ../deepseek-harness/vendor/schemastery/lib/index.cjs
var require_lib = __commonJS({
  "../deepseek-harness/vendor/schemastery/lib/index.cjs"(exports, module) {
    "use strict";
    var _deepseek_ai_cosmokit = (init_src(), __toCommonJS(src_exports));
    var kSchema = /* @__PURE__ */ Symbol.for("schemastery");
    var kValidationError = /* @__PURE__ */ Symbol.for("ValidationError");
    globalThis.__schemastery_index__ ??= 0;
    globalThis.__schemastery_refs__ = void 0;
    var ValidationError = class extends TypeError {
      options;
      name = "ValidationError";
      constructor(message, options) {
        let prefix = "$";
        for (const segment of options.path || []) if (typeof segment === "string") prefix += "." + segment;
        else if (typeof segment === "number") prefix += "[" + segment + "]";
        else if (typeof segment === "symbol") prefix += `[Symbol(${segment.toString()})]`;
        if (prefix.startsWith(".")) prefix = prefix.slice(1);
        super((prefix === "$" ? "" : `${prefix} `) + message);
        this.options = options;
      }
      static is(error) {
        return !!error?.[kValidationError];
      }
    };
    Object.defineProperty(ValidationError.prototype, kValidationError, { value: true });
    var Schema = function(options) {
      const schema = function(data, options2 = {}) {
        return Schema.resolve(data, schema, options2)[0];
      };
      if (options.refs) {
        const refs = (0, _deepseek_ai_cosmokit.valueMap)(options.refs, (options2) => new Schema(options2));
        const getRef = (uid) => refs[uid];
        for (const key in refs) {
          const options2 = refs[key];
          options2.sKey = getRef(options2.sKey);
          options2.inner = getRef(options2.inner);
          options2.list = options2.list && options2.list.map(getRef);
          options2.dict = options2.dict && (0, _deepseek_ai_cosmokit.valueMap)(options2.dict, getRef);
        }
        return refs[options.uid];
      }
      Object.assign(schema, options);
      if (typeof schema.callback === "string") try {
        schema.callback = new Function("return " + schema.callback)();
      } catch {
      }
      Object.defineProperty(schema, "uid", { value: globalThis.__schemastery_index__++ });
      Object.setPrototypeOf(schema, Schema.prototype);
      schema.meta ||= {};
      schema.toString = schema.toString.bind(schema);
      return schema;
    };
    Schema.prototype = Object.create(Function.prototype);
    Schema.prototype[kSchema] = true;
    Object.defineProperty(Schema.prototype, "~standard", { get() {
      return {
        version: 1,
        vendor: "schemastery",
        validate: (value) => {
          try {
            return { value: Schema.resolve(value, this, {})[0] };
          } catch (error) {
            if (ValidationError.is(error)) return { issues: [{
              message: error.message,
              path: error.options.path
            }] };
            throw error;
          }
        }
      };
    } });
    Schema.ValidationError = ValidationError;
    Schema.prototype.toJSON = function toJSON() {
      if (globalThis.__schemastery_refs__) {
        globalThis.__schemastery_refs__[this.uid] ??= JSON.parse(JSON.stringify({ ...this }));
        return this.uid;
      }
      globalThis.__schemastery_refs__ = { [this.uid]: { ...this } };
      globalThis.__schemastery_refs__[this.uid] = JSON.parse(JSON.stringify({ ...this }));
      const result = {
        uid: this.uid,
        refs: globalThis.__schemastery_refs__
      };
      globalThis.__schemastery_refs__ = void 0;
      return result;
    };
    Schema.prototype.set = function set(key, value) {
      this.dict[key] = value;
      return this;
    };
    Schema.prototype.push = function push(value) {
      this.list.push(value);
      return this;
    };
    function mergeDesc(original, messages) {
      const result = typeof original === "string" ? { "": original } : { ...original };
      for (const locale in messages) {
        const value = messages[locale];
        if (value?.$description || value?.$desc) result[locale] = value.$description || value.$desc;
        else if (typeof value === "string") result[locale] = value;
      }
      return result;
    }
    function getInner(value) {
      return value?.$value ?? value?.$inner;
    }
    function extractKeys(data) {
      return (0, _deepseek_ai_cosmokit.filterKeys)(data ?? {}, (key) => !key.startsWith("$"));
    }
    Schema.prototype.i18n = function i18n(messages) {
      const schema = Schema(this);
      const desc = mergeDesc(schema.meta.description, messages);
      if (Object.keys(desc).length) schema.meta.description = desc;
      if (schema.dict) schema.dict = (0, _deepseek_ai_cosmokit.valueMap)(schema.dict, (inner, key) => {
        return inner.i18n((0, _deepseek_ai_cosmokit.valueMap)(messages, (data) => getInner(data)?.[key] ?? data?.[key]));
      });
      if (schema.list) schema.list = schema.list.map((inner, index) => {
        return inner.i18n((0, _deepseek_ai_cosmokit.valueMap)(messages, (data = {}) => {
          if (Array.isArray(getInner(data))) return getInner(data)[index];
          if (Array.isArray(data)) return data[index];
          return extractKeys(data);
        }));
      });
      if (schema.inner) schema.inner = schema.inner.i18n((0, _deepseek_ai_cosmokit.valueMap)(messages, (data) => {
        if (getInner(data)) return getInner(data);
        return extractKeys(data);
      }));
      if (schema.sKey) schema.sKey = schema.sKey.i18n((0, _deepseek_ai_cosmokit.valueMap)(messages, (data) => data?.$key));
      return schema;
    };
    Schema.prototype.extra = function extra(key, value) {
      const schema = Schema(this);
      schema.meta = {
        ...schema.meta,
        [key]: value
      };
      return schema;
    };
    for (const key of [
      "required",
      "disabled",
      "collapse",
      "hidden",
      "loose"
    ]) Object.assign(Schema.prototype, { [key](value = true) {
      const schema = Schema(this);
      schema.meta = {
        ...schema.meta,
        [key]: value
      };
      return schema;
    } });
    Schema.prototype.deprecated = function deprecated() {
      const schema = Schema(this);
      schema.meta.badges ||= [];
      schema.meta.badges.push({
        text: "deprecated",
        type: "danger"
      });
      return schema;
    };
    Schema.prototype.experimental = function experimental() {
      const schema = Schema(this);
      schema.meta.badges ||= [];
      schema.meta.badges.push({
        text: "experimental",
        type: "warning"
      });
      return schema;
    };
    Schema.prototype.pattern = function pattern(regexp) {
      const schema = Schema(this);
      const pattern2 = (0, _deepseek_ai_cosmokit.pick)(regexp, ["source", "flags"]);
      schema.meta = {
        ...schema.meta,
        pattern: pattern2
      };
      return schema;
    };
    Schema.prototype.simplify = function simplify(value) {
      if ((0, _deepseek_ai_cosmokit.deepEqual)(value, this.meta.default, this.type === "dict")) return null;
      if ((0, _deepseek_ai_cosmokit.isNullable)(value)) return value;
      if (this.type === "object" || this.type === "dict") {
        const result = {};
        for (const key in value) {
          const item = (this.type === "object" ? this.dict[key] : this.inner)?.simplify(value[key]);
          if (this.type === "dict" || !(0, _deepseek_ai_cosmokit.isNullable)(item)) result[key] = item;
        }
        if ((0, _deepseek_ai_cosmokit.deepEqual)(result, this.meta.default, this.type === "dict")) return null;
        return result;
      } else if (this.type === "array" || this.type === "tuple") {
        const result = [];
        value.forEach((value2, index) => {
          const schema = this.type === "array" ? this.inner : this.list[index];
          const item = schema ? schema.simplify(value2) : value2;
          result.push(item);
        });
        return result;
      } else if (this.type === "intersect") {
        const result = {};
        for (const item of this.list) Object.assign(result, item.simplify(value));
        return result;
      } else if (this.type === "union") for (const schema of this.list) try {
        Schema.resolve(value, schema, {});
        return schema.simplify(value);
      } catch {
      }
      return value;
    };
    Schema.prototype.toString = function toString(inline) {
      return formatters[this.type]?.(this, inline) ?? `Schema<${this.type}>`;
    };
    Schema.prototype.role = function role(role, extra) {
      const schema = Schema(this);
      schema.meta = {
        ...schema.meta,
        role,
        extra
      };
      return schema;
    };
    for (const key of [
      "default",
      "link",
      "comment",
      "description",
      "max",
      "min",
      "step"
    ]) Object.assign(Schema.prototype, { [key](value) {
      const schema = Schema(this);
      schema.meta = {
        ...schema.meta,
        [key]: value
      };
      return schema;
    } });
    var resolvers = {};
    Schema.extend = function extend(type, resolve) {
      resolvers[type] = resolve;
    };
    Schema.resolve = function resolve(data, schema, options = {}, strict = false) {
      if (!schema) return [data];
      if (options.ignore?.(data, schema)) return [data];
      if ((0, _deepseek_ai_cosmokit.isNullable)(data) && schema.type !== "lazy") {
        if (schema.meta.required) throw new ValidationError(`missing required value`, options);
        let current = schema;
        let fallback = schema.meta.default;
        while (current?.type === "intersect" && (0, _deepseek_ai_cosmokit.isNullable)(fallback)) {
          current = current.list[0];
          fallback = current?.meta.default;
        }
        if ((0, _deepseek_ai_cosmokit.isNullable)(fallback)) return [data];
        data = (0, _deepseek_ai_cosmokit.clone)(fallback);
      }
      const callback = resolvers[schema.type];
      if (!callback) throw new ValidationError(`unsupported type "${schema.type}"`, options);
      try {
        return callback(data, schema, options, strict);
      } catch (error) {
        if (!schema.meta.loose) throw error;
        return [schema.meta.default];
      }
    };
    Schema.from = function from(source) {
      if ((0, _deepseek_ai_cosmokit.isNullable)(source)) return Schema.any();
      else if ([
        "string",
        "number",
        "boolean"
      ].includes(typeof source)) return Schema.const(source).required();
      else if (source[kSchema]) return source;
      else if (typeof source === "function") switch (source) {
        case String:
          return Schema.string().required();
        case Number:
          return Schema.number().required();
        case Boolean:
          return Schema.boolean().required();
        case Function:
          return Schema.function().required();
        default:
          return Schema.is(source).required();
      }
      else throw new TypeError(`cannot infer schema from ${source}`);
    };
    Schema.lazy = function lazy(builder) {
      const toJSON = () => {
        if (!schema.inner[kSchema]) {
          schema.inner = schema.builder();
          schema.inner.meta = {
            ...schema.meta,
            ...schema.inner.meta
          };
        }
        return schema.inner.toJSON();
      };
      const schema = new Schema({
        type: "lazy",
        builder,
        inner: { toJSON }
      });
      return schema;
    };
    Schema.natural = function natural() {
      return Schema.number().step(1).min(0);
    };
    Schema.percent = function percent() {
      return Schema.number().step(0.01).min(0).max(1).role("slider");
    };
    Schema.date = function date() {
      return Schema.union([Schema.is(Date), Schema.transform(Schema.string().role("datetime"), (value, options) => {
        const date2 = new Date(value);
        if (isNaN(+date2)) throw new ValidationError(`invalid date "${value}"`, options);
        return date2;
      }, true)]);
    };
    Schema.regExp = function regExp(flag = "") {
      return Schema.union([Schema.is(RegExp), Schema.transform(Schema.string().role("regexp", { flag }), (value, options) => {
        try {
          return new RegExp(value, flag);
        } catch (e) {
          throw new ValidationError(e.message, options);
        }
      }, true)]);
    };
    Schema.arrayBuffer = function arrayBuffer(encoding) {
      return Schema.union([
        Schema.is(ArrayBuffer),
        Schema.is(SharedArrayBuffer),
        Schema.transform(Schema.any(), (value, options) => {
          if (_deepseek_ai_cosmokit.Binary.isSource(value)) return _deepseek_ai_cosmokit.Binary.fromSource(value);
          throw new ValidationError(`expected ArrayBufferSource but got ${value}`, options);
        }, true),
        ...encoding ? [Schema.transform(Schema.string(), (value, options) => {
          try {
            return encoding === "base64" ? _deepseek_ai_cosmokit.Binary.fromBase64(value) : _deepseek_ai_cosmokit.Binary.fromHex(value);
          } catch (e) {
            throw new ValidationError(e.message, options);
          }
        }, true)] : []
      ]);
    };
    Schema.extend("lazy", (data, schema, options, strict) => {
      if (!schema.inner[kSchema]) {
        schema.inner = schema.builder();
        schema.inner.meta = {
          ...schema.meta,
          ...schema.inner.meta
        };
      }
      return Schema.resolve(data, schema.inner, options, strict);
    });
    Schema.extend("any", (data) => {
      return [data];
    });
    Schema.extend("never", (data, _, options) => {
      throw new ValidationError(`expected nullable but got ${data}`, options);
    });
    Schema.extend("const", (data, { value }, options) => {
      if ((0, _deepseek_ai_cosmokit.deepEqual)(data, value)) return [value];
      throw new ValidationError(`expected ${value} but got ${data}`, options);
    });
    function checkWithinRange(data, meta, description, options, skipMin = false) {
      const { max = Infinity, min = -Infinity } = meta;
      if (data > max) throw new ValidationError(`expected ${description} <= ${max} but got ${data}`, options);
      if (data < min && !skipMin) throw new ValidationError(`expected ${description} >= ${min} but got ${data}`, options);
    }
    Schema.extend("string", (data, { meta }, options) => {
      if (typeof data !== "string") throw new ValidationError(`expected string but got ${data}`, options);
      if (meta.pattern) {
        const regexp = new RegExp(meta.pattern.source, meta.pattern.flags);
        if (!regexp.test(data)) throw new ValidationError(`expect string to match regexp ${regexp}`, options);
      }
      checkWithinRange(data.length, meta, "string length", options);
      return [data];
    });
    function decimalShift(data, digits) {
      const str = data.toString();
      if (str.includes("e")) return data * Math.pow(10, digits);
      const index = str.indexOf(".");
      if (index === -1) return data * Math.pow(10, digits);
      const frac = str.slice(index + 1);
      const integer = str.slice(0, index);
      if (frac.length <= digits) return +(integer + frac.padEnd(digits, "0"));
      return +(integer + frac.slice(0, digits) + "." + frac.slice(digits));
    }
    function isMultipleOf(data, min, step) {
      step = Math.abs(step);
      if (!/^\d+\.\d+$/.test(step.toString())) return (data - min) % step === 0;
      const index = step.toString().indexOf(".");
      const digits = step.toString().slice(index + 1).length;
      return Math.abs(decimalShift(data, digits) - decimalShift(min, digits)) % decimalShift(step, digits) === 0;
    }
    Schema.extend("number", (data, { meta }, options) => {
      if (typeof data !== "number") throw new ValidationError(`expected number but got ${data}`, options);
      checkWithinRange(data, meta, "number", options);
      const { step } = meta;
      if (step && !isMultipleOf(data, meta.min ?? 0, step)) throw new ValidationError(`expected number multiple of ${step} but got ${data}`, options);
      return [data];
    });
    Schema.extend("boolean", (data, _, options) => {
      if (typeof data === "boolean") return [data];
      throw new ValidationError(`expected boolean but got ${data}`, options);
    });
    Schema.extend("bitset", (data, { bits, meta }, options) => {
      let value = 0, keys = [];
      if (typeof data === "number") {
        value = data;
        for (const key in bits) if (data & bits[key]) keys.push(key);
      } else if (Array.isArray(data)) {
        keys = data;
        for (const key of keys) {
          if (typeof key !== "string") throw new ValidationError(`expected string but got ${key}`, options);
          if (key in bits) value |= bits[key];
        }
      } else throw new ValidationError(`expected number or array but got ${data}`, options);
      if (value === meta.default) return [value];
      return [value, keys];
    });
    Schema.extend("function", (data, _, options) => {
      if (typeof data === "function") return [data];
      throw new ValidationError(`expected function but got ${data}`, options);
    });
    Schema.extend("is", (data, { constructor }, options) => {
      if (typeof constructor === "function") {
        if (data instanceof constructor) return [data];
        throw new ValidationError(`expected ${constructor.name} but got ${data}`, options);
      } else {
        if ((0, _deepseek_ai_cosmokit.isNullable)(data)) throw new ValidationError(`expected ${constructor} but got ${data}`, options);
        let prototype = Object.getPrototypeOf(data);
        while (prototype) {
          if (prototype.constructor?.name === constructor) return [data];
          prototype = Object.getPrototypeOf(prototype);
        }
        throw new ValidationError(`expected ${constructor} but got ${data}`, options);
      }
    });
    function property(data, key, schema, options) {
      try {
        const [value, adapted] = Schema.resolve(data[key], schema, {
          ...options,
          path: [...options.path || [], key]
        });
        if (adapted !== void 0) data[key] = adapted;
        return value;
      } catch (e) {
        if (!options?.autofix) throw e;
        delete data[key];
        return schema.meta.default;
      }
    }
    Schema.extend("array", (data, { inner, meta }, options) => {
      if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
      checkWithinRange(data.length, meta, "array length", options, !(0, _deepseek_ai_cosmokit.isNullable)(inner.meta.default));
      return [data.map((_, index) => property(data, index, inner, options))];
    });
    Schema.extend("dict", (data, { inner, sKey }, options, strict) => {
      if (!(0, _deepseek_ai_cosmokit.isPlainObject)(data)) throw new ValidationError(`expected object but got ${data}`, options);
      const result = {};
      for (const key in data) {
        let rKey;
        try {
          rKey = Schema.resolve(key, sKey, options)[0];
        } catch (error) {
          if (strict) continue;
          throw error;
        }
        result[rKey] = property(data, key, inner, options);
        data[rKey] = data[key];
        if (key !== rKey) delete data[key];
      }
      return [result];
    });
    Schema.extend("tuple", (data, { list }, options, strict) => {
      if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
      const result = list.map((inner, index) => property(data, index, inner, options));
      if (strict) return [result];
      result.push(...data.slice(list.length));
      return [result];
    });
    function merge(result, data) {
      for (const key in data) {
        if (key in result) continue;
        result[key] = data[key];
      }
    }
    Schema.extend("object", (data, { dict }, options, strict) => {
      if (!(0, _deepseek_ai_cosmokit.isPlainObject)(data)) throw new ValidationError(`expected object but got ${data}`, options);
      const result = {};
      for (const key in dict) {
        const value = property(data, key, dict[key], options);
        if (!(0, _deepseek_ai_cosmokit.isNullable)(value) || key in data) result[key] = value;
      }
      if (!strict) merge(result, data);
      return [result];
    });
    Schema.extend("union", (data, { list, toString }, options, strict) => {
      const messages = [];
      for (const inner of list) try {
        return Schema.resolve(data, inner, options, strict);
      } catch (error) {
        messages.push(error);
      }
      throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
    });
    Schema.extend("intersect", (data, { list, toString }, options, strict) => {
      if (!list.length) return [data];
      let result;
      for (const inner of list) {
        const value = Schema.resolve(data, inner, options, true)[0];
        if ((0, _deepseek_ai_cosmokit.isNullable)(value)) continue;
        if ((0, _deepseek_ai_cosmokit.isNullable)(result)) result = value;
        else if (typeof result !== typeof value) throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
        else if (typeof value === "object") merge(result ??= {}, value);
        else if (result !== value) throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
      }
      if (!strict && (0, _deepseek_ai_cosmokit.isPlainObject)(data)) merge(result, data);
      return [result];
    });
    Schema.extend("transform", (data, { inner, callback, preserve }, options) => {
      const [result, adapted = data] = Schema.resolve(data, inner, options, true);
      if (preserve) return [callback(result)];
      else return [callback(result), callback(adapted)];
    });
    var formatters = {};
    function defineMethod(name2, keys, format) {
      formatters[name2] = format;
      Object.assign(Schema, { [name2](...args) {
        const schema = new Schema({ type: name2 });
        keys.forEach((key, index) => {
          switch (key) {
            case "sKey":
              schema.sKey = args[index] ?? Schema.string();
              break;
            case "inner":
              schema.inner = Schema.from(args[index]);
              break;
            case "list":
              schema.list = args[index].map(Schema.from);
              break;
            case "dict":
              schema.dict = (0, _deepseek_ai_cosmokit.valueMap)(args[index], Schema.from);
              break;
            case "bits":
              schema.bits = {};
              for (const key2 in args[index]) {
                if (typeof args[index][key2] !== "number") continue;
                schema.bits[key2] = args[index][key2];
              }
              break;
            case "callback": {
              const callback = schema.callback = args[index];
              callback["toJSON"] ||= () => callback.toString();
              break;
            }
            case "constructor": {
              const constructor = schema.constructor = args[index];
              if (typeof constructor === "function") constructor["toJSON"] ||= () => constructor["name"];
              break;
            }
            default:
              schema[key] = args[index];
          }
        });
        if (name2 === "object" || name2 === "dict") schema.meta.default = {};
        else if (name2 === "array" || name2 === "tuple") schema.meta.default = [];
        else if (name2 === "bitset") schema.meta.default = 0;
        return schema;
      } });
    }
    defineMethod("is", ["constructor"], ({ constructor }) => {
      if (typeof constructor === "function") return constructor.name;
      else return constructor;
    });
    defineMethod("any", [], () => "any");
    defineMethod("never", [], () => "never");
    defineMethod("const", ["value"], ({ value }) => typeof value === "string" ? JSON.stringify(value) : value);
    defineMethod("string", [], () => "string");
    defineMethod("number", [], () => "number");
    defineMethod("boolean", [], () => "boolean");
    defineMethod("bitset", ["bits"], () => "bitset");
    defineMethod("function", [], () => "function");
    defineMethod("array", ["inner"], ({ inner }) => `${inner.toString(true)}[]`);
    defineMethod("dict", ["inner", "sKey"], ({ inner, sKey }) => `{ [key: ${sKey.toString()}]: ${inner.toString()} }`);
    defineMethod("tuple", ["list"], ({ list }) => `[${list.map((inner) => inner.toString()).join(", ")}]`);
    defineMethod("object", ["dict"], ({ dict }) => {
      if (Object.keys(dict).length === 0) return "{}";
      return `{ ${Object.entries(dict).map(([key, inner]) => {
        return `${key}${inner.meta.required ? "" : "?"}: ${inner.toString()}`;
      }).join(", ")} }`;
    });
    defineMethod("union", ["list"], ({ list }, inline) => {
      const result = list.map(({ toString: format }) => format()).join(" | ");
      return inline ? `(${result})` : result;
    });
    defineMethod("intersect", ["list"], ({ list }) => {
      return `${list.map((inner) => inner.toString(true)).join(" & ")}`;
    });
    defineMethod("transform", [
      "inner",
      "callback",
      "preserve"
    ], ({ inner }, isInner) => inner.toString(isInner));
    module.exports = Schema;
  }
});

// src/index.ts
var import_schemastery = __toESM(require_lib(), 1);

// src/templates.ts
var COMPAT_DEEPSEEK = {
  supportsStore: false,
  supportsDeveloperRole: false,
  maxTokensField: "max_tokens",
  requiresReasoningContentOnAssistantMessages: true,
  thinkingFormat: "deepseek"
};
var COMPAT_OPENAI = {
  supportsStore: false,
  supportsDeveloperRole: false,
  supportsReasoningEffort: true,
  maxTokensField: "max_tokens",
  thinkingFormat: "openai"
};
function mappedEntryFields(target, style, caps) {
  const compat = style === "openai" ? COMPAT_OPENAI : COMPAT_DEEPSEEK;
  return {
    name: caps.label,
    input: [...caps.input],
    reasoningEfforts: { ...caps.efforts },
    compat: { ...compat }
  };
}
var CAPABILITY_KEYS = ["name", "input", "reasoningEfforts", "compat"];
function entryMatchesTemplate(entry, target, style, caps) {
  const fields = mappedEntryFields(target, style, caps);
  return CAPABILITY_KEYS.every((key) => {
    return JSON.stringify(entry[key]) === JSON.stringify(fields[key]);
  });
}
function stampCapabilities(entry, target, style, caps) {
  return { ...entry, ...mappedEntryFields(target, style, caps) };
}

// src/index.ts
var name = "dsh-model-map";
var MODEL_MAP_NS = "model-map";
var PI_AI_NS = "llm-pi-ai";
var OFFICIAL_PROVIDER = "deepseek-official";
var Config = import_schemastery.default.object({
  mappings: import_schemastery.default.array(import_schemastery.default.object({
    provider: import_schemastery.default.string().required(),
    from: import_schemastery.default.string().required(),
    to: import_schemastery.default.string().required(),
    style: import_schemastery.default.union([import_schemastery.default.const("deepseek"), import_schemastery.default.const("openai")]).default("deepseek")
  })).default([])
});
var inject = ["settings", "llm"];
function apply(ctx) {
  const officialCapabilities = officialCapabilityTable(ctx);
  ctx.inject(["settings"], (settingsCtx) => {
    const settings = settingsCtx.settings;
    const scope = settings.register(MODEL_MAP_NS, Config, { applies: "live" });
    let tail = Promise.resolve();
    scope.watch((next, prev) => {
      tail = tail.then(async () => {
        const capsOf = await officialCapabilities();
        await translate(settings, next, prev, capsOf);
      }).catch((error) => {
        console.warn("[dsh-model-map] official catalog unavailable; mappings stay pending:", error);
      });
    });
  });
}
function officialCapabilityTable(ctx) {
  let pending;
  return () => {
    pending ??= (async () => {
      const models = await ctx.llm.listModels(OFFICIAL_PROVIDER);
      const table = /* @__PURE__ */ new Map();
      for (const model of models) {
        const resolved = await ctx.llm.resolveModelInfo(OFFICIAL_PROVIDER, model.id).catch(() => void 0);
        table.set(model.id, {
          label: model.name,
          input: (model.inputModalities ?? ["text"]).filter((m) => m === "text" || m === "image"),
          efforts: {
            off: null,
            ...Object.fromEntries((resolved?.reasoning?.efforts ?? []).filter((effort) => effort.id !== "off").map((effort) => [effort.id, effort.id]))
          }
        });
      }
      if (table.size === 0) throw new Error("official catalog listed no models");
      return (id) => table.get(id);
    })().catch((error) => {
      pending = void 0;
      throw error;
    });
    return pending;
  };
}
async function translate(settings, next, prev, capsOf) {
  const descriptor = settings.describe().find((entry) => entry.ns === PI_AI_NS);
  if (descriptor === void 0) {
    console.warn("[dsh-model-map] no llm-pi-ai namespace served; mappings stay pending");
    return;
  }
  const resolved = descriptor.user ?? descriptor.value;
  const providers = resolved?.providers;
  if (providers === void 0) {
    console.warn("[dsh-model-map] no llm-pi-ai providers configured; mappings stay pending");
    return;
  }
  const capsByTarget = /* @__PURE__ */ new Map();
  for (const mapping of [...next.mappings, ...prev.mappings]) {
    if (!capsByTarget.has(mapping.to)) capsByTarget.set(mapping.to, capsOf(mapping.to));
  }
  const nextKeys = new Set(next.mappings.map((mapping) => mappingKey(mapping)));
  const prevKeys = new Set(prev.mappings.map((mapping) => mappingKey(mapping)));
  const routes = /* @__PURE__ */ new Set();
  for (const mapping of next.mappings) routes.add(mapping.provider);
  for (const mapping of prev.mappings) routes.add(mapping.provider);
  const ops = [];
  for (const route of routes) {
    const profile = providers[route];
    if (profile === void 0) {
      if (next.mappings.some((mapping) => mapping.provider === route)) {
        console.warn(`[dsh-model-map] provider "${route}" no longer exists; mapping kept in the table`);
      }
      continue;
    }
    const models = [...Array.isArray(profile.models) ? profile.models : []];
    let changed = false;
    for (const mapping of prev.mappings) {
      if (mapping.provider !== route || nextKeys.has(mappingKey(mapping))) continue;
      const caps = capsByTarget.get(mapping.to);
      if (caps === void 0) continue;
      const index = models.findIndex((entry) => entry["id"] === mapping.from);
      if (index < 0) continue;
      if (entryMatchesTemplate(models[index], mapping.to, mapping.style, caps)) {
        models.splice(index, 1);
        changed = true;
      }
    }
    for (const mapping of next.mappings) {
      if (mapping.provider !== route) continue;
      const caps = capsByTarget.get(mapping.to);
      if (caps === void 0) {
        console.warn(`[dsh-model-map] official model "${mapping.to}" is not in the catalog; mapping "${mapping.from}" stays pending`);
        continue;
      }
      const index = models.findIndex((entry) => entry["id"] === mapping.from);
      if (index < 0) {
        models.push({ id: mapping.from, ...mappedEntryFields(mapping.to, mapping.style, caps) });
        changed = true;
        continue;
      }
      if (!entryMatchesTemplate(models[index], mapping.to, mapping.style, caps)) {
        models[index] = stampCapabilities(models[index], mapping.to, mapping.style, caps);
        changed = true;
      }
    }
    if (changed) ops.push({ op: "set", path: ["providers", route], value: { ...profile, models } });
  }
  if (ops.length === 0) return;
  await settings.mutate(PI_AI_NS, ops);
  console.log(`[dsh-model-map] applied ${ops.length} provider profile update(s)`);
}
function mappingKey(mapping) {
  return `${mapping.provider}::${mapping.from}`;
}
export {
  Config,
  MODEL_MAP_NS,
  apply,
  inject,
  name
};
//# sourceMappingURL=index.js.map
