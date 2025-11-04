from typing import Annotated
from fastapi import FastAPI, Depends, Header, Request, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.exceptions import HTTPException
from jose import jwt
from sqlmodel import SQLModel, select # Importamos 'select' para las consultas
# Importamos SessionDep y Item (asumo que 'models' ya contiene Item)
from src.routes.db_session import SessionDep 
from src.config.db import engine
from src import models
from src.routes.item_router import items_router

# --- CONFIGURACIÓN INICIAL ---
# Crea las tablas en la base de datos si no existen
SQLModel.metadata.create_all(engine)

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- ROUTER DE ITEMS (CRUD) ---
app.include_router(items_router)

# --- TOKEN Y AUTENTICACIÓN ---

# Nota: El diccionario 'users' ha sido ELIMINADO.

def encode_token(payload: dict) -> str:
    """Crea un JWT para la sesión."""
    token = jwt.encode(payload, "my-secret", algorithm="HS256")
    return token

def decode_token(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: SessionDep # <-- DEPENDENCIA DE DB AÑADIDA
) -> dict:
    """Decodifica el JWT y busca el usuario en la DB."""
    try:
        data = jwt.decode(token, "my-secret", algorithms=["HS256"])
        username = data.get("username")
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    if username is None:
        raise HTTPException(status_code=401, detail="Token inválido (sin usuario)")

    # Buscar el usuario en la base de datos (usando el modelo Item)
    statement = select(models.Item).where(models.Item.nombre == username)
    user = db.exec(statement).first()

    if user is None:
        raise HTTPException(status_code=401, detail="Usuario del token no encontrado en DB")

    # Retorna un diccionario con los datos del usuario para usar en endpoints protegidos
    return {"username": user.nombre, "email": user.correo, "id": user.id}


@app.post("/token", tags=['login'])
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: SessionDep # <-- DEPENDENCIA DE DB AÑADIDA
):
    """Verifica credenciales y devuelve el token de acceso."""
    # Buscar el usuario por nombre (username)
    statement = select(models.Item).where(models.Item.nombre == form_data.username)
    user = db.exec(statement).first()

    # Verificar existencia y contraseña (¡Recuerda hashear en producción!)
    if not user or form_data.password != user.contraseña:
        raise HTTPException(status_code=400, detail="Nombre de usuario o contraseña incorrectos")

    # Si es correcto, genera y devuelve el token
    token = encode_token({"username": user.nombre, "email": user.correo})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/users/profile", tags=['login'])
def profile(my_user: Annotated[dict, Depends(decode_token)]):
    """Endpoint protegido: devuelve el perfil del usuario autenticado."""
    return my_user


# --- ACCESS AND ROLE (EJEMPLO DE ENDPOINT PROTEGIDO) ---

#access - token : secret-token
#user-role : admit

@app.get("/dashboard", tags=['access and role'])
def dashboard(
    request: Request,
    reponse: Response,
    # Asumo que la verificación del token ya ocurre en 'profile' o se puede añadir aquí
    access_token: Annotated[str | None, Header()] = None,
    user_role: Annotated[str | None, Header()] = None,
    ):
    # La lógica de autenticación básica se maneja en 'decode_token'.
    # Este es un ejemplo de verificación adicional por header.
    if access_token != "secret-token":
        raise HTTPException(status_code=401, detail="No autorizado")
    reponse.headers["user_status"] = "enabled"
    return {"access_token": access_token, "user_role": user_role}