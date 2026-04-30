/**
 * lib/api.ts
 * ──────────────────────────────────────────────────────────
 * All communication with the Express/MySQL backend lives here.
 * Every helper returns the parsed JSON body (throws on error).
 *
 * Usage (from any component):
 *   import { studentsApi } from "@/lib/api"
 *   const students = await studentsApi.getAll({ standard: "10" })
 */

const BASE = process.env.NEXT_PUBLIC_API_URL;

/* ── token helpers ──────────────────────────────────────── */
export const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

export const setToken = (t: string) => localStorage.setItem("token", t);
export const clearToken = () => localStorage.removeItem("token");

/* ── low-level fetch wrapper ────────────────────────────── */
async function request<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Request failed");
  return json;
}

const get  = (path: string) => request(path);
const post = (path: string, body: unknown) =>
  request(path, { method: "POST", body: JSON.stringify(body) });
const put  = (path: string, body: unknown) =>
  request(path, { method: "PUT",  body: JSON.stringify(body) });
const del  = (path: string) => request(path, { method: "DELETE" });

/* ── query-string builder ───────────────────────────────── */
function qs(params: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v && v !== "all") p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}

/* ══════════════════════════════════════════════════════════
   AUTH
══════════════════════════════════════════════════════════ */
export const authApi = {
  login: (email: string, password: string) =>
    post("/auth/login", { email, password }),

  // signup: (name: string, email: string, password: string) =>
  //   post("/auth/signup", { name, email, password }),
  signup: (name: string, email: string, password: string, role: "admin" | "teacher" = "teacher") =>
    post("/auth/signup", { name, email, password, role }),
};

/* ══════════════════════════════════════════════════════════
   PROFILE
══════════════════════════════════════════════════════════ */
export const profileApi = {
  get: () => get("/profile"),
  update: (data: { name: string; email: string; institute: string; address: string }) =>
    put("/profile", data),
};

/* ══════════════════════════════════════════════════════════
   STUDENTS
══════════════════════════════════════════════════════════ */
export const studentsApi = {
  getAll: (filters: { standard?: string; board?: string; location?: string; search?: string } = {}) =>
    get(`/students${qs(filters)}`),

  getOne: (id: string | number) => get(`/students/${id}`),

  create: (data: Record<string, unknown>) => post("/students", data),

  update: (id: string | number, data: Record<string, unknown>) =>
    put(`/students/${id}`, data),

  remove: (id: string | number) => del(`/students/${id}`),
};

export const studentsUniversalApi = {
  getAll: (filters: { standard?: string; board?: string; location?: string; search?: string } = {}) =>
    get(`/students-universal${qs(filters)}`),
};

/* ══════════════════════════════════════════════════════════
   TEACHERS
══════════════════════════════════════════════════════════ */
export const teachersApi = {
  getAll: () => get("/teachers"),
  getOne: (id: string | number) => get(`/teachers/${id}`),
  create: (data: Record<string, unknown>) => post("/teachers", data),
  update: (id: string | number, data: Record<string, unknown>) =>
    put(`/teachers/${id}`, data),
  remove: (id: string | number) => del(`/teachers/${id}`),
};

/* ══════════════════════════════════════════════════════════
   TEACHER UPDATES
══════════════════════════════════════════════════════════ */
export const teacherUpdatesApi = {
  getAll: (filters: {
    teacher_id?: string;
    teacher_name?: string;
    branch?: string;
    subject?: string;
    date_from?: string;
    date_to?: string;
    page?: string;
    limit?: string;
  } = {}) => get(`/teacher-updates${qs(filters)}`),
  create: (data: Record<string, unknown>) => post("/teacher-updates", data),
  update: (id: string | number, data: Record<string, unknown>) =>
    put(`/teacher-updates/${id}`, data),
  remove: (id: string | number) => del(`/teacher-updates/${id}`),
};

