_RESOLUTION_CHOICES = [
    "[16:9] 768x432",
    "[16:9] 1536x864",
    "[16:9] 3072x1728",
]

_RESOLUTION_MAP = {
    "[16:9] 768x432": (768, 432),
    "[16:9] 1536x864": (1536, 864),
    "[16:9] 3072x1728": (3072, 1728),
}


class ResolutionPresetNode:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "resolution": (_RESOLUTION_CHOICES, {"default": _RESOLUTION_CHOICES[0]}),
            }
        }

    RETURN_TYPES = ("INT", "INT")
    RETURN_NAMES = ("width", "height")
    FUNCTION = "resolve"
    CATEGORY = "DukhPack"

    def resolve(self, resolution):
        w, h = _RESOLUTION_MAP[resolution]
        return (w, h)
