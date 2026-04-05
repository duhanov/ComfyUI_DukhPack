import { app } from "../../scripts/app.js";

console.log("DUKHPACK JS LOADED", { hasApp: !!app });

function isValidHex(value) {
    return typeof value === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}

function normalizeHex(value) {
    if (typeof value !== "string") return "";
    value = value.trim();

    if (!value) return "";

    if (!value.startsWith("#")) value = "#" + value;
    if (!isValidHex(value)) return "";

    if (value.length === 4) {
        value =
            "#" +
            value[1] + value[1] +
            value[2] + value[2] +
            value[3] + value[3];
    }

    return value.toLowerCase();
}

function refreshNode(node) {
    requestAnimationFrame(() => {
        try {
            app.graph.setDirtyCanvas(true, true);
        } catch (err) {
            console.error("refreshNode failed", err);
        }
    });
}

function moveWidgetToIndex(node, widget, targetIndex) {
    const currentIndex = node.widgets.indexOf(widget);
    if (currentIndex === -1 || currentIndex === targetIndex) return;

    node.widgets.splice(currentIndex, 1);
    node.widgets.splice(targetIndex, 0, widget);
}

function removeWidgetByRef(node, widget) {
    const i = node.widgets.indexOf(widget);
    if (i !== -1) node.widgets.splice(i, 1);
}

function removeDuplicateTemplateDomWidgets(node) {
    const toRemove = (node.widgets || []).filter(
        (w) => w && (w.name === "template_dom" || w.name === "template_dom_widget")
    );

    for (const w of toRemove) {
        removeWidgetByRef(node, w);
    }
}

function replaceTemplateWidget(node) {
    if (node.__dukhTemplateDone) return;
    node.__dukhTemplateDone = true;

    removeDuplicateTemplateDomWidgets(node);

    const original = node.widgets?.find(
        (w) => w.name === "template" && !w.element
    );
    if (!original || original.__dukhReplaced) return;

    const index = node.widgets.indexOf(original);
    original.__dukhReplaced = true;

    original.type = "hidden";
    original.hidden = true;
    original.disabled = true;
    original.computeSize = () => [0, 0];
    original.serializeValue = () => original.value;
    original.draw = () => {};

    const wrap = document.createElement("div");
    wrap.style.width = "100%";
    wrap.style.margin = "0";
    wrap.style.padding = "0";
    wrap.style.boxSizing = "border-box";

    const textarea = document.createElement("textarea");
    textarea.style.display = "block";
    textarea.style.width = "100%";
    textarea.style.height = "320px";
    textarea.style.minHeight = "320px";
    textarea.style.maxHeight = "320px";
    textarea.style.resize = "none";
    textarea.style.padding = "8px";
    textarea.style.margin = "0";
    textarea.style.boxSizing = "border-box";
    textarea.style.border = "1px solid #777";
    textarea.style.borderRadius = "4px";
    textarea.style.background = "transparent";
    textarea.style.color = "inherit";
    textarea.style.overflow = "auto";

    const sync = () => {
        original.value = textarea.value;
        app.graph.setDirtyCanvas(true, true);
    };

    textarea.addEventListener("input", sync);
    textarea.value = original.value || "Palette: {colors}";

    wrap.appendChild(textarea);

    const domWidget = node.addDOMWidget("template_dom_widget", "custom", wrap, {
        getValue: () => textarea.value,
        setValue: (v) => {
            textarea.value = v ?? "";
            original.value = textarea.value;
        },
        serialize: true,
    });

    domWidget.name = "template_dom";
    domWidget.serializeValue = () => textarea.value;
    domWidget.computeSize = (width) => [width || 360, 330];

    removeWidgetByRef(node, original);
    moveWidgetToIndex(node, domWidget, index);

    node.__dukhTemplateTextarea = textarea;
    node.__dukhTemplateWidget = domWidget;

    updateTemplateLayout(node);
}

