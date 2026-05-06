from .nodes.hex_palette_template_node import HexPaletteTemplateNode
from .nodes.flux_colors_builder_node import FluxColorsBuilderNode
from .nodes.flux_promp_generator import FluxPromptGenerator
from .nodes.local_file_upload_node import LocalFileUploadNode
from .nodes.resolution_preset_node import ResolutionPresetNode


NODE_CLASS_MAPPINGS = {
    "HexPaletteTemplateNode": HexPaletteTemplateNode,
    "FluxColorsBuilderNode": FluxColorsBuilderNode,
    "FluxPromptGenerator": FluxPromptGenerator,
    "LocalFileUploadNode": LocalFileUploadNode,
    "ResolutionPresetNode": ResolutionPresetNode,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "HexPaletteTemplateNode": "Flux Prompt Generator",
    "FluxColorsBuilderNode": "JSON Color Builder",
    "FluxPromptGenerator": "Prompt Generator from Template",
    "LocalFileUploadNode": "Local File Upload",
    "ResolutionPresetNode": "Resolution Presets",
}

WEB_DIRECTORY = "./web"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]