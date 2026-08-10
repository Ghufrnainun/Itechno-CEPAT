export type TaskStatus = "open" | "accepted" | "in_progress" | "completed" | "cancelled" | "rejected";
export type ApplicantStatus = "pending" | "accepted" | "rejected";
export type TransactionType = "hold" | "release" | "refund" | "topup";

export interface Role {
  id_role: string;
  nama_role: "requester" | "worker" | "admin";
}

export interface UserProfile {
  id_user: string;
  id_role: string;
  nama_lengkap: string;
  avatar_url?: string;
  bio?: string;
  pendidikan_terakhir?: string;
  rating_avg: number;
  total_completed: number;
  total_balance: number;
  username: string;
  alamat?: string;
  no_telpon?: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface SkillMaster {
  id_skill_master: string;
  nama_skill: string;
}

export interface SkillUser {
  id_skills_user: string;
  id_user: string;
  id_skill_master: string;
  portfolio_url?: string;
  certificate_url?: string;
}

export interface Task {
  id_task: string;
  id_requester: string;
  id_worker?: string;
  title: string;
  description: string;
  compensation: number;
  latitude: number;
  longitude: number;
  status: TaskStatus;
  duration_estimate: string;
  created_at: string;
  updated_at: string;
  skills?: { id_skill: string; nama_skill: string }[];
}

export interface TaskRequirement {
  id_task_requirement: string;
  id_task: string;
  id_skill_master: string;
}

export interface TaskApplicant {
  id_task_applicant: string;
  id_task: string;
  id_worker: string;
  message: string;
  status: ApplicantStatus;
  created_at: string;
}

export interface Review {
  id_review: string;
  id_task: string;
  id_reviewer: string;
  id_reviewee: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface Transaction {
  id_transaction: string;
  id_user: string;
  amount: number;
  type: TransactionType;
  description: string;
  created_at: string;
}

export interface Notification {
  id_notification: string;
  id_user: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
