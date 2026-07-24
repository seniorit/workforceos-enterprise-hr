# WorkforceOS Enterprise HR

Sistema de gestión de recursos humanos empresarial para la administración de empleados, nómina, asistencia, departamentos y paneles de control con soporte de moneda dual (VES/USD).

## Funcionalidades

- **Dashboard** — Panel con métricas clave: total de empleados, distribución por departamento, contrataciones recientes y próximos cumpleaños
- **Empleados** — CRUD completo con filtros por departamento, estado y búsqueda
- **Nómina** — Gestión de registros de nómina con cálculo en USD y conversión a VES (tasa BCV)
- **Asistencia** — Registro de entrada/salida con estados: Presente, Tardanza, Inasistencia, Justificado
- **Departamentos** — CRUD con escritura dual (Firestore + API REST)
- **Usuarios** — Administración de usuarios del sistema con asignación de roles
- **Control de acceso (RBAC)** — 4 roles con 9 permisos granulares
- **Moneda dual** — Tasas de cambio BCV actualizables desde la interfaz

## Stack tecnológico

| Tecnología | Versión |
|---|---|
| Angular | 21 (standalone, signals, SSR) |
| Express | 5 |
| Firebase / Firestore | 12 |
| Tailwind CSS | 4 |
| Angular Material | 21 |
| Motion | 12 |
| TypeScript | 5.9 |
| Vitest | 4 |

## Requisitos previos

- Node.js 20 o superior
- npm

## Instalación y puesta en marcha

```bash
# Clonar el repositorio
git clone <repo-url>
cd workforceos-enterprise-hr

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con GEMINI_API_KEY y APP_URL

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Usuarios de demostración

| Correo | Contraseña | Rol |
|---|---|---|
| admin@workforceos.com | admin123 | ADMIN |
| recruiter@workforceos.com | hr123 | HR_MANAGER |
| payroll@workforceos.com | pay123 | PAYROLL_ADMIN |
| supervisor@workforceos.com | view123 | SUPERVISOR |

## Estructura del proyecto

```
src/
├── app/
│   ├── app.ts                     # Componente raíz
│   ├── app.routes.ts              # Definición de rutas
│   ├── app.config.ts              # Proveedores de la aplicación
│   ├── core/
│   │   ├── config/
│   │   │   └── firebase.config.ts # Inicialización de Firebase
│   │   ├── guards/
│   │   │   └── auth.guard.ts      # Guard de autenticación
│   │   ├── models/                # Interfaces y tipos
│   │   └── services/              # Servicios (auth, employees, payroll, etc.)
│   └── features/                  # Componentes standalone
│       ├── login/
│       ├── dashboard/
│       ├── employees/
│       ├── payroll/
│       ├── attendance/
│       ├── departments/
│       └── users/
├── server.ts                      # Servidor Express con API REST
├── main.ts                        # Bootstrap del navegador
├── main.server.ts                 # Bootstrap SSR
├── index.html                     # Shell HTML
└── styles.css                     # Estilos globales (Tailwind)
```

## Arquitectura

La aplicación sigue una arquitectura de **componentes standalone** con **Angular SSR**:

- **Frontend**: Angular 21 con signals, ChangeDetectionStrategy.OnPush y Tailwind CSS
- **Backend**: API REST embebida en Express dentro del mismo servidor SSR
- **Persistencia**: Datos en memoria (servidor) con escritura dual a Firestore para departamentos
- **Autenticación**: Sesión manejada via `AuthService` con almacenamiento en localStorage
- **Internacionalización**: Interfaz completamente en español

### Enrutamiento

| Ruta | Componente | Protegida |
|---|---|---|
| `/login` | Login | No |
| `/dashboard` | Dashboard | Sí |
| `/employees` | EmployeeList | Sí |
| `/employees/new` | EmployeeForm | Sí |
| `/employees/edit/:id` | EmployeeForm | Sí |
| `/payroll` | Payroll | Sí |
| `/attendance` | Attendance | Sí |
| `/departments` | Departments | Sí |
| `/users` | UserManagement | Sí |

## Modelo de seguridad (RBAC)

### Roles

| Rol | Descripción |
|---|---|
| ADMIN | Acceso completo a todas las funcionalidades |
| HR_MANAGER | Gestión de empleados, asistencia y departamentos |
| PAYROLL_ADMIN | Gestión de nómina y tasas de cambio |
| SUPERVISOR | Acceso de solo lectura a empleados, nómina y asistencia |

### Permisos

- `employees:read`, `employees:write`
- `payroll:read`, `payroll:write`
- `attendance:read`, `attendance:write`
- `departments:read`, `departments:write`
- `users:manage`

## API REST

La API está embebida en el servidor Express (`src/server.ts`).

### Autenticación

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Inicio de sesión |
| POST | `/api/auth/logout` | Cierre de sesión |
| GET | `/api/auth/me` | Información del usuario actual |

### Entidades

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/employees` | Listar empleados |
| POST | `/api/employees` | Crear empleado |
| GET | `/api/employees/:id` | Obtener empleado |
| PUT | `/api/employees/:id` | Actualizar empleado |
| DELETE | `/api/employees/:id` | Eliminar empleado |
| GET | `/api/payroll` | Listar nóminas |
| POST | `/api/payroll` | Crear registro de nómina |
| PUT | `/api/payroll/:id` | Actualizar nómina |
| DELETE | `/api/payroll/:id` | Eliminar nómina |
| GET | `/api/attendance` | Listar asistencias |
| POST | `/api/attendance` | Registrar asistencia |
| PUT | `/api/attendance/:id` | Actualizar asistencia |
| DELETE | `/api/attendance/:id` | Eliminar asistencia |
| GET | `/api/departments` | Listar departamentos |
| POST | `/api/departments` | Crear departamento |
| PUT | `/api/departments/:id` | Actualizar departamento |
| DELETE | `/api/departments/:id` | Eliminar departamento |
| GET | `/api/users` | Listar usuarios |
| POST | `/api/users` | Crear usuario |
| PUT | `/api/users/:id` | Actualizar usuario |
| DELETE | `/api/users/:id` | Eliminar usuario |
| POST | `/api/users/:id/reset-password` | Restablecer contraseña |
| GET | `/api/dashboard` | Métricas del dashboard |
| GET | `/api/currency/rate` | Obtener tasa de cambio |
| POST | `/api/currency/rate` | Actualizar tasa de cambio |

## Firebase

La aplicación utiliza Firebase para:

- **Firestore**: Almacenamiento de departamentos con reglas de seguridad
- **Firebase Auth**: Proveedor de autenticación Google

Las reglas de seguridad de Firestore validan la estructura de cada documento y requieren autenticación para todas las operaciones.

## Construcción y despliegue

```bash
# Construcción para producción
npm run build

# Los archivos generados estarán en dist/
# Para producción: node dist/app/server/server.mjs
```

El build genera una aplicación con SSR. Las rutas se prerenderizan por defecto, excepto `employees/edit/:id` que se renderiza en cada petición.

## Licencia

Proyecto privado — WorkforceOS
