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


class FluxPromptGenerator:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "template": ("STRING", {
                    "default": """{
  "scene": "{str1}",
  "subjects": [
    {
      "description": "{str1}",
      "position": "center",
      "action": "looking at camera"
    }
  ],
  "style": "hyperrealistic cinematic, ultra clean, futuristic",
  "details": "ultra subtle thin steam rising from the mug, barely visible, soft smooth vapor trails, slightly unnatural perfect flow, clean sterile look, no smoke, no fog, no chaos",
  "color_palette": {str2},
  "lighting": "soft sterile lighting with slight green tint (#5f7f7a), warm unnatural skin highlights (#ffccaa), no visible light sources",
  "mood": "ideal, depressive, dull",
  "background": "office",
  "composition": "rule of thirds",
  "camera": {
    "angle": "eye-level",
    "lens": "12mm lens",
    "depth_of_field": "Shallow depth of field"
  }
}""",
                    "multiline": True
                }),
            },
            "optional": {
                "colors_json": ("STRING", {"forceInput": True}),
                "str1": ("STRING", {"forceInput": True}),
                "str2": ("STRING", {"forceInput": True}),
                "str3": ("STRING", {"forceInput": True}),
                "str4": ("STRING", {"forceInput": True}),
                "str5": ("STRING", {"forceInput": True}),
                "str6": ("STRING", {"forceInput": True}),
                "str7": ("STRING", {"forceInput": True}),
                "str8": ("STRING", {"forceInput": True}),
                "str9": ("STRING", {"forceInput": True}),
                "str10": ("STRING", {"forceInput": True}),
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("result_text",)
    FUNCTION = "build_text"
    CATEGORY = "DukhPack"

    def build_text(
        self,
        template,
        str1=None,
        str2=None,
        str3=None,
        str4=None,
        str5=None,
        str6=None,
        str7=None,
        str8=None,
        str9=None,
        str10=None,
    ):

        result_text = template
        result_text = result_text.replace("{str1}", "" if str1 is None else str(str1))
        result_text = result_text.replace("{str2}", "" if str2 is None else str(str2))
        result_text = result_text.replace("{str3}", "" if str3 is None else str(str3))
        result_text = result_text.replace("{str4}", "" if str4 is None else str(str4))
        result_text = result_text.replace("{str5}", "" if str5 is None else str(str5))
        result_text = result_text.replace("{str6}", "" if str6 is None else str(str6))
        result_text = result_text.replace("{str7}", "" if str7 is None else str(str7))
        result_text = result_text.replace("{str8}", "" if str8 is None else str(str8))
        result_text = result_text.replace("{str9}", "" if str9 is None else str(str9))
        result_text = result_text.replace("{str10}", "" if str10 is None else str(str10))
    
        return (result_text,)