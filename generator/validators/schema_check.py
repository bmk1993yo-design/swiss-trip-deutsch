from functools import lru_cache

from jsonschema import Draft202012Validator

from config import SCHEMA_PATH
from utils import read_json


@lru_cache
def _validator() -> Draft202012Validator:
    schema = read_json(SCHEMA_PATH)
    Draft202012Validator.check_schema(schema)
    return Draft202012Validator(schema)


def check_schema(lesson: dict) -> list[str]:
    errors = sorted(_validator().iter_errors(lesson), key=lambda e: list(e.absolute_path))
    return [f"[스키마] {'/'.join(map(str, e.absolute_path)) or '(root)'}: {e.message}" for e in errors]
