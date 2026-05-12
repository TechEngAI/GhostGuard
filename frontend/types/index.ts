export type UserType = "admin" | "worker" | "hr";

export interface Admin {
  id: string;
  auth_user_id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  phone_number: string;
  gender?: string;
  status: "ACTIVE" | "SUSPENDED";
  last_login?: string;
  created_at: string;
}

export interface Worker {
  id: string;
  auth_user_id: string;
  company_id: string;
  role_id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  phone_number: string;
  gender?: string;
  date_of_birth?: string;
  home_address?: string;
  state_of_origin?: string;
  next_of_kin_name?: string;
  next_of_kin_phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  nin?: string;
  bank_verified: boolean;
  status: string;
  completeness_score: number;
  last_login?: string;
}

export interface HrOfficer {
  id: string;
  auth_user_id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: "ACTIVE" | "SUSPENDED";
  last_login?: string;
}

export interface Company {
  id: string;
  name: string;
  industry?: string;
  size?: string;
  office_lat?: number;
  office_lng?: number;
  geofence_radius: number;
  work_start_time: string;
  work_end_time: string;
  working_days: string;
  payroll_cycle: string;
  timezone: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: { code: string; message: string; field?: string };
}
