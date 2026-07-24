// Fix for getter-only 'fetch' property on Window/globalThis in SSR environment
try {
  const g = typeof globalThis !== 'undefined' ? globalThis : null;
  if (g && typeof g.fetch === 'function') {
    const desc = Object.getOwnPropertyDescriptor(g, 'fetch') ||
                 Object.getOwnPropertyDescriptor(Object.getPrototypeOf(g) || {}, 'fetch');
    if (desc && desc.get && !desc.set) {
      const origFetch = g.fetch.bind(g);
      Object.defineProperty(g, 'fetch', {
        value: origFetch,
        writable: true,
        configurable: true,
        enumerable: true
      });
    }
  }
} catch {
  // ignore
}

import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(express.json({ limit: '10mb' }));

// Initial dataset for backend API (Cleaned for production start)
/* eslint-disable @typescript-eslint/no-explicit-any */
let employeesStore: any[] = [];

let payrollStore: any[] = [];

let attendanceStore: any[] = [];

let departmentsStore: any[] = [];

let usersStore: any[] = [
  {
    id: 'usr-1',
    full_name: 'Administrador del Sistema',
    email: 'admin@workforceos.com',
    password: 'admin123',
    role: 'ADMIN',
    department: 'Dirección General',
    status: 'Active',
    permissions: [
      'employees:read',
      'employees:write',
      'payroll:read',
      'payroll:write',
      'attendance:read',
      'attendance:write',
      'departments:read',
      'departments:write',
      'users:manage'
    ],
    last_login: new Date().toISOString(),
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  }
];

// Currency Exchange Rate Store (Official BCV Rate for Venezuela)
let exchangeRateStore = {
  rate: 36.50,
  currency: 'VES',
  source: 'BCV (Banco Central de Venezuela)',
  updated_at: new Date().toISOString(),
  updated_by: 'Carga Manual Diaria'
};

// Helper to sanitize user object
function sanitizeUser(user: typeof usersStore[0]) {
  const copy = { ...user };
  delete (copy as { password?: string }).password;
  return copy;
}

// --- REST API ENDPOINTS ---

// Currency Rate Endpoints
app.get('/api/currency/rate', (req, res) => {
  res.json(exchangeRateStore);
});

app.post('/api/currency/rate', (req, res) => {
  const { rate, source, updated_by } = req.body;
  const numRate = Number(rate);
  if (!rate || isNaN(numRate) || numRate <= 0) {
    res.status(400).json({ error: 'Proporcione un valor de tasa válido mayor a cero.' });
    return;
  }
  exchangeRateStore = {
    rate: numRate,
    currency: 'VES',
    source: source || 'BCV (Banco Central de Venezuela)',
    updated_at: new Date().toISOString(),
    updated_by: updated_by || 'Administrador'
  };
  res.json(exchangeRateStore);
});

// Auth Endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Proporcione correo y contraseña.' });
    return;
  }

  const user = usersStore.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) {
    res.status(401).json({ error: 'Credenciales inválidas. Compruebe el correo y la contraseña.' });
    return;
  }

  if (user.status !== 'Active') {
    res.status(403).json({ error: 'El usuario se encuentra inactivo. Contacte al Administrador.' });
    return;
  }

  user.last_login = new Date().toISOString();
  const token = `token-${user.id}-${Date.now()}`;

  res.json({
    token,
    user: sanitizeUser(user)
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Sesión cerrada correctamente.' });
});

app.get('/api/auth/me', (req, res) => {
  // Return the first active admin user as fallback or current session
  const user = usersStore[0];
  res.json(sanitizeUser(user));
});

// System Users Endpoints
app.get('/api/users', (req, res) => {
  const search = (req.query['search'] as string || '').toLowerCase();
  const role = req.query['role'] as string;
  const status = req.query['status'] as string;

  let filtered = usersStore.map(u => sanitizeUser(u));

  if (search) {
    filtered = filtered.filter(u =>
      u.full_name.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search) ||
      u.department.toLowerCase().includes(search)
    );
  }

  if (role && role !== 'all') {
    filtered = filtered.filter(u => u.role === role);
  }

  if (status && status !== 'all') {
    filtered = filtered.filter(u => u.status === status);
  }

  res.json(filtered);
});

