# 🌤️ MeteoPulse - Aplicación Web del Clima Global (Open-Meteo REST API)



## 🔗 Enlaces del Proyecto
- **Sitio Web Público (GitHub Pages):** [https://tadeovv27.github.io/MeteoPulse/](https://tadeovv27.github.io/MeteoPulse/)
- **Repositorio de Código:** [https://github.com/TadeoVV27/MeteoPulse](https://github.com/TadeoVV27/MeteoPulse)

---

## 📌 1. Descripción del Proyecto

**MeteoPulse** es una miniaplicación web interactiva que consulta información meteorológica en tiempo real a nivel global sin requerir registro de claves privadas o sensibles. Permite a los usuarios buscar cualquier ciudad o región del mundo, seleccionar entre múltiples coincidencias geográficas, visualizar las condiciones actuales (temperatura, sensación térmica, humedad, viento, precipitación) y consultar el pronóstico extendido a 7 días.

---

## 🌐 2. Información de la API REST Seleccionada

La aplicación utiliza la API de **[Open-Meteo](https://open-meteo.com/)**, un servicio meteorológico abierto, de alta disponibilidad y sin necesidad de API keys.

### Endpoints Utilizados

#### A. Servicio de Geocodificación (Geocoding API)
- **URL Base:** `https://geocoding-api.open-meteo.com/v1/search`
- **Método HTTP:** `GET`
- **Parámetros:**
  - `name`: Nombre de la ciudad o localidad (ej. `Madrid`).
  - `count`: Número máximo de coincidencias a retornar (ej. `5`).
  - `language`: Idioma de los resultados (`es`).
  - `format`: Formato de respuesta (`json`).
- **Ejemplo de consulta:**
  ```http
  GET https://geocoding-api.open-meteo.com/v1/search?name=Bogota&count=5&language=es&format=json
  ```
- **Estructura de respuesta (JSON simplificado):**
  ```json
  {
    "results": [
      {
        "id": 3688689,
        "name": "Bogotá",
        "latitude": 4.60971,
        "longitude": -74.08175,
        "country": "Colombia",
        "admin1": "Bogota D.C."
      }
    ]
  }
  ```

#### B. Servicio de Pronóstico Meteorológico (Weather Forecast API)
- **URL Base:** `https://api.open-meteo.com/v1/forecast`
- **Método HTTP:** `GET`
- **Parámetros:**
  - `latitude`: Latitud de la localidad (ej. `4.60971`).
  - `longitude`: Longitud de la localidad (ej. `-74.08175`).
  - `current`: Variables actuales solicitadas (`temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m`).
  - `daily`: Variables de pronóstico diario (`weather_code,temperature_2m_max,temperature_2m_min`).
  - `timezone`: Zona horaria automática (`auto`).
- **Ejemplo de consulta:**
  ```http
  GET https://api.open-meteo.com/v1/forecast?latitude=4.60971&longitude=-74.08175&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto
  ```
- **Códigos de estado HTTP gestionados:**
  - `200 OK`: Consulta exitosa con los datos meteorológicos procesados.
  - `400 Bad Request`: Parámetros geográficos inválidos o faltantes.
  - `404 Not Found` / Resultados vacíos: Ciudad inexistente o no localizada.
  - `500 Internal Server Error`: Falla interna del servicio meteorológico remoto.

---

## 🛠️ 3. Tecnologías y Recursos Utilizados

- **HTML5 Semántico:** Formularios accesibles, secciones con `aria-label` y roles interactivos (`aria-live`).
- **CSS3 Moderno:** Flexbox, CSS Grid, Glassmorphism, degradados variables y diseño responsivo para móviles y escritorio.
- **JavaScript ES6+:**
  - `fetch()` y sintaxis `async/await`.
  - Manejo de excepciones con bloques `try...catch` y control de `response.ok`.
  - Manipulación y creación dinámica de nodos en el DOM (`document.createElement`).
  - Diccionario de mapeo de códigos meteorológicos de la Organización Meteorológica Mundial (WMO).
- **Control de versiones:** Git & GitHub.
- **Despliegue:** GitHub Pages / Vercel.

---

## ⚙️ 4. Características de la Interfaz y Estados de UI

1. **Estado de Carga (Loading State):** Animación de spinner visual mientras las promesas de red se resuelven de forma asíncrona.
2. **Estado Vacío / Sin Resultados (Empty State):** Mensajes comprensibles en caso de que una búsqueda no arroje resultados.
3. **Manejo de Errores (Error Handling):** Tarjeta de error descriptiva con botón de **Reintentar** en caso de pérdida de conexión o fallos HTTP.
4. **Interacción Avanzada:**
   - Barra de búsqueda con botón de limpieza rápida (`✕`).
   - Chips interactivos con ciudades predeterminadas.
   - Selector inteligente en caso de nombres homónimos (ej. Santiago de Chile vs Santiago de Compostela).

---

## 🚀 5. Instrucciones de Uso y Ejecución Local

1. Clonar el repositorio o descargar los archivos:
   ```bash
   git clone <URL_DE_TU_REPOSITORIO>
   cd app-clima-openmeteo
   ```
2. Abrir el archivo `index.html` directamente en cualquier navegador moderno (Chrome, Firefox, Edge, Safari), o utilizar una extensión como **Live Server** en VS Code.

---

## 📤 6. Despliegue en GitHub Pages

Para publicar la aplicación en internet y obtener una URL pública:

1. Crea un repositorio en GitHub (ejemplo: `meteo-pulse-api`).
2. Sube los archivos con Git:
   ```bash
   git init
   git add .
   git commit -m "feat: implementacion inicial de consumo de API Open-Meteo con async/await"
   git branch -M main
   git remote add origin https://github.com/<tu-usuario>/meteo-pulse-api.git
   git push -u origin main
   ```
3. En GitHub, ve a **Settings** > **Pages**.
4. En **Build and deployment > Source**, selecciona `Deploy from a branch`, elige la rama `main` y la carpeta `/(root)`.
5. Haz clic en **Save**. En un par de minutos tendrás tu URL pública:  
   `https://<tu-usuario>.github.io/meteo-pulse-api/`

---

## 📝 7. Reflexión Técnica Breve

> **Tema:** *Evolución de servicios web: De XML/SOAP a JSON/REST y Fetch API moderno.*

Históricamente, la integración de servicios web dependía en gran medida del estándar XML y protocolos basados en SOAP (*Simple Object Access Protocol*). Aunque XML proporcionaba una estructura formal y esquemas estrictos (XSD), conllevaba una sobrecarga considerable de procesamiento, verbosidad en el payload transmitido y una mayor complejidad para su manipulación en el cliente con objetos como `XMLHttpRequest` y parseadores DOM de XML.

La transición hacia arquitecturas **REST** combinadas con **JSON** supuso un salto cuántico en eficiencia y ergonomía para el desarrollo web. JSON es un subconjunto nativo de la sintaxis de objetos de JavaScript, lo que elimina la necesidad de capas pesadas de deserialización (`response.json()` produce directamente estructuras de datos listas para iterar). 

Adicionalmente, el reemplazo del modelo asíncrono basado en callbacks o eventos por **Promises** y la sintaxis **`async/await`** junto con **`fetch()`** permite escribir código asíncrono con una estructura secuencial, limpia y legible. Esto simplifica drásticamente el control de flujo y la captura centralizada de errores (`try/catch`), garantizando interfaces reactivas, confiables y con una experiencia de usuario mucho más fluida.
