from pydantic import BaseModel, Field


class RatingCreate(BaseModel):
    score: int = Field(ge=1, le=5)


class RatingOut(BaseModel):
    avg: float | None
    count: int
    user_score: int | None = None
