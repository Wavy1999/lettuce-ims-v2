-- ============================================================
--  Lettuce IMS  –  Supabase Schema (PostgreSQL)
--  Run this in your Supabase project: SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Farms ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS farms (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  owner_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Farm owner full access"
  ON farms FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ── Inventory Items ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_items (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id        UUID        NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  product_id     TEXT        NOT NULL,
  name           TEXT        NOT NULL,
  quantity       INTEGER     NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  price          NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  date_harvested DATE,
  status         TEXT        NOT NULL DEFAULT 'in-stock'
                             CHECK (status IN ('in-stock','low-stock','out-of-stock')),
  custom_fields  JSONB       NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Computed total_value column (PostgreSQL generated column)
ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS total_value NUMERIC(10,2)
  GENERATED ALWAYS AS (quantity * price) STORED;

CREATE INDEX IF NOT EXISTS idx_inv_farm  ON inventory_items(farm_id);
CREATE INDEX IF NOT EXISTS idx_inv_status ON inventory_items(status);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Farm member access to inventory"
  ON inventory_items FOR ALL
  USING  (farm_id IN (SELECT id FROM farms WHERE owner_id = auth.uid()))
  WITH CHECK (farm_id IN (SELECT id FROM farms WHERE owner_id = auth.uid()));

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER trg_inv_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Sales ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id             UUID        NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  transaction_id      TEXT        NOT NULL UNIQUE,
  inventory_item_id   UUID        REFERENCES inventory_items(id) ON DELETE SET NULL,
  product_name        TEXT        NOT NULL,
  product_id          TEXT,
  quantity_sold       INTEGER     NOT NULL CHECK (quantity_sold > 0),
  unit_price          NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  total_amount        NUMERIC(10,2)
                      GENERATED ALWAYS AS (quantity_sold * unit_price) STORED,
  sale_date           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_farm     ON sales(farm_id);
CREATE INDEX IF NOT EXISTS idx_sales_date     ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_inv_item ON sales(inventory_item_id);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Farm member access to sales"
  ON sales FOR ALL
  USING  (farm_id IN (SELECT id FROM farms WHERE owner_id = auth.uid()))
  WITH CHECK (farm_id IN (SELECT id FROM farms WHERE owner_id = auth.uid()));

-- ── Orders ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id          UUID        NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  customer_name    TEXT        NOT NULL,
  quantity         INTEGER     NOT NULL CHECK (quantity > 0),
  price_per_unit   NUMERIC(10,2) NOT NULL CHECK (price_per_unit >= 0),
  total_price      NUMERIC(10,2)
                   GENERATED ALWAYS AS (quantity * price_per_unit) STORED,
  order_date       DATE        NOT NULL,
  status           TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending','fulfilled','cancelled')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_farm   ON orders(farm_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Farm member access to orders"
  ON orders FOR ALL
  USING  (farm_id IN (SELECT id FROM farms WHERE owner_id = auth.uid()))
  WITH CHECK (farm_id IN (SELECT id FROM farms WHERE owner_id = auth.uid()));

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── App Settings ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_settings (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id             UUID        NOT NULL REFERENCES farms(id) ON DELETE CASCADE UNIQUE,
  app_name            TEXT        NOT NULL DEFAULT 'Lettuce IMS',
  low_stock_threshold INTEGER     NOT NULL DEFAULT 15 CHECK (low_stock_threshold >= 0),
  currency            TEXT        NOT NULL DEFAULT 'PHP',
  custom_columns      JSONB       NOT NULL DEFAULT '[]',
  login_image_url     TEXT,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Farm owner settings access"
  ON app_settings FOR ALL
  USING  (farm_id IN (SELECT id FROM farms WHERE owner_id = auth.uid()))
  WITH CHECK (farm_id IN (SELECT id FROM farms WHERE owner_id = auth.uid()));

CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
