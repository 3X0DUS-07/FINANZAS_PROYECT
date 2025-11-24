<<<<<<< HEAD
from .item import Item, ItemCreateIn, ItemCreateOut, ItemUpdateIn
from .gasto import Gasto, GastoCreateIn, GastoUpdateIn, GastoRead
from .inversion import Inversion, InversionCreateIn, InversionUpdateIn, InversionRead

# Asegurar que las relaciones entre modelos se importen al cargar el paquete
from . import relationships
=======
# src/models/__init__.py
from .item import Item, ItemCreateIn, ItemCreateOut, ItemUpdateIn
from .gasto import Gasto, GastoCreateIn, GastoUpdateIn, GastoRead
from .inversion import Inversion, InversionCreateIn, InversionUpdateIn, InversionRead
>>>>>>> 8ba65dd5f8f07687b7d491415161295d2b9537f9
