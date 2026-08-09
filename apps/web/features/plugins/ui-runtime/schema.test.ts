import test from "node:test";
import assert from "node:assert/strict";

import {
  compilePluginUiSchema,
  parsePluginRuntimeUiSchema,
  parsePluginUiBinding,
  parsePluginUiSchema,
} from "./schema.ts";

test("compiles authoring JSON5 to normalized runtime JSON", () => {
  const compiled = compilePluginUiSchema(`
    {
      // Authoring-only syntax should not survive into the runtime package.
      schema: "mcsl.ui.v1",
      root: {
        type: "View",
        props: { Direction: "Vertical", Gap: "Spacing.Md" },
        children: [{ type: "Text", props: { Text: "{state.title}" } }],
      },
    }
  `);

  assert.equal(compiled.ok, true);
  if (compiled.ok) {
    assert.doesNotThrow(() => JSON.parse(compiled.runtimeJson));
    assert.equal(compiled.runtimeJson.includes("//"), false);
    const runtime = parsePluginRuntimeUiSchema(compiled.runtimeJson);
    assert.equal(runtime.ok, true);
  }
});

test("parses JSON5 schema with allowed components and bindings", () => {
  const result = parsePluginUiSchema(`
    {
      // JSON5 comments are allowed for plugin authors.
      schema: "mcsl.ui.v1",
      root: {
        type: "Card",
        props: {
          Title: "{state.title}",
          Description: "{format.percent(state.cpu)}",
        },
        children: [
          { type: "Text", props: { Text: "Ready" } },
          { type: "Button", props: { Text: "Refresh", OnClick: "refresh" } },
        ],
      },
    }
  `);

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.schema.root.type, "Card");
    assert.equal(result.schema.root.children.length, 2);
  }
});

test("rejects unknown components and unsafe properties", () => {
  const result = parsePluginUiSchema(`
    {
      schema: "mcsl.ui.v1",
      root: {
        type: "WebView",
        props: { Html: "<script>alert(1)</script>", ClassName: "fixed" },
      },
    }
  `);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.diagnostics[0]?.code, "component_unknown");
  }
});

test("rejects invalid bindings and raw style properties", () => {
  const result = parsePluginUiSchema(`
    {
      schema: "mcsl.ui.v1",
      root: {
        type: "Text",
        props: {
          Text: "{state.items.map(x => x.name)}",
          Style: "color: red",
        },
      },
    }
  `);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(
      result.diagnostics.map((diagnostic) => diagnostic.code).join(","),
      /binding_invalid|prop_unknown/,
    );
  }
});

test("rejects raw HTML and inline script-like strings", () => {
  const result = parsePluginUiSchema(`
    {
      schema: "mcsl.ui.v1",
      root: {
        type: "Text",
        props: {
          Html: "<strong>unsafe</strong>",
          Text: "javascript:alert(1)",
        },
      },
    }
  `);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(
      result.diagnostics.map((diagnostic) => diagnostic.code).join(","),
      /prop_unknown|prop_script_forbidden/,
    );
  }
});

test("rejects design tokens outside the renderer allowlist", () => {
  const result = parsePluginUiSchema(`
    {
      schema: "mcsl.ui.v1",
      root: {
        type: "View",
        props: { Gap: "Spacing.Huge", Padding: "p-96" },
      },
    }
  `);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(
      result.diagnostics.map((diagnostic) => diagnostic.code).join(","),
      /token_invalid/,
    );
  }
});

test("validates select options and tabs items", () => {
  const result = parsePluginUiSchema(`
    {
      schema: "mcsl.ui.v1",
      root: {
        type: "View",
        children: [
          {
            type: "Select",
            props: {
              Value: "{state.mode}",
              Options: [
                { Value: "fast", Text: "Fast" },
                { Value: "safe", Text: "Safe" },
              ],
              OnChanged: "setMode",
            },
          },
          {
            type: "Tabs",
            props: {
              Value: "overview",
              Items: [
                {
                  Value: "overview",
                  Text: "Overview",
                  Children: [{ type: "Text", props: { Text: "OK" } }],
                },
              ],
            },
          },
        ],
      },
    }
  `);

  assert.equal(result.ok, true);
});

test("validates extension command event bindings", () => {
  const result = parsePluginUiSchema(`
    {
      schema: "mcsl.ui.v1",
      root: {
        type: "View",
        children: [
          {
            type: "Button",
            props: {
              Text: "Refresh",
              OnClick: {
                Command: "refresh",
                Params: {
                  mode: "{state.mode}",
                  selected: "{event.value}",
                  memory: "{format.bytes(state.metrics.memory)}",
                },
              },
            },
          },
          {
            type: "Select",
            props: {
              Value: "{state.mode}",
              OnChanged: { Command: "setMode", Params: { value: "{event.value}" } },
              Options: [{ Value: "safe", Text: "Safe" }],
            },
          },
        ],
      },
    }
  `);

  assert.equal(result.ok, true);
  if (result.ok) {
    const action = result.schema.root.children[0]?.props.OnClick;
    assert.deepEqual(action, {
      Command: "refresh",
      Params: {
        mode: "{state.mode}",
        selected: "{event.value}",
        memory: "{format.bytes(state.metrics.memory)}",
      },
    });
  }
});

test("rejects unsafe extension command bindings", () => {
  const result = parsePluginUiSchema(`
    {
      schema: "mcsl.ui.v1",
      root: {
        type: "Button",
        props: {
          Text: "Run",
          OnClick: {
            Command: "plugin refresh",
            Extra: true,
            Params: {
              __proto__: "polluted",
              value: "{state.items[0]}",
            },
          },
        },
      },
    }
  `);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(
      result.diagnostics.map((diagnostic) => diagnostic.code).join(","),
      /command_invalid|command_property_unknown|command_param_key_unsafe|binding_invalid/,
    );
  }
});

test("parses only state and allowed formatter bindings", () => {
  assert.deepEqual(parsePluginUiBinding("{state.instance.name}"), {
    kind: "state",
    path: ["instance", "name"],
  });
  assert.deepEqual(parsePluginUiBinding("{format.bytes(state.memory.used)}"), {
    kind: "format",
    formatter: "bytes",
    path: ["memory", "used"],
  });
  assert.equal(parsePluginUiBinding("{state.items[0]}"), null);
});
