import os
from typing import Annotated
from fastapi import FastAPI, Depends, Header, Request, Response, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt
from sqlmodel import SQLModel, select 
from src.routes.db_session import SessionDep 
from src.config.db import engine
from src import models
from src.routes.item_router import items_router
# 🔑 Importar los nuevos routers de finanzas
from src.routes.inversion_router import inversion_router
from src.routes.gasto_router import gasto_router
from pathlib import Path 

# 💡 CAMBIO CLAVE: Importar dependencias de seguridad desde el nuevo módulo
from src.dependencies import oauth2_scheme, decode_token, verify_admin_role, ADMIN_USERNAME, ADMIN_ROL 

# --- CONFIGURACIÓN DE RUTAS (Se mantiene) ---
BASE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = BASE_DIR / "templates"
ABSOLUTE_FILE_PATH = TEMPLATES_DIR / "admit.html"

# --- CONFIGURACIÓN DE ADMIN (SOLO NECESITAS LA CONTRASEÑA aquí) ---
# ADMIN_USERNAME y ADMIN_ROL ahora vienen de dependencies.py
ADMIN_PASSWORD = "super_secure_admin_password"


# --- CONFIGURACIÓN INICIAL (Se mantiene) ---
SQLModel.metadata.create_all(engine)

app = FastAPI()
# oauth2_scheme ahora se importa de dependencies.py

# --- ROUTER DE ITEMS (CRUD) (Se mantiene) ---
app.include_router(items_router)

# 🔑 INCLUIR NUEVOS ROUTERS (FINANZAS)
app.include_router(inversion_router)
app.include_router(gasto_router)

# --- TOKEN Y AUTENTICACIÓN (Solo queda encode_token) ---

def encode_token(payload: dict) -> str:
    """Crea un JWT para la sesión."""
    token = jwt.encode(payload, "my-secret", algorithm="HS256")
    return token

# --- LOGIN (Modificado para usar ADMIN_USERNAME y ADMIN_ROL de la importación) ---

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
    #admin_master
    #super_secure_admin_password
    
    statement = select(models.Item).where(models.Item.nombre == form_data.username)
    user = db.exec(statement).first()

    if not user or form_data.password != user.contraseña:
        raise HTTPException(status_code=400, detail="Nombre de usuario o contraseña incorrectos")

    # 💡 CAMBIO CLAVE: Incluir el ID del usuario en el token para que sea usado por decode_token
    token = encode_token({"username": user.nombre, "email": user.correo, "rol": user.rol, "sub": user.id})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/users/profile", tags=['login'])
def profile(my_user: Annotated[dict, Depends(decode_token)]): # decode_token ahora de dependencies.py
    """Endpoint protegido: devuelve el perfil del usuario autenticado."""
    return my_user


@app.get("/admin/dashboard", tags=['admin'])
def admin_dashboard(
    is_admin: Annotated[bool, Depends(verify_admin_role)], # verify_admin_role ahora de dependencies.py
    user: Annotated[dict, Depends(decode_token)]
):
    """Endpoint solo accesible para usuarios con rol 'admin'."""
    return {"message": f"Bienvenido al Dashboard de Administrador, {user['username']}", "rol": user['rol']}

@app.get("/", include_in_schema=False)
async def serve_admit_html():
    """Sirve el archivo HTML principal."""
    if ABSOLUTE_FILE_PATH.is_file():
        return FileResponse(ABSOLUTE_FILE_PATH, media_type="text/html")
    raise HTTPException(status_code=404, detail="HTML template not found")

#admin_master
#super_secure_admin_password