# En models/__init__.py - AL FINAL, después de todas las importaciones
from .item import Item, ItemCreateIn, ItemCreateOut, ItemUpdateIn
from .gasto import Gasto, GastoCreateIn, GastoUpdateIn, GastoRead
from .inversion import Inversion, InversionCreateIn, InversionUpdateIn, InversionRead
from sqlmodel import Relationship
from typing import List

# Ahora agregar las relaciones DESPUÉS de que todas las clases estén definidas
Item.inversiones = Relationship(back_populates="usuario", sa_relationship_kwargs={"lazy": "select"})
Item.gastos = Relationship(back_populates="usuario", sa_relationship_kwargs={"lazy": "select"})

# Agregar anotaciones para type checking
Item.__annotations__["inversiones"] = List[Inversion]
Item.__annotations__["gastos"] = List[Gasto]