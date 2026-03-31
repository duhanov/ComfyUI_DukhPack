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
            const size = node.computeSize ? node.computeSize() : node.size;
            if (size && node.setSize) {
                node.setSize([Math.max(size[0], 420), size[1]]);
            }
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

function replaceColorWidget(node, widgetName) {
    const original = node.widgets?.find((w) => w.name === widgetName);
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

    // Удаляем старый widget из layout
    const oldIndex = node.widgets.indexOf(original);
    if (oldIndex !== -1) {
        node.widgets.splice(oldIndex, 1);
    }

    // Ставим новый DOM widget на место старого
    moveWidgetToIndex(node, domWidget, originalIndex);
}

app.registerExtension({
    name: "DukhPack.HexPaletteTemplate",
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== "HexPaletteTemplateNode") return;

        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            const result = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;

            setTimeout(() => {
                replaceColorWidget(this, "color_1");
                replaceColorWidget(this, "color_2");
                replaceColorWidget(this, "color_3");
                replaceColorWidget(this, "color_4");
                replaceColorWidget(this, "color_5");
                refreshNode(this);
            }, 50);

            return result;
        };
    },
});