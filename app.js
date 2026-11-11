/**
 * MeteoPulse - Miniaplicación Web consumiendo la API REST de Open-Meteo
 * Laboratorio de Programación Web - Actividad 4
 * 
 * Características implementadas:
 * - Programación Asíncrona con fetch() y async/await
 * - Manejo riguroso de errores (red, HTTP 4xx/5xx) y validación de response.ok
 * - Manipulación dinámica del DOM
 * - Estados de UI: Carga (Loading), Vacío (Empty) y Error con reintento
 * - Búsqueda de ciudades con Geocodificación y selector de múltiples coincidencias
 * - Chips interactivos de búsqueda rápida
 */

// ==========================================
// 1. Constantes y Endpoints de la API
// ==========================================
const GEOCODING_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

// Diccionario de interpretación de códigos meteorológicos WMO (World Meteorological Organization)
const WMO_WEATHER_CODES = {
  0: { description: 'Cielo despejado', dayIcon: '☀️', nightIcon: '🌙' },
  1: { description: 'Principalmente despejado', dayIcon: '🌤️', nightIcon: '🌤️' },
  2: { description: 'Parcialmente nublado', dayIcon: '⛅', nightIcon: '☁️' },
  3: { description: 'Nublado', dayIcon: '☁️', nightIcon: '☁️' },
  45: { description: 'Niebla', dayIcon: '🌫️', nightIcon: '🌫️' },
  48: { description: 'Niebla con escarcha', dayIcon: '🌫️', nightIcon: '🌫️' },
  51: { description: 'Llovizna ligera', dayIcon: '🌦️', nightIcon: '🌧️' },
  53: { description: 'Llovizna moderada', dayIcon: '🌦️', nightIcon: '🌧️' },
  55: { description: 'Llovizna densa', dayIcon: '🌧️', nightIcon: '🌧️' },
  61: { description: 'Lluvia leve', dayIcon: '🌧️', nightIcon: '🌧️' },
  63: { description: 'Lluvia moderada', dayIcon: '🌧️', nightIcon: '🌧️' },
  65: { description: 'Lluvia fuerte', dayIcon: '🌧️', nightIcon: '🌧️' },
  71: { description: 'Nevada ligera', dayIcon: '🌨️', nightIcon: '🌨️' },
  73: { description: 'Nevada moderada', dayIcon: '🌨️', nightIcon: '🌨️' },
  75: { description: 'Nevada intensa', dayIcon: '❄️', nightIcon: '❄️' },
  77: { description: 'Granizo menudo', dayIcon: '🌨️', nightIcon: '🌨️' },
  80: { description: 'Chubascos leves', dayIcon: '🌦️', nightIcon: '🌧️' },
  81: { description: 'Chubascos moderados', dayIcon: '🌧️', nightIcon: '🌧️' },
  82: { description: 'Chubascos violentos', dayIcon: '⛈️', nightIcon: '⛈️' },
  85: { description: 'Chubascos de nieve leves', dayIcon: '🌨️', nightIcon: '🌨️' },
  86: { description: 'Chubascos de nieve fuertes', dayIcon: '❄️', nightIcon: '❄️' },
  95: { description: 'Tormenta eléctrica', dayIcon: '⛈️', nightIcon: '⛈️' },
  96: { description: 'Tormenta con granizo ligero', dayIcon: '⛈️', nightIcon: '⛈️' },
  99: { description: 'Tormenta con granizo fuerte', dayIcon: '⛈️', nightIcon: '⛈️' },
};

// ==========================================
// 2. Elementos del DOM
// ==========================================
const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const clearBtn = document.getElementById('clear-btn');
const quickChipsContainer = document.getElementById('quick-chips');
const citySelectorSection = document.getElementById('city-selector-section');
const cityOptionsList = document.getElementById('city-options-list');

// Contenedores de Estados
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const emptyState = document.getElementById('empty-state');
const errorMessage = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');

// Contenedores de Resultados
const weatherContent = document.getElementById('weather-content');
const currentWeatherCard = document.getElementById('current-weather-card');
const metricsGrid = document.getElementById('metrics-grid');
const forecastGrid = document.getElementById('forecast-grid');

// Variable para reintento de última búsqueda
let lastQuery = '';

// ==========================================
// 3. Manejo de Estados de la UI (Carga, Error, Vacío, Contenido)
// ==========================================

