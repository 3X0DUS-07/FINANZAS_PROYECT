import os
<<<<<<< HEAD
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt
from sqlmodel import SQLModel, select
from src.routes.db_session import SessionDep
from src.config.db import engine
from src import models
from src.routes.item_router import items_router
from src.routes.inversion_router import inversion_router
from src.routes.gasto_router import gasto_router
from src.routes.analisis_router import analisis_router

# Seguridad
from src.dependencies import oauth2_scheme, decode_token, verify_admin_role, ADMIN_USERNAME, ADMIN_ROL

# Gemini
import google.generativeai as genai
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-turbo")  # Última versión compatible

# --- CONFIGURACIÓN DE RUTAS ---
=======
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
from src.routes.analisis_router import analisis_router
from pathlib import Path 

# 💡 CAMBIO CLAVE: Importar dependencias de seguridad desde el nuevo módulo
from src.dependencies import oauth2_scheme, decode_token, verify_admin_role, ADMIN_USERNAME, ADMIN_ROL 

# --- CONFIGURACIÓN DE RUTAS (Se mantiene) ---
>>>>>>> 8ba65dd5f8f07687b7d491415161295d2b9537f9
BASE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = BASE_DIR / "templates"
ABSOLUTE_FILE_PATH = TEMPLATES_DIR / "admit.html"

<<<<<<< HEAD
# --- CONFIGURACIÓN DEL ADMIN ---
ADMIN_PASSWORD = "super_secure_admin_password"

# --- CONFIGURACIÓN INICIAL ---
SQLModel.metadata.create_all(engine)

# Crear instancia
app = FastAPI()

# Incluir routers
app.include_router(items_router)
app.include_router(inversion_router)
app.include_router(gasto_router)
app.include_router(analisis_router)


# -------------------------------
# 🔐 LOGIN
# -------------------------------

def encode_token(payload: dict) -> str:
    return jwt.encode(payload, "my-secret", algorithm="HS256")

=======
# --- CONFIGURACIÓN DE ADMIN (SOLO NECESITAS LA CONTRASEÑA aquí) ---
# ADMIN_USERNAME y ADMIN_ROL ahora vienen de dependencies.py
ADMIN_PASSWORD = "super_secure_admin_password"

# --- CONFIGURACIÓN INICIAL (Se mantiene) ---
SQLModel.metadata.create_all(engine)

# ✅ PRIMERO: Crear la instancia de FastAPI
app = FastAPI()

# ✅ DESPUÉS: Incluir los routers
app.include_router(items_router)
app.include_router(inversion_router)
app.include_router(gasto_router)
app.include_router(analisis_router)  # ✅ Ahora sí está en el lugar correcto

# --- TOKEN Y AUTENTICACIÓN (Solo queda encode_token) ---

def encode_token(payload: dict) -> str:
    """Crea un JWT para la sesión."""
    token = jwt.encode(payload, "my-secret", algorithm="HS256")
    return token

# --- LOGIN (Modificado para usar ADMIN_USERNAME y ADMIN_ROL de la importación) ---
>>>>>>> 8ba65dd5f8f07687b7d491415161295d2b9537f9

@app.post("/token", tags=['login'])
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
<<<<<<< HEAD
    db: SessionDep
):
    if form_data.username == ADMIN_USERNAME:
        if form_data.password == ADMIN_PASSWORD:
            payload = {
                "username": ADMIN_USERNAME,
                "email": "admin@system.com",
                "rol": ADMIN_ROL,
                "sub": "0"
            }
            token = encode_token(payload)
            return {"access_token": token, "token_type": "bearer"}
        else:
            raise HTTPException(status_code=400, detail="Credenciales incorrectas")

    statement = select(models.Item).where(models.Item.nombre == form_data.username)
    user = db.exec(statement).first()
    if not user or form_data.password != user.contraseña:
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")

    payload = {
        "username": user.nombre,
        "email": user.correo,
        "rol": user.rol,
        "sub": str(user.id)
    }

    token = encode_token(payload)
