import { app } from "../../scripts/app.js";

console.log("DUKHPACK local_file_upload.js loaded");

function escapeHtml(text) {
    return String(text ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function isAudioFile(name) {
    return /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(name || "");
}

function isVideoFile(name) {
    return /\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(name || "");
}

function buildPreviewElement(fileUrl, originalName) {
    const previewWrap = document.createElement("div");
    previewWrap.style.width = "100%";
    previewWrap.style.marginTop = "8px";

    if (isAudioFile(originalName)) {
        const audio = document.createElement("audio");
        audio.controls = true;
        audio.src = fileUrl;
        audio.style.width = "100%";
        previewWrap.appendChild(audio);
        return previewWrap;
    }

    if (isVideoFile(originalName)) {
        const video = document.createElement("video");
        video.controls = true;
        video.src = fileUrl;
        video.style.width = "100%";
        video.style.maxHeight = "220px";
        previewWrap.appendChild(video);
        return previewWrap;
    }

    const note = document.createElement("div");
    note.style.fontSize = "12px";
    note.style.opacity = "0.8";
    note.innerHTML = `Uploaded: <code>${escapeHtml(originalName)}</code>`;
    previewWrap.appendChild(note);
    return previewWrap;
}

function enhanceLocalFileUploadNode(node) {
    if (node.__dukhUploadEnhanced) return;
    node.__dukhUploadEnhanced = true;

    const pathWidget = node.widgets?.find((w) => w.name === "file_path");
    if (!pathWidget) {
        console.warn("DukhPack upload: file_path widget not found");
        return;
    }

    const originalIndex = node.widgets.indexOf(pathWidget);

    pathWidget.type = "hidden";
    pathWidget.hidden = true;
    pathWidget.computeSize = () => [0, 0];

    const wrap = document.createElement("div");
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column";
    wrap.style.gap = "8px";
    wrap.style.width = "100%";
    wrap.style.boxSizing = "border-box";

    const topRow = document.createElement("div");
    topRow.style.display = "flex";
    topRow.style.gap = "8px";
    topRow.style.alignItems = "center";

    const chooseBtn = document.createElement("button");
    chooseBtn.type = "button";
    chooseBtn.textContent = "Choose file";
    chooseBtn.style.cursor = "pointer";

    const hiddenInput = document.createElement("input");
    hiddenInput.type = "file";
    hiddenInput.style.display = "none";

    const pathInput = document.createElement("input");
    pathInput.type = "text";
    pathInput.value = pathWidget.value || "";
    pathInput.readOnly = true;
    pathInput.style.flex = "1";
    pathInput.style.minWidth = "160px";

    const status = document.createElement("div");
    status.style.fontSize = "12px";
    status.style.opacity = "0.8";

    const previewHost = document.createElement("div");
    previewHost.style.width = "100%";

    function setPath(v) {
        pathWidget.value = v || "";
        pathInput.value = v || "";
        app.graph.setDirtyCanvas(true, true);
    }

    function clearPreview() {
        previewHost.innerHTML = "";
    }

    function setPreview(fileUrl, originalName) {
        clearPreview();
        previewHost.appendChild(buildPreviewElement(fileUrl, originalName));
    }

    chooseBtn.addEventListener("click", () => hiddenInput.click());

    hiddenInput.addEventListener("change", async () => {
        const file = hiddenInput.files?.[0];
        if (!file) return;

        status.textContent = "Uploading...";

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/dukhpack/upload", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Upload failed");
            }

            setPath(data.path);
            status.textContent = "Uploaded";

            // preview через blob url локального файла
            const localObjectUrl = URL.createObjectURL(file);
            setPreview(localObjectUrl, file.name);
        } catch (err) {
            console.error(err);
            status.textContent = `Error: ${err.message || err}`;
        }
    });

    topRow.appendChild(chooseBtn);
    topRow.appendChild(hiddenInput);
    topRow.appendChild(pathInput);

    wrap.appendChild(topRow);
    wrap.appendChild(status);
    wrap.appendChild(previewHost);

    const domWidget = node.addDOMWidget("local_file_upload_dom", "custom", wrap, {
        getValue: () => pathWidget.value || "",
        setValue: (v) => setPath(v),
        serialize: true,
    });

    domWidget.name = "file_path";
    domWidget.serializeValue = () => pathWidget.value || "";
    domWidget.computeSize = (width) => [width || 360, 120];

    const oldIndex = node.widgets.indexOf(pathWidget);
    if (oldIndex !== -1) {
        node.widgets.splice(oldIndex, 1);
    }

    node.widgets.splice(originalIndex, 0, domWidget);

    node.setSize([Math.max(node.size?.[0] || 420, 420), Math.max(node.size?.[1] || 180, 180)]);
    app.graph.setDirtyCanvas(true, true);
}

app.registerExtension({
    name: "DukhPack.LocalFileUpload",
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== "LocalFileUploadNode") return;

        const onNodeCreated = nodeType.prototype.onNodeCreated;

        nodeType.prototype.onNodeCreated = function () {
            const result = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;

            setTimeout(() => {
                enhanceLocalFileUploadNode(this);
            }, 50);

            return result;
        };
    },
});