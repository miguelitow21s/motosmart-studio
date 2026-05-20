export const ROUTES = {
  home: "/",
  login: "/login",
  dashboard: "/pedidos",
  orders: {
    list: "/pedidos",
    new: "/pedidos/nuevo",
    detail: (id: string) => `/pedidos/${id}`,
    designer: (id: string) => `/pedidos/${id}/diseno`,
  },
  clients: {
    list: "/clientes",
    detail: (id: string) => `/clientes/${id}`,
  },
  production: "/produccion",
  templates: "/plantillas",
  settings: "/configuracion",
  publicOrder: (serial: string) => `/estado/${serial}`,
} as const
