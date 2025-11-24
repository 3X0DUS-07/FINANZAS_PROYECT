from typing import Annotated, List, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import select, func
from src.routes.db_session import SessionDep
from src.models.inversion import Inversion
from src.models.gasto import Gasto
from src.dependencies import decode_token
from datetime import date, datetime
from dateutil.relativedelta import relativedelta

analisis_router = APIRouter(prefix="/analisis", tags=["Análisis Financiero"])

# --- DEPENDENCIAS DE SEGURIDAD ---
UserDep = Annotated[dict, Depends(decode_token)]


# --- MODELOS DE RESPUESTA ---
from pydantic import BaseModel

class ResumenFinanciero(BaseModel):
    total_inversiones: float
    total_gastos: float
    balance: float
    porcentaje_ahorro: float
    periodo: str

class GastoPorTipo(BaseModel):
    tipo_gasto: str
    total: float
    porcentaje: float

class InversionPorTipo(BaseModel):
    tipo_inversion: str
    total: float
    porcentaje: float


# --- ENDPOINTS ---

@analisis_router.get("/resumen-general", response_model=ResumenFinanciero)
def get_resumen_general(db: SessionDep, user: UserDep):
    """
    Obtiene un resumen financiero general del usuario:
    - Total de inversiones
    - Total de gastos
    - Balance (inversiones - gastos)
    - Porcentaje de ahorro
    """
    
    # Obtener todas las inversiones del usuario
    statement_inv = select(Inversion).where(Inversion.usuario_id == user["id"])
    inversiones = db.exec(statement_inv).all()
    total_inversiones = sum(inv.cantidad_inversion for inv in inversiones)
    
    # Obtener todos los gastos del usuario
    statement_gasto = select(Gasto).where(Gasto.usuario_id == user["id"])
    gastos = db.exec(statement_gasto).all()
    total_gastos = sum(gasto.cantidad_gasto for gasto in gastos)
    
    # Calcular balance
    balance = total_inversiones - total_gastos
    
    # Calcular porcentaje de ahorro
    if total_inversiones > 0:
        porcentaje_ahorro = (balance / total_inversiones) * 100
    else:
        porcentaje_ahorro = 0.0
    
    return ResumenFinanciero(
        total_inversiones=total_inversiones,
        total_gastos=total_gastos,
        balance=balance,
        porcentaje_ahorro=round(porcentaje_ahorro, 2),
        periodo="Todo el tiempo"
    )


@analisis_router.get("/resumen-mensual", response_model=ResumenFinanciero)
def get_resumen_mensual(
    db: SessionDep, 
    user: UserDep,
    mes: int = Query(default=None, ge=1, le=12, description="Mes (1-12). Si no se especifica, usa el mes actual"),
    anio: int = Query(default=None, ge=2000, description="Año. Si no se especifica, usa el año actual")
):
    """
    Obtiene un resumen financiero mensual del usuario.
    Si no se especifica mes/año, usa el mes actual.
    """
    
    # Si no se especifica mes/año, usar el actual
    if mes is None:
        mes = datetime.now().month
    if anio is None:
        anio = datetime.now().year
    
    # Calcular el primer y último día del mes
    primer_dia = date(anio, mes, 1)
    if mes == 12:
        ultimo_dia = date(anio + 1, 1, 1)
    else:
        ultimo_dia = date(anio, mes + 1, 1)
    
    # Obtener inversiones del mes
    statement_inv = select(Inversion).where(
        Inversion.usuario_id == user["id"],
        Inversion.fecha_inversion >= primer_dia,
        Inversion.fecha_inversion < ultimo_dia
    )
    inversiones = db.exec(statement_inv).all()
    total_inversiones = sum(inv.cantidad_inversion for inv in inversiones)
    
    # Obtener gastos del mes
    statement_gasto = select(Gasto).where(
        Gasto.usuario_id == user["id"],
        Gasto.fecha_gasto >= primer_dia,
        Gasto.fecha_gasto < ultimo_dia
    )
    gastos = db.exec(statement_gasto).all()
    total_gastos = sum(gasto.cantidad_gasto for gasto in gastos)
    
    # Calcular balance
    balance = total_inversiones - total_gastos
    
    # Calcular porcentaje de ahorro
    if total_inversiones > 0:
        porcentaje_ahorro = (balance / total_inversiones) * 100
    else:
        porcentaje_ahorro = 0.0
    
    return ResumenFinanciero(
        total_inversiones=total_inversiones,
        total_gastos=total_gastos,
        balance=balance,
        porcentaje_ahorro=round(porcentaje_ahorro, 2),
        periodo=f"{mes}/{anio}"
    )


