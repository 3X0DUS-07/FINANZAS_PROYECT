from sqlmodel import SQLModel, Field
from typing import Optional

# --- 1. Base para la DB y la Salida ---
# Contiene todos los campos, incluyendo el 'rol' con un valor por defecto.
class ItemBase(SQLModel):
    nombre: str = Field()
    correo: str = Field()
    contraseña: str = Field()
    rol: str = Field(default="user") # ¡Mantenemos el default aquí para la DB!

# --- 2. Modelo de ENTRADA (Input) ---
# Creamos una clase que NO hereda el campo 'rol'
class ItemCreateIn(SQLModel):
    nombre: str = Field()
    correo: str = Field()
    contraseña: str = Field()

# --- 3. Modelo de Salida (Output) ---
# Es seguro devolver el rol una vez creado, pero por seguridad, 
# se suele excluir la contraseña.
class ItemCreateOut(SQLModel):
    id: Optional[int] = Field(default=None) # Ajustado a Optional y default=None para mayor consistencia
    nombre: str = Field()
    correo: str = Field()
    rol: str = Field() # Se incluye el rol para confirmar el rol asignado

# --- 4. Modelo de Tabla (DB) ---
# Hereda de ItemBase (incluyendo 'rol' y 'contraseña')
class Item(ItemBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)