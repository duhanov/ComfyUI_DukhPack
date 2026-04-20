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

function getFileNameFromPath(filePath) {
    if (!filePath) return "";
    return filePath.split("/").pop().split("\\").pop();
}

function buildServerPreviewUrl(filePath) {
    if (!filePath) return "";
    return `/dukhpack/file?path=${encodeURIComponent(filePath)}`;
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
        video.controls = false;
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = "metadata";
        video.src = fileUrl;
        video.style.width = "100%";
        video.style.maxHeight = "220px";

        video.addEventListener("loadeddata", () => {
            video.play().catch((err) => {
                console.warn("Video autoplay failed:", err);
            });
        });

        previewWrap.appendChild(video);
        return previewWrap;
    }

    const note = document.createElement("div");
    note.style.fontSize = "12px";
    note.style.opacity = "0.8";
    note.innerHTML = `Selected: <code>${escapeHtml(originalName)}</code>`;
    previewWrap.appendChild(note);
    return previewWrap;
}

async function fetchUploadedFiles() {
    const response = await fetch("/dukhpack/list_files");
    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch file list");
    }

    return data.files || [];
}

function enhanceLocalFileUploadNode(node) {
    if (node.__dukhUploadEnhanced) return;
    node.__dukhUploadEnhanced = true;

    const pathWidget = node.widgets?.find((w) => w.name === "file_path" && !w.element);
    if (!pathWidget) {
        console.warn("DukhPack upload: file_path widget not found");
        return;
    }

    const originalIndex = node.widgets.indexOf(pathWidget);

    pathWidget.type = "hidden";
    pathWidget.hidden = true;
    pathWidget.disabled = true;
    pathWidget.computeSize = () => [0, 0];
    pathWidget.serializeValue = () => pathWidget.value;
    pathWidget.draw = () => {};

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

    const refreshBtn = document.createElement("button");
    refreshBtn.type = "button";
    refreshBtn.textContent = "↻";
    refreshBtn.title = "Refresh file list";
    refreshBtn.style.cursor = "pointer";

    const hiddenInput = document.createElement("input");
    hiddenInput.type = "file";
    hiddenInput.style.display = "none";

    const pathInput = document.createElement("input");
    pathInput.type = "text";
    pathInput.value = pathWidget.value || "";
    pathInput.readOnly = true;
    pathInput.style.flex = "1";
    pathInput.style.minWidth = "160px";

    const select = document.createElement("select");
    select.style.width = "100%";
    select.style.boxSizing = "border-box";

    const status = document.createElement("div");
    status.style.fontSize = "12px";
    status.style.opacity = "0.8";
    status.textContent = "No file selected";

    const previewHost = document.createElement("div");
    previewHost.style.width = "100%";

    let filesCache = [];

    function setPath(v) {
        pathWidget.value = v || "";
        pathInput.value = v || "";
        app.graph.setDirtyCanvas(true, true);
    }

    function clearPreview() {
        previewHost.innerHTML = "";
    }

    function setPreview(filePath, originalName) {
        clearPreview();
        if (!filePath) return;
        const fileUrl = buildServerPreviewUrl(filePath);
        previewHost.appendChild(buildPreviewElement(fileUrl, originalName));
    }

    function fillSelect(files, currentPath = "") {
        select.innerHTML = "";

        const emptyOpt = document.createElement("option");
        emptyOpt.value = "";
        emptyOpt.textContent = "Select uploaded file...";
        select.appendChild(emptyOpt);

        for (const file of files) {
            const opt = document.createElement("option");
            opt.value = file.path;
            opt.textContent = file.name;
            if (currentPath && file.path === currentPath) {
                opt.selected = true;
            }
            select.appendChild(opt);
        }
    }

    async function reloadList(preselectPath = "") {
        try {
            status.textContent = "Loading file list...";
            filesCache = await fetchUploadedFiles();
            fillSelect(filesCache, preselectPath || pathWidget.value || "");
            status.textContent = filesCache.length ? "Ready" : "No uploaded files";
        } catch (err) {
            console.error(err);
            status.textContent = `Error: ${err.message || err}`;
        }
    }

    chooseBtn.addEventListener("click", () => hiddenInput.click());

    refreshBtn.addEventListener("click", async () => {
        await reloadList(pathWidget.value || "");
    });

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
            setPreview(data.path, file.name);
            status.textContent = "Uploaded";

            await reloadList(data.path);
        } catch (err) {
            console.error(err);
            status.textContent = `Error: ${err.message || err}`;
        }
    });

    select.addEventListener("change", () => {
        const selectedPath = select.value || "";
        setPath(selectedPath);

        if (!selectedPath) {
            clearPreview();
            status.textContent = "No file selected";
            return;
        }

        const fileName = getFileNameFromPath(selectedPath);
        setPreview(selectedPath, fileName);
        status.textContent = "Loaded from list";
    });

    topRow.appendChild(chooseBtn);
    topRow.appendChild(refreshBtn);
    topRow.appendChild(pathInput);

    wrap.appendChild(topRow);
    wrap.appendChild(select);
    wrap.appendChild(status);
    wrap.appendChild(previewHost);

    const domWidget = node.addDOMWidget("local_file_upload_dom", "custom", wrap, {
        getValue: () => pathWidget.value || "",
        setValue: (v) => setPath(v),
        serialize: true,
    });

    domWidget.name = "file_path";
    domWidget.serializeValue = () => pathWidget.value || "";
    domWidget.computeSize = (width) => [width || 360, 170];

    const oldIndex = node.widgets.indexOf(pathWidget);
    if (oldIndex !== -1) {
        node.widgets.splice(oldIndex, 1);
    }

    node.widgets.splice(originalIndex, 0, domWidget);

    if (pathWidget.value) {
        const originalName = getFileNameFromPath(pathWidget.value);
        setPreview(pathWidget.value, originalName);
        status.textContent = "Loaded from saved path";
    }

    reloadList(pathWidget.value || "");

    node.setSize([
        Math.max(node.size?.[0] || 460, 460),
        Math.max(node.size?.[1] || 280, 280),
    ]);

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