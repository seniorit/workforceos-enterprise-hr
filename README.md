# Remix WorkforceOS — Enterprise HR Management System

**WorkforceOS** es una plataforma de gestión de recursos humanos y nómina empresarial construida sobre **Angular 21** y **Firebase Firestore**, optimizada para operar con sincronización en tiempo real y soporte **Offline Progressive Web App (PWA)**.

---

## 🚀 Características Principales

### 1. 💼 Gestión de Empleados y Nómina Multi-Moneda
- **Expediente Digital**: Registro detallado de empleados, departamentos, salarios y tipo de contrato.
- **Conversión Automática USD / BCV**: Integración con la Tasa Oficial del Banco Central de Venezuela (BCV) para la conversión de salarios en Bolívares (VES) y Dólares (USD).
- **Recibos de Pago PDF**: Generación e impresión instantánea de recibos de nómina en formato PDF profesional utilizando `jspdf`.
- **Pago Móvil & Banco**: Modal con datos bancarios y guía de transferencia directa.

### 2. ⏱️ Control de Asistencia y Permisos
- **Registro Diario**: Control de punch-in / punch-out con marcas de tiempo, estados de puntualidad y tardanzas.
- **Gestión de Inasistencias**: Modales para solicitar y aprobar permisos médicos, vacaciones y ausencias justificadas.
- **Reportes Exportables**: Gráficos y analíticas exportables sobre el ausentismo laboral.

### 3. 🔐 Autenticación y Control de Acceso por Roles (RBAC)
- **Roles Definidos**: Super Administrador, Administrador, Gerente de RRHH y Empleado.
- **Perfiles de Usuario**: Edición de perfil, avatares y cambio dinámico de permisos.

### 4. 📴 Soporte Offline y PWA (Progressive Web App)
- **Persistencia Firestore Offline**: Utiliza `persistentLocalCache` y `persistentMultipleTabManager`. Permite realizar consultas, lecturas y escrituras sin conexión a internet.
- **Sincronización Automática**: Los cambios efectuados offline se sincronizan en segundo plano al recuperar la conectividad.
- **Instalable como App**: Configuración completa de Service Worker (`ngsw-config.json`) y Manifest de PWA (`public/manifest.webmanifest`).

### 5. ⚠️ Zona de Peligro: Purga Destructiva de Base de Datos
- **Reinicio a Cero**: Opción disponible en la configuración para purgar la base de datos de Firestore.
- **Reestablecimiento de Super Admin**: Elimina colecciones de empleados, asistencias y usuarios, reestableciendo al usuario **Super Administrador (`admin@workforceos.com`)** como el único usuario en el sistema.
- **Verificación Obligatoria**: Requiere confirmación explícita mediante la palabra clave `PURGAR` o `REINICIAR` para prevenir ejecuciones accidentales.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Angular 21 (Zoneless, Signals, Native Control Flow `@if` / `@for`)
- **Estilos**: Tailwind CSS 4 con arquitectura visual en tonos oscuros elegantes (`#0B0E14`)
- **Base de Datos & Auth**: Firebase Firestore & Firebase Authentication
- **Offline & PWA**: `@angular/pwa`, `@angular/service-worker`, Firestore Persistent Local Cache
- **Exportación & Gráficos**: `jspdf`, `jspdf-autotable`, Google Material Symbols

---

## 💻 Instalación y Ejecución Local

1. **Clonar el repositorio**:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd ai-studio-remixworkforceos
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Variables de Entorno (`.env`)**:
   Crea un archivo `.env` o configura las variables basándote en `.env.example`:
   ```env
   GEMINI_API_KEY="TU_API_KEY"
   APP_URL="http://localhost:3000"
   ```

4. **Iniciar Servidor de Desarrollo**:
   ```bash
   npm run dev
   ```
   La aplicación se ejecutará en `http://localhost:3000`.

---

## 📋 Comandos Útiles

- `npm run build`: Compila la aplicación para producción con Service Worker.
- `npm run lint`: Ejecuta el linter de Angular para verificar la calidad del código.
- `npm run dev`: Inicia el servidor de desarrollo local.

---

© 2026 Workforce HR Management System.