app.get('/api/users/:id', (req, res) => {
  const user = usersStore.find(u => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }
  res.json(sanitizeUser(user));
});

app.post('/api/users', (req, res) => {
  const { email, full_name, role, department, permissions, password } = req.body;

  if (usersStore.some(u => u.email.toLowerCase() === email?.toLowerCase())) {
    res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
    return;
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    full_name: full_name || 'Nuevo Usuario',
    email: email || `user${Date.now()}@workforceos.com`,
    password: password || 'pass123',
    role: role || 'SUPERVISOR',
    department: department || 'General',
    status: 'Active' as const,
    permissions: permissions || ['employees:read'],
    last_login: 'Nunca',
    photo_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
    created_at: new Date().toISOString()
  };

  usersStore.unshift(newUser);
  res.status(201).json(sanitizeUser(newUser));
});

app.put('/api/users/:id', (req, res) => {
  const index = usersStore.findIndex(u => u.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  const updatedUser = {
    ...usersStore[index],
    ...req.body,
    id: req.params.id
  };

  usersStore[index] = updatedUser;
  res.json(sanitizeUser(updatedUser));
});

app.post('/api/users/:id/reset-password', (req, res) => {
  const user = usersStore.find(u => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }
  user.password = req.body.new_password || 'pass12345';
  res.json({ success: true, message: `Contraseña restablecida exitosamente para ${user.full_name}` });
});

app.delete('/api/users/:id', (req, res) => {
  usersStore = usersStore.filter(u => u.id !== req.params.id);
  res.json({ success: true, id: req.params.id });
});

// Employees Endpoints
app.get('/api/employees', (req, res) => {
  const search = (req.query['search'] as string || '').toLowerCase();
  const department = req.query['department'] as string;
  const status = req.query['status'] as string;

  let filtered = [...employeesStore];
  if (search) {
    filtered = filtered.filter(e =>
      e.full_name.toLowerCase().includes(search) ||
      e.job_title.toLowerCase().includes(search) ||
      e.work_email.toLowerCase().includes(search) ||
      e.employee_id.toLowerCase().includes(search)
    );
  }
  if (department && department !== 'all') {
    filtered = filtered.filter(e => e.department.toLowerCase() === department.toLowerCase());
  }
  if (status && status !== 'all') {
    filtered = filtered.filter(e => e.status.toLowerCase() === status.toLowerCase());
  }
  res.json(filtered);
});

app.get('/api/employees/:id', (req, res) => {
  const emp = employeesStore.find(e => e.id === req.params.id);
  if (!emp) {
    res.status(404).json({ error: 'Empleado no encontrado' });
    return;
  }
  res.json(emp);
});

app.post('/api/employees', (req, res) => {
  const newEmp = {
    id: `emp-${Date.now()}`,
    ...req.body,
    created_at: new Date().toISOString()
  };
  employeesStore.unshift(newEmp);
  res.status(201).json(newEmp);
});

app.put('/api/employees/:id', (req, res) => {
  const index = employeesStore.findIndex(e => e.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Empleado no encontrado' });
    return;
  }
  employeesStore[index] = {
    ...employeesStore[index],
    ...req.body,
    id: req.params.id
  };
  res.json(employeesStore[index]);
});

app.delete('/api/employees/:id', (req, res) => {
  employeesStore = employeesStore.filter(e => e.id !== req.params.id);
  res.json({ success: true, id: req.params.id });
});

// Dashboard Metrics Endpoint
app.get('/api/dashboard', (req, res) => {
  const totalEmployees = 1248 + employeesStore.length - 4;
  res.json({
    id: 'dashboard-main',
    total_employees: totalEmployees,
    employee_trend_percentage: 12,
    active_jobs: 24,
    pending_time_off: 18,
    upcoming_birthdays_count: 6,
    department_distribution: [
      { id: 'dd-1', department_name: 'Engineering', count: 450, percentage: 36 },
      { id: 'dd-2', department_name: 'Sales', count: 320, percentage: 26 },
      { id: 'dd-3', department_name: 'Marketing', count: 180, percentage: 14 },
      { id: 'dd-4', department_name: 'Operations', count: 210, percentage: 17 },
      { id: 'dd-5', department_name: 'HR & Legal', count: 88, percentage: 7 }
    ],
    recent_hires: employeesStore.slice(0, 4).map(e => ({
      id: e.id,
      employee_name: e.full_name,
      department: e.department,
      role: e.job_title,
      status: e.status,
      photo_url: e.photo_url
    })),
    upcoming_birthdays: [
      { id: 'bday-1', employee_name: 'Sarah Connor', initials: 'SC', date_text: 'Tomorrow, May 24' },
      { id: 'bday-2', employee_name: 'Bruce Wayne', initials: 'BW', date_text: 'May 26', photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
      { id: 'bday-3', employee_name: 'Peter Parker', initials: 'PP', date_text: 'May 28' }
    ]
  });
});

// Payroll Endpoints
app.get('/api/payroll', (req, res) => {
  res.json(payrollStore);
});

app.get('/api/payroll/:id', (req, res) => {
  const item = payrollStore.find(p => p.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Nómina no encontrada' });
    return;
  }
  res.json(item);
});

app.post('/api/payroll', (req, res) => {
  const newItem = { id: `pay-${Date.now()}`, ...req.body };
  payrollStore.unshift(newItem);
  res.status(201).json(newItem);
});

app.put('/api/payroll/:id', (req, res) => {
  const idx = payrollStore.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Nómina no encontrada' });
    return;
  }
  payrollStore[idx] = { ...payrollStore[idx], ...req.body, id: req.params.id };
  res.json(payrollStore[idx]);
});

app.delete('/api/payroll/:id', (req, res) => {
  payrollStore = payrollStore.filter(p => p.id !== req.params.id);
  res.json({ success: true, id: req.params.id });
});

// Attendance Endpoints
app.get('/api/attendance', (req, res) => {
  res.json(attendanceStore);
});

app.post('/api/attendance', (req, res) => {
  const newItem = { id: `att-${Date.now()}`, ...req.body };
  attendanceStore.unshift(newItem);
  res.status(201).json(newItem);
});

app.put('/api/attendance/:id', (req, res) => {
  const idx = attendanceStore.findIndex(a => a.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Registro de asistencia no encontrado' });
    return;
  }
  attendanceStore[idx] = { ...attendanceStore[idx], ...req.body, id: req.params.id };
  res.json(attendanceStore[idx]);
});

app.delete('/api/attendance/:id', (req, res) => {
  attendanceStore = attendanceStore.filter(a => a.id !== req.params.id);
  res.json({ success: true, id: req.params.id });
});

// Departments Endpoints
app.get('/api/departments', (req, res) => {
  res.json(departmentsStore);
});

app.post('/api/departments', (req, res) => {
  const newItem = { id: `dept-${Date.now()}`, ...req.body };
  departmentsStore.unshift(newItem);
  res.status(201).json(newItem);
});

app.put('/api/departments/:id', (req, res) => {
  const idx = departmentsStore.findIndex(d => d.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Departamento no encontrado' });
    return;
  }
  departmentsStore[idx] = { ...departmentsStore[idx], ...req.body, id: req.params.id };
  res.json(departmentsStore[idx]);
});

app.delete('/api/departments/:id', (req, res) => {
  departmentsStore = departmentsStore.filter(d => d.id !== req.params.id);
  res.json({ success: true, id: req.params.id });
});

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
