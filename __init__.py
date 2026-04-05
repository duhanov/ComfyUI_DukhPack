from .nodes.hex_palette_template_node import HexPaletteTemplateNode
from .nodes.flux_colors_builder_node import FluxColorsBuilderNode
from .nodes.flux_promp_generator import FluxPromptGenerator


NODE_CLASS_MAPPINGS = {
    "HexPaletteTemplateNode": HexPaletteTemplateNode,
    "FluxColorsBuilderNode": FluxColorsBuilderNode,
    "FluxPromptGenerator": FluxPromptGenerator,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "HexPaletteTemplateNode": "Flux Prompt Generator",
    "FluxColorsBuilderNode": "JSON Color Builder",
    "FluxPromptGenerator": "Prompt Generator from Template"
}

WEB_DIRECTORY = "./web"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]