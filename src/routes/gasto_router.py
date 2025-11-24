from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from src.routes.db_session import SessionDep
from src.models.gasto import Gasto, GastoCreateIn, GastoUpdateIn, GastoRead
from src.dependencies import decode_token # Para obtener el ID del usuario

gasto_router = APIRouter(prefix="/gastos", tags=["Gastos"])

# --- DEPENDENCIAS DE SEGURIDAD ---
# Usa decode_token para obtener el usuario autenticado
UserDep = Annotated[dict, Depends(decode_token)]

# --- RUTAS DE LECTURA (GET) ---

@gasto_router.get("/", response_model=List[GastoRead])
def get_gastos(db: SessionDep, user: UserDep):
    """Obtiene todos los gastos del usuario autenticado."""
    # Filtrar por el ID del usuario
    statement = select(Gasto).where(Gasto.usuario_id == user["id"])
    gastos = db.exec(statement).all()
    
    if not gastos and user["id"] != 0: # Si no hay gastos y no es el Admin
        return []

    return gastos

@gasto_router.get("/{gasto_id}", response_model=GastoRead)
def get_gasto_by_id(gasto_id: int, db: SessionDep, user: UserDep):
    """Obtiene un gasto específico del usuario autenticado por ID."""
    gasto = db.get(Gasto, gasto_id)
    
    if not gasto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gasto no encontrado")

    # Seguridad: Asegurar que el gasto pertenezca al usuario autenticado (a menos que sea Admin)
    if gasto.usuario_id != user["id"] and user["id"] != 0:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado para ver este gasto")

    return gasto

# --- RUTA DE CREACIÓN (POST) ---

@gasto_router.post("/", response_model=GastoRead, status_code=status.HTTP_201_CREATED)
def create_gasto(gasto_in: GastoCreateIn, db: SessionDep, user: UserDep):
    """Crea un nuevo gasto para el usuario autenticado."""
    
    # Crea la instancia del modelo de DB
    db_gasto = Gasto.model_validate(gasto_in)
    
    # Asigna el usuario_id del usuario autenticado
    db_gasto.usuario_id = user["id"]
    
    db.add(db_gasto)
    db.commit()
    db.refresh(db_gasto)
    return db_gasto

# --- RUTA DE ACTUALIZACIÓN (PUT) ---

@gasto_router.put("/{gasto_id}", response_model=GastoRead)
def update_gasto(gasto_id: int, gasto_in: GastoUpdateIn, db: SessionDep, user: UserDep):
    """Actualiza un gasto existente del usuario autenticado por ID."""
    
    db_gasto = db.get(Gasto, gasto_id)
    
    if not db_gasto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gasto no encontrado")

    # Seguridad: Asegurar que el gasto pertenezca al usuario autenticado (a menos que sea Admin)
    if db_gasto.usuario_id != user["id"] and user["id"] != 0:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado para modificar este gasto")
        
    # ✅ CORRECCIÓN: Actualizar los campos correctamente
    update_data = gasto_in.model_dump(exclude_unset=True)
    
    # Actualizar cada campo individualmente
    for key, value in update_data.items():
        setattr(db_gasto, key, value)
    
    db.add(db_gasto)
    db.commit()
    db.refresh(db_gasto)
    return db_gasto

# --- RUTA DE ELIMINACIÓN (DELETE) ---

@gasto_router.delete("/{gasto_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gasto(gasto_id: int, db: SessionDep, user: UserDep):
    """Elimina un gasto existente del usuario autenticado por ID."""
    
    db_gasto = db.get(Gasto, gasto_id)
    
    if not db_gasto:
        # Se devuelve 204 incluso si no se encuentra para mantener la idempotencia.
        return 
    
    # Seguridad: Asegurar que el gasto pertenezca al usuario autenticado (a menos que sea Admin)
    if db_gasto.usuario_id != user["id"] and user["id"] != 0:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado para eliminar este gasto")

    db.delete(db_gasto)
    db.commit()
    return