function replaceColorWidget(node, widgetName) {
    node.__dukhColorDone = node.__dukhColorDone || {};
    if (node.__dukhColorDone[widgetName]) return;
    node.__dukhColorDone[widgetName] = true;

    const original = node.widgets?.find((w) => w.name === widgetName && !w.element);
    if (!original || original.__dukhReplaced) return;

    const originalIndex = node.widgets.indexOf(original);
    original.__dukhReplaced = true;

    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "8px";
    row.style.width = "100%";
    row.style.margin = "0";
    row.style.padding = "0";

    const swatchWrap = document.createElement("div");
    swatchWrap.style.position = "relative";
    swatchWrap.style.width = "22px";
    swatchWrap.style.height = "22px";
    swatchWrap.style.flex = "0 0 auto";

    const preview = document.createElement("div");
    preview.style.width = "22px";
    preview.style.height = "22px";
    preview.style.border = "1px solid #777";
    preview.style.borderRadius = "4px";
    preview.style.boxSizing = "border-box";
    preview.style.cursor = "pointer";

    const picker = document.createElement("input");
    picker.type = "color";
    picker.style.position = "absolute";
    picker.style.inset = "0";
    picker.style.width = "22px";
    picker.style.height = "22px";
    picker.style.opacity = "0";
    picker.style.cursor = "pointer";
    picker.style.border = "0";
    picker.style.padding = "0";
    picker.style.margin = "0";

    const input = document.createElement("input");
    input.type = "text";
    input.style.flex = "1";
    input.style.minWidth = "120px";
    input.style.height = "28px";
    input.style.lineHeight = "28px";
    input.style.padding = "0 8px";
    input.style.margin = "0";
    input.style.boxSizing = "border-box";
    input.style.border = "1px solid #777";
    input.style.borderRadius = "4px";
    input.style.background = "transparent";
    input.style.color = "inherit";

    const EMPTY_PICKER_FALLBACK = "#000000";

    const sync = (raw) => {
        const hex = normalizeHex(raw);

        original.value = hex;
        input.value = hex;

        if (hex) {
            preview.style.background = hex;
            picker.value = hex;
        } else {
            preview.style.background = "transparent";
            picker.value = EMPTY_PICKER_FALLBACK;
        }

        app.graph.setDirtyCanvas(true, true);
    };

    picker.addEventListener("input", () => sync(picker.value));
    input.addEventListener("change", () => sync(input.value));
    input.addEventListener("blur", () => sync(input.value));

    sync(original.value || "");

    swatchWrap.appendChild(preview);
    swatchWrap.appendChild(picker);
    row.appendChild(swatchWrap);
    row.appendChild(input);

    const domWidget = node.addDOMWidget(`${widgetName}_dom`, "custom", row, {
        getValue: () => original.value,
        setValue: (v) => sync(v),
        serialize: true,
    });

    domWidget.name = widgetName;
    domWidget.serializeValue = () => original.value;
    domWidget.computeSize = () => [node.size?.[0] ? node.size[0] - 40 : 360, 30];

    const oldIndex = node.widgets.indexOf(original);
    if (oldIndex !== -1) {
        node.widgets.splice(oldIndex, 1);
    }

    moveWidgetToIndex(node, domWidget, originalIndex);
}

function updateTemplateLayout(node) {
    const textarea = node.__dukhTemplateTextarea;
    const domWidget = node.__dukhTemplateWidget;
    if (!textarea || !domWidget) return;

    const nodeWidth = node.size?.[0] || 520;
    const nodeHeight = node.size?.[1] || 700;

    const reservedTop = 300;
    const minHeight = 320;
    const textareaHeight = Math.max(minHeight, nodeHeight - reservedTop);

    textarea.style.width = "100%";
    textarea.style.height = `${textareaHeight}px`;
    textarea.style.minHeight = `${textareaHeight}px`;
    textarea.style.maxHeight = `${textareaHeight}px`;
    textarea.style.resize = "none";
    textarea.style.boxSizing = "border-box";

    domWidget.computeSize = (width) => [
        Math.max(260, (width || nodeWidth) - 40),
        textareaHeight + 10
    ];
}

function enhanceLegacyNode(node) {
    if (node.__dukhEnhancedLegacy) return;
    node.__dukhEnhancedLegacy = true;

    node.setSize([520, 700]);

    replaceColorWidget(node, "color_1");
    replaceColorWidget(node, "color_2");
    replaceColorWidget(node, "color_3");
    replaceColorWidget(node, "color_4");
    replaceColorWidget(node, "color_5");
    replaceTemplateWidget(node);

    updateTemplateLayout(node);
    refreshNode(node);
}

function enhanceColorsBuilderNode(node) {
    if (node.__dukhEnhancedBuilder) return;
    node.__dukhEnhancedBuilder = true;

    node.setSize([420, 360]);

    replaceColorWidget(node, "color_1");
    replaceColorWidget(node, "color_2");
    replaceColorWidget(node, "color_3");
    replaceColorWidget(node, "color_4");
    replaceColorWidget(node, "color_5");

    refreshNode(node);
}

app.registerExtension({
    name: "DukhPack.HexPaletteTemplate",
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (
            nodeData.name !== "HexPaletteTemplateNode" &&
            nodeData.name !== "FluxColorsBuilderNode"
        ) return;

        const onNodeCreated = nodeType.prototype.onNodeCreated;
        const onResize = nodeType.prototype.onResize;

        nodeType.prototype.onNodeCreated = function () {
            const result = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;

            setTimeout(() => {
                if (nodeData.name === "HexPaletteTemplateNode") {
                    enhanceLegacyNode(this);
                }

                if (nodeData.name === "FluxColorsBuilderNode") {
                    enhanceColorsBuilderNode(this);
                }
            }, 50);

            return result;
        };

        nodeType.prototype.onResize = function () {
            const result = onResize ? onResize.apply(this, arguments) : undefined;

            if (nodeData.name === "HexPaletteTemplateNode" && this.__dukhEnhancedLegacy) {
                updateTemplateLayout(this);
            }

            return result;
        };
    },
});