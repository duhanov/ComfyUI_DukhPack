from pathlib import Path

from aiohttp import web
from folder_paths import get_input_directory
from server import PromptServer


UPLOAD_SUBDIR = "dukhpack_uploads"


def get_upload_dir() -> Path:
    input_dir = Path(get_input_directory()).resolve()
    upload_dir = input_dir / UPLOAD_SUBDIR
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


def sanitize_filename(filename: str) -> str:
    filename = Path(filename).name.strip()

    allowed = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.() []")
    cleaned = "".join(ch for ch in filename if ch in allowed)

    if not cleaned:
        cleaned = "upload.bin"

    return cleaned


def ensure_unique_filename(upload_dir: Path, filename: str) -> str:
    candidate = upload_dir / filename
    if not candidate.exists():
        return filename

    stem = candidate.stem
    suffix = candidate.suffix

    counter = 1
    while True:
        new_name = f"{stem}_{counter}{suffix}"
        new_candidate = upload_dir / new_name
        if not new_candidate.exists():
            return new_name
        counter += 1


def to_input_relative_path(file_path: Path) -> str:
    input_dir = Path(get_input_directory()).resolve()
    return str(file_path.resolve().relative_to(input_dir)).replace("\\", "/")


@PromptServer.instance.routes.post("/dukhpack/upload")
async def dukhpack_upload(request):
    reader = await request.multipart()
    field = await reader.next()

    if field is None or field.name != "file":
        return web.json_response({"error": "No file field provided"}, status=400)

    original_filename = field.filename or "upload.bin"
    safe_name = sanitize_filename(original_filename)

    upload_dir = get_upload_dir()
    final_name = ensure_unique_filename(upload_dir, safe_name)
    file_path = upload_dir / final_name

    with open(file_path, "wb") as f:
        while True:
            chunk = await field.read_chunk()
            if not chunk:
                break
            f.write(chunk)

    return web.json_response({
        "success": True,
        "path": str(file_path),
        "input_relative_path": to_input_relative_path(file_path),
        "filename": original_filename,
        "stored_filename": final_name,
    })


@PromptServer.instance.routes.get("/dukhpack/file")
async def dukhpack_file(request):
    path = request.query.get("path", "")
    if not path:
        return web.Response(status=400, text="Missing path")

    input_dir = Path(get_input_directory()).resolve()

    try:
        requested = Path(path)
        if requested.is_absolute():
            file_path = requested.resolve()
        else:
            file_path = (input_dir / requested).resolve()
    except Exception:
        return web.Response(status=400, text="Invalid path")

    if not file_path.exists() or not file_path.is_file():
        return web.Response(status=404, text="File not found")

    try:
        file_path.relative_to(input_dir)
    except ValueError:
        return web.Response(status=403, text="Access denied")

    return web.FileResponse(file_path)


@PromptServer.instance.routes.get("/dukhpack/list_files")
async def dukhpack_list_files(request):
    upload_dir = get_upload_dir()
    input_dir = Path(get_input_directory()).resolve()

    items = []
    for p in sorted(upload_dir.iterdir(), key=lambda x: x.stat().st_mtime, reverse=True):
        if not p.is_file():
            continue
        items.append({
            "name": p.name,
            "path": str(p),
            "input_relative_path": str(p.resolve().relative_to(input_dir)).replace("\\", "/"),
            "size": p.stat().st_size,
        })

    return web.json_response({
        "success": True,
        "files": items,
    })


class LocalFileUploadNode:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "file_path": ("STRING", {"default": "", "multiline": False}),
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("file_path",)
    FUNCTION = "get_file_path"
    CATEGORY = "DukhPack"

    def get_file_path(self, file_path):
        return (file_path,)