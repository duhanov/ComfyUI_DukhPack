import uuid
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


@PromptServer.instance.routes.post("/dukhpack/upload")
async def dukhpack_upload(request):
    reader = await request.multipart()
    field = await reader.next()

    if field is None or field.name != "file":
        return web.json_response({"error": "No file field provided"}, status=400)

    filename = field.filename or "upload.bin"
    ext = Path(filename).suffix
    safe_name = f"{uuid.uuid4().hex}{ext}"

    upload_dir = get_upload_dir()
    file_path = upload_dir / safe_name

    with open(file_path, "wb") as f:
        while True:
            chunk = await field.read_chunk()
            if not chunk:
                break
            f.write(chunk)

    return web.json_response({
        "success": True,
        "path": str(file_path),  # абсолютный путь
        "input_relative_path": f"{UPLOAD_SUBDIR}/{safe_name}",
        "filename": filename,
        "stored_filename": safe_name,
    })


@PromptServer.instance.routes.get("/dukhpack/file")
async def dukhpack_file(request):
    path = request.query.get("path", "")
    if not path:
        return web.Response(status=400, text="Missing path")

    try:
        file_path = Path(path).resolve()
    except Exception:
        return web.Response(status=400, text="Invalid path")

    if not file_path.exists() or not file_path.is_file():
        return web.Response(status=404, text="File not found")

    input_dir = Path(get_input_directory()).resolve()

    try:
        file_path.relative_to(input_dir)
    except ValueError:
        return web.Response(status=403, text="Access denied")

    return web.FileResponse(file_path)


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