function showState(stateName) {
  // Ocultar todos los paneles primero
  loadingState.classList.add('hidden');
  errorState.classList.add('hidden');
  emptyState.classList.add('hidden');
  weatherContent.classList.add('hidden');
  citySelectorSection.classList.add('hidden');

  switch (stateName) {
    case 'loading':
      loadingState.classList.remove('hidden');
      break;
    case 'error':
      errorState.classList.remove('hidden');
      break;
    case 'empty':
      emptyState.classList.remove('hidden');
      break;
    case 'content':
      weatherContent.classList.remove('hidden');
      break;
    case 'selector':
      citySelectorSection.classList.remove('hidden');
      break;
  }
}

function displayError(message) {
  errorMessage.textContent = message;
  showState('error');
}

// ==========================================
// 4. Funciones de Consumo de API (fetch + async/await)
// ==========================================

/**
 * Paso 1: Busca coordenadas geográficas de la ciudad ingresada
 * Endpoint: https://geocoding-api.open-meteo.com/v1/search
 */
async function searchLocations(cityName) {
  const url = `${GEOCODING_API_URL}?name=${encodeURIComponent(cityName)}&count=5&language=es&format=json`;

  try {
    const response = await fetch(url);

    // Verificación de status HTTP (200-299)
    if (!response.ok) {
      throw new Error(`Error en el servicio de geolocalización (Código HTTP: ${response.status})`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error al geocodificar:', error);
    throw new Error('No fue posible conectar con el servicio de geocodificación. Revisa tu conexión a internet.');
  }
}

/**
 * Paso 2: Consulta el pronóstico del clima con latitud y longitud
 * Endpoint: https://api.open-meteo.com/v1/forecast
 */
async function fetchWeatherData(latitude, longitude) {
  const params = new URLSearchParams({
    latitude: latitude,
    longitude: longitude,
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    timezone: 'auto'
  });

  const url = `${WEATHER_API_URL}?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error al obtener datos meteorológicos (Código HTTP: ${response.status})`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener clima:', error);
    throw new Error('Error al consultar el clima para esta ubicación. Intenta nuevamente.');
  }
}

// ==========================================
// 5. Flujo Principal de Búsqueda
// ==========================================

async function handleSearch(query) {
  const cleanQuery = query.trim();
  if (!cleanQuery) return;

  lastQuery = cleanQuery;
  showState('loading');

  try {
    const locations = await searchLocations(cleanQuery);

    if (locations.length === 0) {
      displayError(`No se encontraron resultados para "${cleanQuery}". Intenta con otra ciudad.`);
      return;
    }

    // Si solo hay una ubicación, cargarla directamente
    if (locations.length === 1) {
      await loadCityWeather(locations[0]);
    } else {
      // Si hay varias coincidencias, permitir al usuario elegir
      renderLocationSelector(locations);
    }
  } catch (err) {
    displayError(err.message || 'Error inesperado al procesar la solicitud.');
  }
}

async function loadCityWeather(location) {
  showState('loading');
  try {
    const weatherData = await fetchWeatherData(location.latitude, location.longitude);
    renderWeather(weatherData, location);
    showState('content');
  } catch (err) {
    displayError(err.message || 'No se pudieron cargar los datos del clima.');
  }
}

// ==========================================
// 6. Renderizado Dinámico en el DOM
// ==========================================

/**
 * Muestra opciones de selección cuando hay varias ciudades coincidentes
 */
function renderLocationSelector(locations) {
  cityOptionsList.innerHTML = '';

  locations.forEach((loc) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'city-option-item';

    const locationName = `${loc.name}${loc.admin1 ? `, ${loc.admin1}` : ''}`;
    const country = loc.country || 'Desconocido';

    btn.innerHTML = `
      <span><strong>${locationName}</strong></span>
      <span style="color: var(--accent-cyan); font-size: 0.9rem;">${country}</span>
    `;

    btn.addEventListener('click', () => {
      loadCityWeather(loc);
    });

    cityOptionsList.appendChild(btn);
  });

  showState('selector');
}

/**
 * Genera dinámicamente las tarjetas y métricas del clima
 */
