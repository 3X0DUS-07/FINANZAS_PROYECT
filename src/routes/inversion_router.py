from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from src.routes.db_session import SessionDep
from src.models.inversion import Inversion, InversionCreateIn, InversionUpdateIn, InversionRead
from src.dependencies import decode_token # Para obtener el ID del usuario

inversion_router = APIRouter(prefix="/inversiones", tags=["Inversiones"])

# --- DEPENDENCIAS DE SEGURIDAD ---
# Usa decode_token para obtener el usuario autenticado
UserDep = Annotated[dict, Depends(decode_token)]

# --- RUTAS DE LECTURA (GET) ---

@inversion_router.get("/", response_model=List[InversionRead])
def get_inversiones(db: SessionDep, user: UserDep):
    """Obtiene todas las inversiones del usuario autenticado."""
    # Filtrar por el ID del usuario
    statement = select(Inversion).where(Inversion.usuario_id == user["id"])
    inversiones = db.exec(statement).all()
    
    if not inversiones and user["id"] != 0: # Si no hay inversiones y no es el Admin
        return []

    return inversiones

@inversion_router.get("/{inversion_id}", response_model=InversionRead)
def get_inversion_by_id(inversion_id: int, db: SessionDep, user: UserDep):
    """Obtiene una inversión específica del usuario autenticado por ID."""
    inversion = db.get(Inversion, inversion_id)
    
    if not inversion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inversión no encontrada")

    # Seguridad: Asegurar que la inversión pertenezca al usuario autenticado (a menos que sea Admin)
    if inversion.usuario_id != user["id"] and user["id"] != 0:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado para ver esta inversión")

    return inversion

# --- RUTA DE CREACIÓN (POST) ---

@inversion_router.post("/", response_model=InversionRead, status_code=status.HTTP_201_CREATED)
def create_inversion(inversion_in: InversionCreateIn, db: SessionDep, user: UserDep):
    """Crea una nueva inversión para el usuario autenticado."""
    
    print(f"\n{'='*50}")
    print(f"💰 Creando inversión para usuario: {user['username']} (ID: {user['id']})")
    print(f"   Tipo: {inversion_in.tipo_inversion}")
    print(f"   Cantidad: {inversion_in.cantidad_inversion}")
    print(f"{'='*50}")
    
    # Crea la instancia del modelo de DB
    db_inversion = Inversion.model_validate(inversion_in)
    
    # Asigna el usuario_id del usuario autenticado
    db_inversion.usuario_id = user["id"]
    
    print(f"✅ Inversión creada y asignada a usuario ID: {user['id']}")
    
    db.add(db_inversion)
    db.commit()
    db.refresh(db_inversion)
    
    print(f"✅ Inversión guardada en DB con ID: {db_inversion.id}\n")
    
    return db_inversion

# --- RUTA DE ACTUALIZACIÓN (PUT) ---

@inversion_router.put("/{inversion_id}", response_model=InversionRead)
def update_inversion(inversion_id: int, inversion_in: InversionUpdateIn, db: SessionDep, user: UserDep):
    """Actualiza una inversión existente del usuario autenticado por ID."""
    
    db_inversion = db.get(Inversion, inversion_id)
    
    if not db_inversion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inversión no encontrada")

    # Seguridad: Asegurar que la inversión pertenezca al usuario autenticado (a menos que sea Admin)
    if db_inversion.usuario_id != user["id"] and user["id"] != 0:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado para modificar esta inversión")
        
    # ✅ CORRECCIÓN: Actualizar los campos correctamente
    update_data = inversion_in.model_dump(exclude_unset=True)
    
    # Actualizar cada campo individualmente
    for key, value in update_data.items():
        setattr(db_inversion, key, value)
    
    db.add(db_inversion)
    db.commit()
    db.refresh(db_inversion)
    return db_inversion

# --- RUTA DE ELIMINACIÓN (DELETE) ---

@inversion_router.delete("/{inversion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inversion(inversion_id: int, db: SessionDep, user: UserDep):
    """Elimina una inversión existente del usuario autenticado por ID."""
    
    db_inversion = db.get(Inversion, inversion_id)
    
    if not db_inversion:
        # Se devuelve 204 incluso si no se encuentra para mantener la idempotencia.
        return 
    
    # Seguridad: Asegurar que la inversión pertenezca al usuario autenticado (a menos que sea Admin)
    if db_inversion.usuario_id != user["id"] and user["id"] != 0:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado para eliminar esta inversión")

    db.delete(db_inversion)
    db.commit()
    return