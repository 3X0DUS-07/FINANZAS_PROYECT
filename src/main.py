import os
from typing import Annotated
from fastapi import FastAPI, Depends, Header, Request, Response, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt
from sqlmodel import SQLModel, select 
from src.routes.db_session import SessionDep 
from src.config.db import engine
from src import models
from src.routes.item_router import items_router
from pathlib import Path 

# --- CONFIGURACIÓN DE RUTAS ---
BASE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = BASE_DIR / "templates"
ABSOLUTE_FILE_PATH = TEMPLATES_DIR / "admit.html"

# --- CONFIGURACIÓN DE ADMIN (SOLO PARA DESARROLLO) ---
ADMIN_USERNAME = "admin_master"
ADMIN_PASSWORD = "super_secure_admin_password"
ADMIN_ROL = "admin"


# --- CONFIGURACIÓN INICIAL ---
# Crea las tablas en la base de datos si no existen (incluyendo el nuevo campo 'rol')
SQLModel.metadata.create_all(engine)

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- ROUTER DE ITEMS (CRUD) ---
app.include_router(items_router)

# --- TOKEN Y AUTENTICACIÓN ---

def encode_token(payload: dict) -> str:
    """Crea un JWT para la sesión."""
    # Asegúrate de que el payload ahora siempre contenga el 'rol'
    token = jwt.encode(payload, "my-secret", algorithm="HS256")
    return token

def decode_token(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: SessionDep 
) -> dict:
    """Decodifica el JWT y busca el usuario en la DB, extrayendo el rol."""
    try:
        data = jwt.decode(token, "my-secret", algorithms=["HS256"])
        username = data.get("username")
        # El rol puede venir del token si fue generado por la lógica especial de admin
        token_rol = data.get("rol")
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    if username is None:
        raise HTTPException(status_code=401, detail="Token inválido (sin usuario)")

    # 1. Manejo del usuario Admin especial (si no está en la DB)
    if username == ADMIN_USERNAME and token_rol == ADMIN_ROL:
         return {"username": ADMIN_USERNAME, "email": "admin@system.com", "id": 0, "rol": ADMIN_ROL}

    # 2. Buscar el usuario regular en la base de datos
    statement = select(models.Item).where(models.Item.nombre == username)
    user = db.exec(statement).first()

    if user is None:
        raise HTTPException(status_code=401, detail="Usuario del token no encontrado en DB")

    # Retorna un diccionario con los datos del usuario, incluyendo el ROL de la DB
    return {"username": user.nombre, "email": user.correo, "id": user.id, "rol": user.rol}


# --- DEPENDENCIA para verificar el Rol de Administrador ---
def verify_admin_role(user: Annotated[dict, Depends(decode_token)]) -> bool:
    """Verifica si el usuario autenticado tiene el rol de administrador."""
    if user.get("rol") != ADMIN_ROL:
        raise HTTPException(status_code=403, detail="Permiso denegado: Se requiere rol de administrador.")
    return True


@app.post("/token", tags=['login'])
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: SessionDep 
):
    """Verifica credenciales y devuelve el token de acceso, con manejo de admin."""

    # 1. --- MANEJO ESPECIAL DEL USUARIO ADMIN ---
    if form_data.username == ADMIN_USERNAME:
        if form_data.password == ADMIN_PASSWORD:
            # Genera un token con el rol 'admin'
            token = encode_token({"username": ADMIN_USERNAME, "email": "admin@system.com", "rol": ADMIN_ROL})
            return {"access_token": token, "token_type": "bearer"}
        else:
            raise HTTPException(status_code=400, detail="Nombre de usuario o contraseña incorrectos")


    # 2. --- MANEJO DE USUARIOS REGULARES (DESDE LA DB) ---
    # Buscar el usuario por nombre (username)
    statement = select(models.Item).where(models.Item.nombre == form_data.username)
    user = db.exec(statement).first()

    # Verificar existencia y contraseña 
    if not user or form_data.password != user.contraseña:
        raise HTTPException(status_code=400, detail="Nombre de usuario o contraseña incorrectos")

    # Si es correcto, genera y devuelve el token, usando el rol de la DB
    token = encode_token({"username": user.nombre, "email": user.correo, "rol": user.rol})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/users/profile", tags=['login'])
def profile(my_user: Annotated[dict, Depends(decode_token)]):
    """Endpoint protegido: devuelve el perfil del usuario autenticado."""
    return my_user


# --- EJEMPLO DE RUTA PROTEGIDA POR ROL ---
@app.get("/admin/dashboard", tags=['admin'])
def admin_dashboard(
    is_admin: Annotated[bool, Depends(verify_admin_role)],
    user: Annotated[dict, Depends(decode_token)]
):
    """Endpoint solo accesible para usuarios con rol 'admin'."""
    return {"message": f"Bienvenido al Dashboard de Administrador, {user['username']}", "rol": user['rol']}