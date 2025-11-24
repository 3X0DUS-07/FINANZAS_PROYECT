from typing import Annotated, Generator
from fastapi import Depends
from sqlmodel import Session
from src.config.db import engine

def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session: # <-- Nombre de variable local diferente
        yield session # <-- Retornamos la variable local


SessionDep = Annotated[Session, Depends(get_db)]