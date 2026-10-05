from abc import ABC, abstractmethod


class ContentProvider(ABC):
    """레슨 JSON을 만들어 주는 LLM. generate()는 파싱된 dict를 돌려준다."""

    name: str

    @abstractmethod
    def generate(self, system: str, user: str, schema: dict) -> dict: ...