@analisis_router.get("/gastos-por-tipo", response_model=List[GastoPorTipo])
def get_gastos_por_tipo(
    db: SessionDep, 
    user: UserDep,
    mes: int = Query(default=None, ge=1, le=12, description="Filtrar por mes (opcional)"),
    anio: int = Query(default=None, ge=2000, description="Filtrar por año (opcional)")
):
    """
    Obtiene el total de gastos agrupados por tipo.
    Muestra qué categorías consumen más dinero.
    Opcionalmente se puede filtrar por mes y año.
    """
    
    # Construir query base
    statement = select(Gasto).where(Gasto.usuario_id == user["id"])
    
    # Aplicar filtros de fecha si se especifican
    if mes is not None and anio is not None:
        primer_dia = date(anio, mes, 1)
        if mes == 12:
            ultimo_dia = date(anio + 1, 1, 1)
        else:
            ultimo_dia = date(anio, mes + 1, 1)
        
        statement = statement.where(
            Gasto.fecha_gasto >= primer_dia,
            Gasto.fecha_gasto < ultimo_dia
        )
    
    # Obtener todos los gastos
    gastos = db.exec(statement).all()
    
    if not gastos:
        return []
    
    # Agrupar por tipo
    gastos_por_tipo: Dict[str, float] = {}
    for gasto in gastos:
        if gasto.tipo_gasto in gastos_por_tipo:
            gastos_por_tipo[gasto.tipo_gasto] += gasto.cantidad_gasto
        else:
            gastos_por_tipo[gasto.tipo_gasto] = gasto.cantidad_gasto
    
    # Calcular total
    total_gastos = sum(gastos_por_tipo.values())
    
    # Crear lista de resultados con porcentajes
    resultado = []
    for tipo, total in gastos_por_tipo.items():
        porcentaje = (total / total_gastos * 100) if total_gastos > 0 else 0
        resultado.append(GastoPorTipo(
            tipo_gasto=tipo,
            total=total,
            porcentaje=round(porcentaje, 2)
        ))
    
    # Ordenar por total descendente
    resultado.sort(key=lambda x: x.total, reverse=True)
    
    return resultado


@analisis_router.get("/inversiones-por-tipo", response_model=List[InversionPorTipo])
def get_inversiones_por_tipo(
    db: SessionDep, 
    user: UserDep,
    mes: int = Query(default=None, ge=1, le=12, description="Filtrar por mes (opcional)"),
    anio: int = Query(default=None, ge=2000, description="Filtrar por año (opcional)")
):
    """
    Obtiene el total de inversiones agrupadas por tipo.
    Muestra de dónde provienen los ingresos.
    Opcionalmente se puede filtrar por mes y año.
    """
    
    # Construir query base
    statement = select(Inversion).where(Inversion.usuario_id == user["id"])
    
    # Aplicar filtros de fecha si se especifican
    if mes is not None and anio is not None:
        primer_dia = date(anio, mes, 1)
        if mes == 12:
            ultimo_dia = date(anio + 1, 1, 1)
        else:
            ultimo_dia = date(anio, mes + 1, 1)
        
        statement = statement.where(
            Inversion.fecha_inversion >= primer_dia,
            Inversion.fecha_inversion < ultimo_dia
        )
    
    # Obtener todas las inversiones
    inversiones = db.exec(statement).all()
    
    if not inversiones:
        return []
    
    # Agrupar por tipo
    inversiones_por_tipo: Dict[str, float] = {}
    for inversion in inversiones:
        if inversion.tipo_inversion in inversiones_por_tipo:
            inversiones_por_tipo[inversion.tipo_inversion] += inversion.cantidad_inversion
        else:
            inversiones_por_tipo[inversion.tipo_inversion] = inversion.cantidad_inversion
    
    # Calcular total
    total_inversiones = sum(inversiones_por_tipo.values())
    
    # Crear lista de resultados con porcentajes
    resultado = []
    for tipo, total in inversiones_por_tipo.items():
        porcentaje = (total / total_inversiones * 100) if total_inversiones > 0 else 0
        resultado.append(InversionPorTipo(
            tipo_inversion=tipo,
            total=total,
            porcentaje=round(porcentaje, 2)
        ))
    
    # Ordenar por total descendente
    resultado.sort(key=lambda x: x.total, reverse=True)
    
    return resultado


@analisis_router.get("/tendencia-mensual")
def get_tendencia_mensual(
    db: SessionDep,
    user: UserDep,
    meses: int = Query(default=6, ge=1, le=24, description="Número de meses hacia atrás")
):
    """
    Obtiene la tendencia de ingresos y gastos de los últimos N meses.
    Útil para graficar la evolución financiera.
    """
    
    resultado = []
    fecha_actual = date.today()
    
    for i in range(meses):
        # Calcular el mes a analizar (restando meses)
        fecha_analisis = fecha_actual - relativedelta(months=i)
        mes = fecha_analisis.month
        anio = fecha_analisis.year
        
        # Primer y último día del mes
        primer_dia = date(anio, mes, 1)
        if mes == 12:
            ultimo_dia = date(anio + 1, 1, 1)
        else:
            ultimo_dia = date(anio, mes + 1, 1)
        
        # Inversiones del mes
        statement_inv = select(Inversion).where(
            Inversion.usuario_id == user["id"],
            Inversion.fecha_inversion >= primer_dia,
            Inversion.fecha_inversion < ultimo_dia
        )
        inversiones = db.exec(statement_inv).all()
        total_inversiones = sum(inv.cantidad_inversion for inv in inversiones)
        
        # Gastos del mes
        statement_gasto = select(Gasto).where(
            Gasto.usuario_id == user["id"],
            Gasto.fecha_gasto >= primer_dia,
            Gasto.fecha_gasto < ultimo_dia
        )
        gastos = db.exec(statement_gasto).all()
        total_gastos = sum(gasto.cantidad_gasto for gasto in gastos)
        
        balance = total_inversiones - total_gastos
        
        resultado.append({
            "mes": mes,
            "anio": anio,
            "periodo": f"{mes}/{anio}",
            "total_inversiones": total_inversiones,
            "total_gastos": total_gastos,
            "balance": balance
        })
    
    # Invertir para que el más antiguo esté primero
    resultado.reverse()
    
    return resultado