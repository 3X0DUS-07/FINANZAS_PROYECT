# 💰 FINANZAS_PROYECT

Proyecto final de gestión financiera personal desarrollado con **FastAPI**, **MySQL** y **SQLModel**.

Permite registrar **gastos**, **inversiones** y **usuarios**, con análisis de balance, porcentajes de ahorro y resultados mensuales.

---

## ⚙️ Requisitos previos

Asegúrate de tener instalado:

- Python 3.10 o superior  
- MySQL Server  
- MySQL Workbench (opcional, para visualizar los datos)  
- Git  

---

## 📦 Instalación del proyecto

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu_usuario/FINANZAS_PROYECT.git
   cd FINANZAS_PROYECT
   ```

2. **Crear un entorno virtual:**
   ```bash
   python -m venv .venv
   ```

3. **Activar el entorno:**
   - En Windows:
     ```bash
     .venv\Scripts\activate
     ```
   - En Linux/Mac:
     ```bash
     source .venv/bin/activate
     ```

4. **Instalar dependencias:**
   ```bash
   pip install -r requirements.txt
   ```

---

## 🗄️ Configurar la base de datos

1. **Crear la base de datos:**
   Abre MySQL Workbench o una terminal y ejecuta:
   ```sql
   CREATE DATABASE final;
   ```

2. **Importar los datos:**
   Ejecuta en la terminal (dentro del proyecto):
   ```bash
   mysql -u root -p final < src/config/final_dump.sql
   ```
   Esto restaurará las tablas (`item`, `gasto`, `inversion`, `session`, etc.) y sus datos.

3. **Archivo `.env`:**
   Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:
   ```env
   MYSQL_SERVER=127.0.0.1
   MYSQL_PORT=3306
   MYSQL_DB=final
   MYSQL_USER=root
   MYSQL_PASSWORD=root
   ```

---

## 🚀 Ejecutar el servidor

Inicia FastAPI con:

```bash
uvicorn src.main:app --reload
```

Luego abre en tu navegador:
```
http://127.0.0.1:8000/docs
```

Ahí podrás probar todos los endpoints desde la interfaz interactiva de **Swagger**.

---

## 🧠 Estructura del proyecto

```
FINANZAS_PROYECT/
│
├── src/
│   ├── config/              # Configuración de la base de datos
│   │   ├── db.py
│   │   └── final_dump.sql
│   │
│   ├── models/              # Modelos SQLModel (tablas)
│   │   ├── gasto.py
│   │   ├── inversion.py
│   │   ├── item.py
│   │   └── relationships.py
│   │
│   ├── routes/              # Rutas de la API
│   │   ├── gasto_router.py
│   │   ├── inversion_router.py
│   │   ├── item_router.py
│   │   └── analisis_router.py
│   │
│   ├── templates/           # Archivos HTML
│   │   └── admit.html
│   │
│   ├── utils/               # Utilidades y dependencias
│   │   └── dependencies.py
│   │
│   ├── main.py              # Punto de entrada principal
│
├── .env                     # Variables de entorno (no subir a GitHub)
├── requirements.txt
└── README.md
```
