import json
import re


HEX_RE = re.compile(r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")


def normalize_hex(value: str):
    if not isinstance(value, str):
        return None

    value = value.strip()
    if not value:
        return None

    if not value.startswith("#"):
        value = f"#{value}"

    if not HEX_RE.match(value):
        return None

    if len(value) == 4:
        value = "#" + "".join(ch * 2 for ch in value[1:])

    return value.lower()


class HexPaletteTemplateNode:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "color_1": ("STRING", {"default": "", "multiline": False}),
                "color_2": ("STRING", {"default": "", "multiline": False}),
                "color_3": ("STRING", {"default": "", "multiline": False}),
                "color_4": ("STRING", {"default": "", "multiline": False}),
                "color_5": ("STRING", {"default": "", "multiline": False}),
                "template": ("STRING", {
                    "default": "Palette: {colors}",
                    "multiline": True
                }),
            }
        }

    RETURN_TYPES = ("STRING", "STRING")
    RETURN_NAMES = ("result_text", "colors_json")
    FUNCTION = "build_text"
    CATEGORY = "DukhPack"

    def build_text(self, color_1, color_2, color_3, color_4, color_5, template):
        raw_colors = [
            normalize_hex(color_1),
            normalize_hex(color_2),
            normalize_hex(color_3),
            normalize_hex(color_4),
            normalize_hex(color_5),
        ]

        colors = [c for c in raw_colors if c is not None]

        colors_json = json.dumps(colors, ensure_ascii=False)
        result_text = template.replace("{colors}", colors_json)

        return (result_text, colors_json)