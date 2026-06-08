import type { GalleryApiItem } from "./galleryApiTypes";

const sizeProp: GalleryApiItem = {
  name: "size",
  type: '"small" | "medium" | "large"',
  default: '"medium"',
  description: "Controls component density and text rhythm.",
};

const colorProp: GalleryApiItem = {
  name: "color",
  type: "ColorType",
  default: '"primary"',
  description: "Maps to the shared MCSL semantic color tokens.",
};

const disabledProp: GalleryApiItem = {
  name: "disabled",
  type: "boolean",
  default: "false",
  description: "Disables user interaction and applies the disabled visual state.",
};

const invalidProp: GalleryApiItem = {
  name: "invalid",
  type: "boolean",
  default: "false",
  description: "Applies invalid aria and danger border styling.",
};

const slotDefault: GalleryApiItem = {
  name: "default slot",
  type: "VNode",
  default: "-",
  description: "Primary visible content rendered by the component.",
};

export const galleryApiDocs: Record<string, GalleryApiItem[]> = {
  "/components/gaps": [
    {
      name: "component",
      type: "string",
      default: "-",
      description: "Component name from Naive UI or shadcn/ui parity tracking.",
    },
    {
      name: "status",
      type: '"missing" | "planned" | "done"',
      default: '"missing"',
      description: "Implementation status used to prioritize the UI library backlog.",
    },
  ],
  "/components/page-header": [
    { name: "title", type: "string", default: '""', description: "Main page heading." },
    { name: "subtitle", type: "string", default: '""', description: "Secondary descriptive text below the title." },
    { name: "actions slot", type: "VNode", default: "-", description: "Right-aligned page actions." },
  ],
  "/components/buttons": [
    { name: "type", type: '"default" | "primary" | "dashed" | "text"', default: '"default"', description: "Button visual treatment." },
    { ...colorProp, default: '"surface"' },
    sizeProp,
    { name: "icon", type: "string", default: '""', description: "Font icon classes rendered before or after the label." },
    { name: "iconPos", type: '"left" | "right"', default: '"left"', description: "Icon placement relative to the label." },
    { name: "loading", type: "boolean", default: "false", description: "Disables the button and shows the loading icon." },
    { name: "rounded", type: "boolean", default: "false", description: "Uses a full-radius button shape." },
    { name: "squared", type: "boolean", default: "false", description: "Forces icon-button square dimensions." },
    { name: "block", type: "boolean", default: "false", description: "Stretches the button to the parent width." },
    { name: "dropdownMenu", type: "DropdownItem[]", default: "[]", description: "SplitButton menu actions." },
  ],
  "/components/input": [
    { name: "modelValue", type: "string | number", default: '""', description: "Bound text or numeric value." },
    { name: "placeholder", type: "string", default: '""', description: "Hint text shown when empty." },
    sizeProp,
    disabledProp,
    invalidProp,
    { name: "rows", type: "number", default: "3", description: "Textarea visible row count." },
  ],
  "/components/number-box": [
    { name: "modelValue", type: "number", default: "0", description: "Bound numeric value." },
    { name: "min", type: "number", default: "-Infinity", description: "Minimum accepted value." },
    { name: "max", type: "number", default: "Infinity", description: "Maximum accepted value." },
    { name: "step", type: "number", default: "1", description: "Increment and decrement step." },
    sizeProp,
    disabledProp,
    invalidProp,
  ],
  "/components/select": [
    { name: "modelValue", type: "unknown", default: "undefined", description: "Selected option value." },
    { name: "options", type: "SelectOption[]", default: "[]", description: "Option labels, values, and disabled states." },
    { name: "placeholder", type: "string", default: '""', description: "Hint text shown before selection." },
    sizeProp,
    disabledProp,
    invalidProp,
  ],
  "/components/slider": [
    { name: "modelValue", type: "number", default: "0", description: "Current slider value." },
    { name: "min", type: "number", default: "0", description: "Lower range bound." },
    { name: "max", type: "number", default: "100", description: "Upper range bound." },
    { name: "step", type: "number", default: "1", description: "Value interval." },
    disabledProp,
  ],
  "/components/radio": [
    { name: "modelValue", type: "unknown", default: "undefined", description: "Selected radio value." },
    { name: "items", type: "RadioItem[]", default: "[]", description: "Radio labels, values, and disabled states." },
    sizeProp,
    disabledProp,
    invalidProp,
  ],
  "/components/checkbox": [
    { name: "modelValue", type: "boolean | null", default: "false", description: "Checked state. Null renders the mixed tri-state." },
    { name: "indeterminate", type: "boolean", default: "false", description: "Forces the mixed state without changing the model value." },
    { name: "icon", type: "string", default: '"fas fa-check"', description: "Icon classes for the checked state." },
    { name: "indeterminateIcon", type: "string", default: '"fas fa-minus"', description: "Icon classes for the mixed state." },
    colorProp,
    sizeProp,
    disabledProp,
    invalidProp,
    slotDefault,
  ],
  "/components/toggle": [
    { name: "modelValue", type: "boolean", default: "false", description: "Switch on/off state." },
    colorProp,
    sizeProp,
    disabledProp,
    invalidProp,
  ],
  "/components/message": [
    { name: "color", type: 'ColorType | "info"', default: '"info"', description: "Status color used for icon, background, and emphasis." },
    { name: "variant", type: '"soft" | "outlined" | "text"', default: '"soft"', description: "Borderless, outlined, or compact text message style." },
    { name: "title", type: "string", default: '""', description: "Optional title above message content." },
    { name: "icon", type: "string", default: "status icon", description: "Font icon classes. Defaults by status color." },
    { name: "closeable", type: "boolean", default: "false", description: "Shows a dismiss action and binds visible state." },
    { name: "visible", type: "boolean", default: "true", description: "v-model controlling visibility." },
    slotDefault,
  ],
  "/components/result": [
    { name: "title", type: "string", default: '""', description: "Result heading." },
    { name: "description", type: "string", default: '""', description: "Supporting result copy." },
    { name: "icon", type: "string", default: '""', description: "Large status icon classes." },
    colorProp,
    { name: "actions slot", type: "VNode", default: "-", description: "Action buttons below the result body." },
  ],
  "/components/empty": [
    { name: "title", type: "string", default: '"No data"', description: "Empty-state heading." },
    { name: "description", type: "string", default: '""', description: "Secondary empty-state copy." },
    { name: "icon", type: "string", default: "empty icon", description: "Icon classes for the empty illustration." },
    { name: "actions slot", type: "VNode", default: "-", description: "Optional recovery actions." },
  ],
  "/components/divider": [
    { name: "vertical", type: "boolean", default: "false", description: "Switches between horizontal and vertical divider layout." },
    { name: "text", type: "string", default: '""', description: "Optional inline label." },
    { name: "placement", type: '"left" | "center" | "right"', default: '"center"', description: "Label placement on horizontal dividers." },
  ],
  "/components/copyable-text": [
    { name: "text", type: "string", default: '""', description: "Text copied to the clipboard." },
    { name: "copiedText", type: "string", default: '"Copied"', description: "Feedback label after copy succeeds." },
    { name: "icon", type: "string", default: "copy icon", description: "Copy action icon classes." },
  ],
  "/components/skeleton": [
    { name: "rows", type: "number", default: "3", description: "Number of placeholder rows." },
    { name: "animated", type: "boolean", default: "true", description: "Enables shimmer animation." },
    { name: "round", type: "boolean", default: "false", description: "Uses pill-shaped placeholder edges." },
  ],
  "/components/navigation": [
    { name: "items", type: "NavigationItem[]", default: "[]", description: "Navigation links and nested entries." },
    { name: "active", type: "string", default: '""', description: "Current route or selected item key." },
    { name: "collapsed", type: "boolean", default: "false", description: "Compact navigation mode where supported." },
  ],
  "/components/breadcrumbs": [
    { name: "items", type: "BreadcrumbItem[]", default: "[]", description: "Ordered breadcrumb labels and optional links." },
    { name: "separator", type: "string", default: '"/"', description: "Separator text or icon between items." },
  ],
  "/components/sidebar": [
    { name: "pages", type: "SidebarPage[]", default: "[]", description: "Sidebar links with label and route." },
    { name: "active", type: "string", default: "current route", description: "Active route used for visual selection." },
  ],
  "/components/nav-tabs": [
    { name: "tabs", type: "NavTab[]", default: "[]", description: "Tab labels, route keys, and disabled states." },
    { name: "modelValue", type: "string", default: '""', description: "Selected tab key where controlled." },
  ],
  "/components/dropdown": [
    { name: "items", type: "DropdownItem[]", default: "[]", description: "Menu labels, icons, disabled states, and click handlers." },
    { name: "placement", type: "FloatingPlacement", default: '"bottom-start"', description: "Floating menu placement." },
    { name: "closeOnClick", type: "boolean", default: "true", description: "Closes the menu after choosing an item." },
    { name: "trigger slot", type: "VNode", default: "-", description: "Element used to open the dropdown." },
  ],
  "/components/drawer": [
    { name: "visible", type: "boolean", default: "false", description: "v-model controlling drawer visibility." },
    { name: "placement", type: '"left" | "right" | "top" | "bottom"', default: '"right"', description: "Drawer entrance side." },
    { name: "title", type: "string", default: '""', description: "Drawer header title." },
    { name: "closeOnEsc", type: "boolean", default: "true", description: "Allows Escape to close the drawer." },
    slotDefault,
  ],
  "/components/confirm-dialog": [
    { name: "visible", type: "boolean", default: "false", description: "v-model controlling dialog visibility." },
    { name: "title", type: "string", default: '""', description: "Dialog heading." },
    { name: "message", type: "string", default: '""', description: "Confirmation body copy." },
    { name: "confirmText", type: "string", default: '"Confirm"', description: "Primary action label." },
    { name: "cancelText", type: "string", default: '"Cancel"', description: "Secondary action label." },
  ],
  "/components/tooltip": [
    { name: "content", type: "string", default: '""', description: "Tooltip body text." },
    { name: "placement", type: "FloatingPlacement", default: '"top"', description: "Tooltip placement around the trigger." },
    { name: "trigger slot", type: "VNode", default: "-", description: "Element receiving the tooltip." },
  ],
  "/components/popover": [
    { name: "title", type: "string", default: '""', description: "Optional popover heading." },
    { name: "placement", type: "FloatingPlacement", default: '"bottom"', description: "Popover placement around the trigger." },
    { name: "trigger slot", type: "VNode", default: "-", description: "Element used to open the popover." },
    slotDefault,
  ],
  "/components/modal": [
    { name: "visible", type: "boolean", default: "false", description: "v-model controlling modal visibility." },
    { name: "header", type: "string", default: '""', description: "Modal heading text." },
    { name: "maxWidth", type: "string", default: '"560px"', description: "Maximum dialog width." },
    { name: "closeOnEsc", type: "boolean", default: "true", description: "Allows Escape to close the modal." },
    { name: "closeOnClickOutside", type: "boolean", default: "true", description: "Allows backdrop clicks to close the modal." },
  ],
  "/components/contextmenu": [
    { name: "items", type: "DropdownItem[]", default: "[]", description: "Context menu actions and separators." },
    { name: "parent", type: "HTMLElement | Window", default: "window", description: "Element whose right-click events open the menu." },
    { name: "closeOnClick", type: "boolean", default: "true", description: "Closes the menu after choosing an item." },
  ],
  "/components/progress": [
    { name: "value", type: "number", default: "0", description: "Current progress value." },
    { name: "max", type: "number", default: "100", description: "Upper progress bound." },
    colorProp,
    sizeProp,
    { name: "indeterminate", type: "boolean", default: "false", description: "Shows ongoing activity without a numeric value." },
  ],
  "/components/pagination": [
    { name: "page", type: "number", default: "1", description: "v-model current page." },
    { name: "length", type: "number", default: "1", description: "Total page count." },
    { name: "itemPerPage", type: "number", default: "10", description: "Items per page for item pagination." },
    { name: "total", type: "number", default: "0", description: "Total item count." },
    sizeProp,
  ],
  "/components/upload": [
    { name: "files", type: "File[]", default: "[]", description: "v-model selected files." },
    { name: "accept", type: "string", default: '""', description: "Accepted MIME types or file extensions." },
    { name: "multiple", type: "boolean", default: "false", description: "Allows multiple file selection." },
    { name: "maxCount", type: "number", default: "Infinity", description: "Maximum selected file count." },
  ],
  "/components/avatar": [
    { name: "src", type: "string", default: '""', description: "Image source URL." },
    { name: "name", type: "string", default: '""', description: "Fallback initials source." },
    sizeProp,
    { name: "round", type: "boolean", default: "true", description: "Uses a circular avatar shape." },
  ],
  "/components/tag": [
    { name: "color", type: "Color", default: '"surface"', description: "Tag color token." },
    { name: "closable", type: "boolean", default: "false", description: "Shows a close action when supported." },
    sizeProp,
    slotDefault,
  ],
  "/components/table": [
    { name: "columns", type: "string[]", default: "[]", description: "Column header labels." },
    { name: "rows", type: "(string | number)[][]", default: "[]", description: "Primitive cell values rendered row by row." },
  ],
  "/components/kbd": [
    { name: "keys", type: "string | string[]", default: '""', description: "Keyboard key labels." },
    sizeProp,
    { name: "plus", type: "boolean", default: "true", description: "Shows separators between multiple keys." },
  ],
  "/components/editor": [
    { name: "modelValue", type: "string", default: '""', description: "Editor content." },
    { name: "language", type: "string", default: '"text"', description: "CodeEditor syntax language." },
    { name: "placeholder", type: "string", default: '""', description: "Hint text when the editor is empty." },
    { name: "readonly", type: "boolean", default: "false", description: "Prevents editing while keeping content selectable." },
  ],
  "/components/compositions": [
    { name: "composition", type: "VNode", default: "-", description: "Reusable layout made from MCSL UI primitives." },
    { name: "actions slot", type: "VNode", default: "-", description: "Contextual actions embedded in the composed surface." },
  ],
};

export const defaultGalleryApiDocs: GalleryApiItem[] = [
  {
    name: "props",
    type: "Record<string, unknown>",
    default: "{}",
    description: "This page documents a composed pattern. See its source components for detailed props.",
  },
];
