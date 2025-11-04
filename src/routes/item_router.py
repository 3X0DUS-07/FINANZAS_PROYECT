from fastapi import APIRouter
from sqlmodel import select
from src.models.item import Item, ItemCreateIn, ItemCreateOut
from src.routes.db_session import SessionDep


items_router = APIRouter(prefix="/items", tags=["creacion y busqueda de session"])

@items_router.get("/")
def get_items(
    db: SessionDep
)    ->list[Item]:


    statement = select(Item)
    result = db.exec(statement).all()
    return result


@items_router.post("/")
def add_item(
    item: ItemCreateIn,
    db: SessionDep
) -> ItemCreateOut:
    db_item = Item(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return ItemCreateOut(id=db_item.id)