CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_sub TEXT NOT NULL UNIQUE,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  plan_expires_at TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT,
  last_seen_at TEXT,
  last_login_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub);

CREATE TABLE IF NOT EXISTS usage_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  google_sub TEXT NOT NULL,
  action TEXT NOT NULL,
  source_filename TEXT,
  status TEXT NOT NULL DEFAULT 'success',
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_google_sub_created_at ON usage_logs(google_sub, created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action_created_at ON usage_logs(action, created_at);

CREATE TABLE IF NOT EXISTS guest_usage_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guest_key TEXT NOT NULL,
  action TEXT NOT NULL,
  source_filename TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_guest_usage_logs_guest_key_created_at ON guest_usage_logs(guest_key, created_at);
CREATE INDEX IF NOT EXISTS idx_guest_usage_logs_action_created_at ON guest_usage_logs(action, created_at);

-- Payment orders
CREATE TABLE IF NOT EXISTS payment_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  google_sub TEXT NOT NULL,
  order_type TEXT NOT NULL,
  plan_code TEXT,
  credit_amount INTEGER,
  amount_usd TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  paypal_order_id TEXT,
  paypal_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  paid_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_paypal_order_id ON payment_orders(paypal_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);

-- Credit balance for credit pack purchases
CREATE TABLE IF NOT EXISTS user_credits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  google_sub TEXT NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
