from fastapi import APIRouter
from sqlmodel import select
from src.models.item import Item, ItemCreateIn, ItemCreateOut
from src.routes.db_session import SessionDep


items_router = APIRouter(prefix="/items", tags=["creacion y busqueda de session"])

# La ruta GET se ve bien, devuelve una lista del modelo completo Item
@items_router.get("/")
def get_items(
    db: SessionDep
) -> list[Item]:
    statement = select(Item)
    result = db.exec(statement).all()
    return result


@items_router.post("/", response_model=ItemCreateOut) # 👈 Añadimos response_model para tipado
def add_item(
    item_in: ItemCreateIn, # 👈 Renombramos a item_in para mayor claridad
    db: SessionDep
) -> ItemCreateOut:
    
    # --- CAMBIO CLAVE ---
    # 1. Usar model_validate para crear la instancia de Item.
    #    Item (que hereda de ItemBase) automáticamente asignará 'rol="user"'
    #    a todos los campos no proporcionados en item_in.
    db_item = Item.model_validate(item_in) 
    # -------------------

    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    # 2. Devolver la instancia db_item. 
    #    SQLModel/FastAPI se encargará de mapearla automáticamente al modelo ItemCreateOut,
    #    que ahora tiene id, nombre, correo y rol.
    return db_item