=======
    db: SessionDep 
):
    """Verifica credenciales y devuelve el token de acceso."""
    
    print(f"\n{'='*50}")
    print(f"🔐 Intento de login para usuario: {form_data.username}")
    print(f"{'='*50}")

    # 1. MANEJO DEL ADMIN
    if form_data.username == ADMIN_USERNAME:
        if form_data.password == ADMIN_PASSWORD:
            payload = {
                "username": ADMIN_USERNAME, 
                "email": "admin@system.com", 
                "rol": ADMIN_ROL,
                "sub": "0"  # ✅ CAMBIO: String en lugar de int
            }
            token = encode_token(payload)
            print(f"✅ Admin login exitoso")
            print(f"   Payload: {payload}")
            print(f"   Token: {token[:30]}...")
            return {"access_token": token, "token_type": "bearer"}
        else:
            print("❌ Contraseña de admin incorrecta")
            raise HTTPException(status_code=400, detail="Credenciales incorrectas")

    # 2. USUARIOS REGULARES
    statement = select(models.Item).where(models.Item.nombre == form_data.username)
    user = db.exec(statement).first()

    if not user:
        print(f"❌ Usuario '{form_data.username}' no encontrado en DB")
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
    
    if form_data.password != user.contraseña:
        print(f"❌ Contraseña incorrecta para usuario '{form_data.username}'")
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")

    payload = {
        "username": user.nombre, 
        "email": user.correo, 
        "rol": user.rol, 
        "sub": str(user.id)  # ✅ CAMBIO: Convertir a string
    }
    
    token = encode_token(payload)
    
    print(f"✅ Usuario '{user.nombre}' login exitoso")
    print(f"   ID: {user.id}")
    print(f"   Rol: {user.rol}")
    print(f"   Payload: {payload}")
    print(f"   Token: {token[:30]}...")
    print(f"{'='*50}\n")
    
>>>>>>> 8ba65dd5f8f07687b7d491415161295d2b9537f9
    return {"access_token": token, "token_type": "bearer"}


@app.get("/users/profile", tags=['login'])
def profile(my_user: Annotated[dict, Depends(decode_token)]):
<<<<<<< HEAD
=======
    """Endpoint protegido: devuelve el perfil del usuario autenticado."""
>>>>>>> 8ba65dd5f8f07687b7d491415161295d2b9537f9
    return my_user


@app.get("/admin/dashboard", tags=['admin'])
def admin_dashboard(
    is_admin: Annotated[bool, Depends(verify_admin_role)],
    user: Annotated[dict, Depends(decode_token)]
):
<<<<<<< HEAD
=======
    """Endpoint solo accesible para usuarios con rol 'admin'."""
>>>>>>> 8ba65dd5f8f07687b7d491415161295d2b9537f9
    return {"message": f"Bienvenido al Dashboard de Administrador, {user['username']}", "rol": user['rol']}


@app.get("/", include_in_schema=False)
async def serve_admit_html():
<<<<<<< HEAD
=======
    """Sirve el archivo HTML principal."""
>>>>>>> 8ba65dd5f8f07687b7d491415161295d2b9537f9
    if ABSOLUTE_FILE_PATH.is_file():
        return FileResponse(ABSOLUTE_FILE_PATH, media_type="text/html")
    raise HTTPException(status_code=404, detail="HTML template not found")

<<<<<<< HEAD

# -------------------------------
# 🤖 CHATBOT GEMINI
# -------------------------------

class ChatRequest(BaseModel):
    message: str


@app.post("/chat", tags=["chat"])
async def chat_endpoint(req: ChatRequest):
    """
    Chat simple con Gemini 1.5-turbo.
    No guarda historial.
    """
    try:
        response = model.generate_text(
            req.message,
            temperature=0.7,
            max_output_tokens=500
        )
        return {"reply": response.output_text}
    except Exception as e:
        return {"error": str(e)}
=======
# admin_master
# super_secure_admin_password
>>>>>>> 8ba65dd5f8f07687b7d491415161295d2b9537f9
