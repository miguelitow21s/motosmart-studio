export type UserRole = "admin" | "designer" | "production" | "client"

export type OrderStatus =
  | "received"
  | "designing"
  | "production"
  | "sewing"
  | "finished"
  | "delivered"

export type WorkType =
  | "cover"
  | "foam"
  | "embroidery"
  | "design"
  | "full_custom"
  | "repair"

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  created_at: string
}

export interface Client {
  id: string
  name: string
  phone: string
  email?: string
  notes?: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface Motorcycle {
  id: string
  brand: string
  model: string
  year?: number
  displacement?: string
  notes?: string
}

export interface Order {
  id: string
  serial: string
  client_id: string
  client?: Client
  motorcycle_id?: string
  motorcycle?: Motorcycle
  motorcycle_custom?: string
  work_type: WorkType
  status: OrderStatus
  total_price: number
  deposit: number
  balance: number
  delivery_date?: string
  notes?: string
  created_by: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface OrderStatusHistory {
  id: string
  order_id: string
  status: OrderStatus
  notes?: string
  created_by: string
  created_at: string
}

export interface OrderDesign {
  id: string
  order_id: string
  template_id?: string
  fabric_json: object
  svg_content?: string
  preview_url?: string
  version: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface SeatTemplate {
  id: string
  motorcycle_id: string
  name: string
  svg_content: string
  fabric_json?: object
  preview_url?: string
  is_active: boolean
  created_at: string
}

export interface TemplateZone {
  id: string
  template_id: string
  name: string
  path_id: string
  default_color?: string
  order: number
}

export interface Material {
  id: string
  name: string
  type: "vinyl" | "leather" | "neoprene" | "fabric" | "other"
  color_hex?: string
  texture_url?: string
  is_active: boolean
}

export interface UploadedFile {
  id: string
  order_id?: string
  name: string
  url: string
  type: "logo" | "reference" | "final_photo" | "other"
  size: number
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  read: boolean
  order_id?: string
  created_at: string
}

export interface KpiData {
  activeOrders: number
  deliveriesToday: number
  weeklyRevenue: number
  overdueOrders: number
  weeklyProduction: number
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
}
