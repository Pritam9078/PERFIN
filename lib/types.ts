export type TxType = 'income' | 'expense';
export interface Category { id: string; user_id: string | null; name: string; type: TxType; icon: string | null; color: string | null; is_default: boolean }
export interface Profile { id: string; full_name: string | null; currency: string; timezone: string; alert_thresholds: number[] }
export interface Transaction {
  id: string; category_id: string; title: string; amount: number; type: TxType; transaction_date: string;
  payment_method: string | null; merchant: string | null; notes: string | null; tags: string[];
  category?: Pick<Category, 'id' | 'name' | 'color' | 'icon'> | null;
}
export interface BudgetRow {
  id: string; category_id: string; category_name: string; category_color: string | null;
  period_start: string; period_end: string; limit_amount: number; spent: number;
}
export interface Goal {
  id: string; name: string; target_amount: number; current_amount: number; target_date: string | null;
  description: string | null; status: 'active' | 'completed' | 'archived';
}
