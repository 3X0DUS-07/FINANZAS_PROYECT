import os
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

# Configurar Gemini (sin crear el modelo aún)
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# --- CONFIGURACIÓN DE RUTAS ---
BASE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = BASE_DIR / "templates"
ABSOLUTE_FILE_PATH = TEMPLATES_DIR / "admit.html"

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


@app.post("/token", tags=['login'])
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
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
                "sub": "0"
            }
            token = encode_token(payload)
            print(f"✅ Admin login exitoso")
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
        "sub": str(user.id)
    }
    
    token = encode_token(payload)
    
    print(f"✅ Usuario '{user.nombre}' login exitoso")
    print(f"{'='*50}\n")
    
    return {"access_token": token, "token_type": "bearer"}


@app.get("/users/profile", tags=['login'])
def profile(my_user: Annotated[dict, Depends(decode_token)]):
    """Endpoint protegido: devuelve el perfil del usuario autenticado."""
    return my_user


@app.get("/admin/dashboard", tags=['admin'])
def admin_dashboard(
    is_admin: Annotated[bool, Depends(verify_admin_role)],
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


# -------------------------------
# 🤖 CHATBOT GEMINI (CORREGIDO)
# -------------------------------

class ChatRequest(BaseModel):
    message: str


@app.get("/chat/models", tags=["chat"])
async def list_available_models():
    """
    Lista todos los modelos de Gemini disponibles para tu API key.
    """
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return {"error": "API key no configurada en .env"}
        
        models_list = []
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                models_list.append({
                    "name": m.name,
                    "display_name": m.display_name,
                    "description": m.description
                })
        
        if not models_list:
            return {
                "error": "No hay modelos disponibles",
                "suggestion": "Tu API key puede ser inválida o estar restringida. Genera una nueva en https://aistudio.google.com/app/apikey"
            }
        
        return {"available_models": models_list, "total": len(models_list)}
        
    except Exception as e:
        return {"error": str(e), "suggestion": "Verifica tu API key en https://aistudio.google.com/app/apikey"}


@app.post("/chat", tags=["chat"])
async def chat_endpoint(req: ChatRequest):
    """
    Chat simple con Gemini 2.5 Flash (modelo estable y rápido).
    No guarda historial.
    """
    try:
        # Verificar que la API key esté configurada
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return {"error": "API key no configurada en .env"}
        
        # Usar Gemini 2.5 Flash (modelo estable y rápido)
        model_name = "models/gemini-2.5-flash"
        
        temp_model = genai.GenerativeModel(model_name)
        response = temp_model.generate_content(
            req.message,
            generation_config=genai.GenerationConfig(
                temperature=0.7,
                max_output_tokens=500
            )
        )
        
        return {
            "reply": response.text,
            "model_used": model_name
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "suggestion": "Intenta generar una nueva API key o verifica que no tenga restricciones"
        }