/* ══════════════════════════════════════════════════════════
   INQUIRIES
══════════════════════════════════════════════════════════ */
export const inquiriesApi = {
  getAll: (filters: { date_filter?: string; location?: string; standard?: string } = {}) =>
    get(`/inquiries${qs(filters)}`),

  getOne: (id: string | number) => get(`/inquiries/${id}`),
  create: (data: Record<string, unknown>) => post("/inquiries", data),
  update: (id: string | number, data: Record<string, unknown>) =>
    put(`/inquiries/${id}`, data),
  remove: (id: string | number) => del(`/inquiries/${id}`),
};

/* ══════════════════════════════════════════════════════════
   INQUIRY EXTRA
══════════════════════════════════════════════════════════ */
export const inquiryExtraApi = {
  getAll: () => get("/inquiry-extra"),

  // create: async (payload: object) => {
  //   const res = await fetch("/api/inquiry-extra", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(payload),
  //   });
  //   return res.json();
  // },
   create: (payload: Record<string, unknown>) => post("/inquiry-extra", payload),
};

/* ══════════════════════════════════════════════════════════
   APPOINTMENTS
══════════════════════════════════════════════════════════ */
export const appointmentsApi = {
  getAll: (filters: { date_filter?: string; location?: string } = {}) =>
    get(`/appointments${qs(filters)}`),

  getOne: (id: string | number) => get(`/appointments/${id}`),
  create: (data: Record<string, unknown>) => post("/appointments", data),
  update: (id: string | number, data: Record<string, unknown>) =>
    put(`/appointments/${id}`, data),
  remove: (id: string | number) => del(`/appointments/${id}`),
};

/* ══════════════════════════════════════════════════════════
   INVOICES
══════════════════════════════════════════════════════════ */
export const invoicesApi = {
  getAll: (filters: { status?: string } = {}) =>
    get(`/invoices${qs(filters)}`),

  summary: () => get("/invoices/summary"),
  getOne:  (id: string | number) => get(`/invoices/${id}`),
  create:  (data: Record<string, unknown>) => post("/invoices", data),
  update:  (id: string | number, data: Record<string, unknown>) =>
    put(`/invoices/${id}`, data),
  remove:  (id: string | number) => del(`/invoices/${id}`),
};

/* ══════════════════════════════════════════════════════════
   FINANCE
══════════════════════════════════════════════════════════ */
export const financeApi = {
  getAll: (filters: { type?: string; time_filter?: string } = {}) =>
    get(`/finance${qs(filters)}`),

  summary: (time_filter = "thisMonth") =>
    get(`/finance/summary?time_filter=${time_filter}`),

  create: (data: Record<string, unknown>) => post("/finance", data),

  update: (id: string | number, data: Record<string, unknown>) =>
    put(`/finance/${id}`, data),

  remove: (id: string | number) => del(`/finance/${id}`),
};


/* ══════════════════════════════════════════════════════════
   STAFF
══════════════════════════════════════════════════════════ */
export const staffApi = {
  getAll: () => get("/staff"),

  getOne: (id: string | number) => get(`/staff/${id}`),

  create: (data: Record<string, unknown>) => post("/staff", data),

  update: (id: string | number, data: Record<string, unknown>) =>
    put(`/staff/${id}`, data),

  remove: (id: string | number) => del(`/staff/${id}`),
};




/* ══════════════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════════════ */
export const dashboardApi = {
  stats:               () => get("/dashboard/stats"),
  paymentStatus:       () => get("/dashboard/payment-status"),
  studentsByStandard:  () => get("/dashboard/students-by-standard"),
  studentsByLocation:  () => get("/dashboard/students-by-location"),
  feeCollection:       () => get("/dashboard/fee-collection"),
  financeOverview:     () => get("/dashboard/finance-overview"),
};


export const teacherStudentAssessmentsApi = {
  getLatestAll: () => get("/teacher-student-assessments"),
  getByStudent: (studentId: string | number) => get(`/teacher-student-assessments/${studentId}`),
   createByStudent: (studentId: string | number, data: Record<string, unknown>) =>
    post(`/teacher-student-assessments/${studentId}`, data),
};


