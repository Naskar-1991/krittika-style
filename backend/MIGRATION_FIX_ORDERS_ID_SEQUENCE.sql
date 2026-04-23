-- Fix: Restore auto-increment sequence for orders.id
-- Run this if you get: "null value in column id of relation orders violates not-null constraint"
DO $$
DECLARE
  seq_name text;
BEGIN
  SELECT pg_get_serial_sequence('orders', 'id') INTO seq_name;

  IF seq_name IS NULL THEN
    CREATE SEQUENCE IF NOT EXISTS orders_id_seq;
    ALTER TABLE orders ALTER COLUMN id SET DEFAULT nextval('orders_id_seq');
    PERFORM setval('orders_id_seq', COALESCE((SELECT MAX(id) FROM orders), 0) + 1, false);
    ALTER SEQUENCE orders_id_seq OWNED BY orders.id;
    RAISE NOTICE 'orders_id_seq created and attached to orders.id';
  ELSE
    RAISE NOTICE 'Sequence already exists: %', seq_name;
  END IF;
END $$;
