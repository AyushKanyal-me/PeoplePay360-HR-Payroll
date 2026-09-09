export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  created_at: string;
  user?: {
    id: string;
    auth_user_id: string;
    employee_id: string | null;
    employee?: {
      id: string;
      first_name: string;
      last_name: string;
      employee_code: string;
      company_id: string;
    } | null;
  } | null;
}
