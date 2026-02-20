export type UserInfo = {
  username: string;
  permissions: string[];
  created_at: number;
};

export type SessionInfo = {
  user: string;
  token_id: string;
  remember: boolean;
  user_agent: string;
  last_active_ip: string;
  last_active_at: number;
  created_at: number;
};
