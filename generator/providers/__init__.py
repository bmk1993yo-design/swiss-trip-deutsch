from .base import ContentProvider


def get_provider() -> ContentProvider:
    from .gemini import GeminiProvider

    return GeminiProvider()
