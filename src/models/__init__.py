from .item import Item, ItemCreateIn, ItemCreateOut, ItemUpdateIn
from .gasto import Gasto, GastoCreateIn, GastoUpdateIn, GastoRead
from .inversion import Inversion, InversionCreateIn, InversionUpdateIn, InversionRead

# Asegurar que las relaciones entre modelos se importen al cargar el paquete
from . import relationships