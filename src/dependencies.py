from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

# --- CONFIGURACIÓN ---
ADMIN_USERNAME = "admin_master"
ADMIN_ROL = "admin"
SECRET_KEY = "my-secret"
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def decode_token(token: Annotated[str, Depends(oauth2_scheme)]) -> dict:
    """
    Decodifica el JWT y retorna los datos del usuario.
    NO valida contra la base de datos, solo decodifica el token.
    """
    try:
        # Decodificar el token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        username: str = payload.get("username")
        user_id_str: str = payload.get("sub")  # ✅ Ahora es string
        email: str = payload.get("email")
        rol: str = payload.get("rol")
        
        if username is None:
            print("❌ Token sin username")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: falta username",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # ✅ Convertir el user_id de string a int
        try:
            user_id = int(user_id_str) if user_id_str is not None else 0
        except (ValueError, TypeError):
            print(f"❌ Error convirtiendo user_id: {user_id_str}")
            user_id = 0
        
        user_dict = {
            "username": username,
            "email": email,
            "id": user_id,  # ✅ Ahora es int
            "rol": rol if rol is not None else "user"
        }
        
        print(f"✅ Token decodificado exitosamente para usuario: {username} (ID: {user_id})")
        return user_dict
        
    except JWTError as e:
        print(f"❌ Error JWTError al decodificar token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except Exception as e:
        print(f"❌ Error inesperado al decodificar token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Error procesando token",
            headers={"WWW-Authenticate": "Bearer"}
        )


def verify_admin_role(user: Annotated[dict, Depends(decode_token)]) -> bool:
    """Verifica si el usuario tiene rol de administrador."""
    if user.get("rol") != ADMIN_ROL:
        print(f"❌ Acceso denegado: usuario '{user.get('username')}' tiene rol '{user.get('rol')}', se requiere '{ADMIN_ROL}'")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permiso denegado: Se requiere rol de administrador"
        )
    
    print(f"✅ Acceso admin verificado para: {user.get('username')}")
    return True