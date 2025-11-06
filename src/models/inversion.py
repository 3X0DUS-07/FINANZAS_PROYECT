# inversion.py
from sqlmodel import Relationship, SQLModel, Field
from typing import Optional
from datetime import date 

class InversionBase(SQLModel):
    tipo_inversion: str = Field(index=True)
    cantidad_inversion: float = Field()
    fecha_inversion: date = Field(default_factory=date.today)
    descripcion: Optional[str] = None

class InversionCreateIn(SQLModel):
    tipo_inversion: str = Field()
    cantidad_inversion: float = Field()
    fecha_inversion: Optional[date] = Field(default_factory=date.today)

class InversionUpdateIn(SQLModel):
    tipo_inversion: Optional[str] = None
    cantidad_inversion: Optional[float] = None
    fecha_inversion: Optional[date] = None
    descripcion: Optional[str] = None

class InversionRead(SQLModel):
    id: int = Field()
    tipo_inversion: str = Field()
    cantidad_inversion: float = Field()
    fecha_inversion: date = Field()
    descripcion: Optional[str] = None
    usuario_id: int

class Inversion(InversionBase, table=True):
    __tablename__ = "inversion"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: Optional[int] = Field(default=None, foreign_key="item.id")
    
    # Sin relación aquí, se agregará en __init__.py