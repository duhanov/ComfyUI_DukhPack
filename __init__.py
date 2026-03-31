from .nodes.hex_palette_template_node import HexPaletteTemplateNode

NODE_CLASS_MAPPINGS = {
    "HexPaletteTemplateNode": HexPaletteTemplateNode,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "HexPaletteTemplateNode": "Flux Prompt Generator",
}

WEB_DIRECTORY = "./web"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]