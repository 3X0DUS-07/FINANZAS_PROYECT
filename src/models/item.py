# item.py
from __future__ import annotations
from sqlmodel import Relationship, SQLModel, Field, Session
from typing import Optional

class ItemBase(SQLModel):
    nombre: str = Field()
    correo: str = Field()
    contraseña: str = Field()
    rol: str = Field(default="user") 

class ItemCreateIn(SQLModel):
    nombre: str = Field()
    correo: str = Field()
    contraseña: str = Field()

class ItemUpdateIn(SQLModel):
    nombre: Optional[str] = None
    correo: Optional[str] = None
    contraseña: Optional[str] = None
    rol: Optional[str] = None

class ItemCreateOut(SQLModel):
    id: Optional[int] = Field(default=None)
    nombre: str = Field()
    correo: str = Field()
    rol: str = Field()

class Item(ItemBase, table=True, extend_existing=True): 
    __tablename__ = "item"  # Añadir esto explícitamente
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # NO INCLUIR LAS RELACIONES AQUÍ
    # Las agregaremos después de definir Inversion y Gasto