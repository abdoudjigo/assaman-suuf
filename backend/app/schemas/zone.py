from typing import Any

from pydantic import BaseModel, ConfigDict


class ZoneRead(BaseModel):
    id: int
    code: str
    name: str
    level: str
    parent_id: int | None
    properties: dict[str, Any]

    model_config = ConfigDict(from_attributes=True)