function renderWeather(data, location) {
  const current = data.current;
  const daily = data.daily;

  const wmoInfo = WMO_WEATHER_CODES[current.weather_code] || {
    description: 'Condición no especificada',
    dayIcon: '🌡️',
    nightIcon: '🌡️'
  };

  const isDay = current.is_day === 1;
  const currentIcon = isDay ? wmoInfo.dayIcon : wmoInfo.nightIcon;

  // 1. Tarjeta de Clima Actual
  const regionText = location.admin1 ? `${location.admin1}, ` : '';
  currentWeatherCard.innerHTML = `
    <div class="current-info">
      <h2>${location.name}</h2>
      <p class="location-meta">${regionText}${location.country || ''} &bull; Zona horaria: ${data.timezone}</p>
      
      <div class="temp-container">
        <span class="main-temp">${Math.round(current.temperature_2m)}°C</span>
      </div>
      
      <p class="weather-condition">${wmoInfo.description}</p>
      <p class="feels-like">Sensación térmica: <strong>${Math.round(current.apparent_temperature)}°C</strong></p>
    </div>
    
    <div class="current-visual">
      <div class="weather-icon-large">${currentIcon}</div>
    </div>
  `;

  // 2. Grilla de Métricas Complementarias
  metricsGrid.innerHTML = `
    <div class="metric-card">
      <span class="metric-icon">💧</span>
      <div class="metric-data">
        <h4>Humedad Relativa</h4>
        <p>${current.relative_humidity_2m}%</p>
      </div>
    </div>

    <div class="metric-card">
      <span class="metric-icon">💨</span>
      <div class="metric-data">
        <h4>Velocidad del Viento</h4>
        <p>${current.wind_speed_10m} km/h</p>
      </div>
    </div>

    <div class="metric-card">
      <span class="metric-icon">🌧️</span>
      <div class="metric-data">
        <h4>Precipitación</h4>
        <p>${current.precipitation} mm</p>
      </div>
    </div>

    <div class="metric-card">
      <span class="metric-icon">🧭</span>
      <div class="metric-data">
        <h4>Coordenadas</h4>
        <p style="font-size: 0.95rem;">${location.latitude.toFixed(2)}°, ${location.longitude.toFixed(2)}°</p>
      </div>
    </div>
  `;

  // 3. Pronóstico de los Próximos 7 Días
  forecastGrid.innerHTML = '';
  const daysCount = daily.time.length;

  for (let i = 0; i < daysCount; i++) {
    const dateStr = daily.time[i];
    const code = daily.weather_code[i];
    const maxTemp = Math.round(daily.temperature_2m_max[i]);
    const minTemp = Math.round(daily.temperature_2m_min[i]);

    const dayName = getFormattedDay(dateStr, i === 0);
    const dayWmo = WMO_WEATHER_CODES[code] || { dayIcon: '🌤️' };

    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
      <span class="forecast-day">${dayName}</span>
      <span class="forecast-icon">${dayWmo.dayIcon}</span>
      <div class="forecast-temps">
        <span class="temp-max">${maxTemp}°</span>
        <span class="temp-min">${minTemp}°</span>
      </div>
    `;

    forecastGrid.appendChild(card);
  }
}

/**
 * Formatea una fecha ISO (YYYY-MM-DD) al nombre del día en español
 */
function getFormattedDay(dateString, isToday) {
  if (isToday) return 'Hoy';
  const parts = dateString.split('-');
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
  return dayName.charAt(0).toUpperCase() + dayName.slice(1);
}

// ==========================================
// 7. Event Listeners y Manejo de Interacción
// ==========================================

// Envío del formulario
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  handleSearch(cityInput.value);
});

// Botón de reintento en caso de error
retryBtn.addEventListener('click', () => {
  if (lastQuery) {
    handleSearch(lastQuery);
  } else {
    showState('empty');
  }
});

// Control del botón de limpiar texto
cityInput.addEventListener('input', () => {
  clearBtn.style.display = cityInput.value.trim() ? 'block' : 'none';
});

clearBtn.addEventListener('click', () => {
  cityInput.value = '';
  clearBtn.style.display = 'none';
  cityInput.focus();
});

// Chips de ciudades sugeridas
quickChipsContainer.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (chip) {
    const city = chip.getAttribute('data-city');
    cityInput.value = city;
    clearBtn.style.display = 'block';
    handleSearch(city);
  }
});

// Carga inicial por defecto con una ciudad representativa (ej. Ciudad de México o Tokio)
document.addEventListener('DOMContentLoaded', () => {
  // Inicializamos con un estado limpio, o bien podemos consultar una ciudad inicial:
  handleSearch('Ciudad de México');
});
