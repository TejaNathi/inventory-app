# Supabase setup (inventory-app)

This folder bootstraps a free Supabase Postgres backend for the inventory flow:

- request/cart approval
- payment done
- delivery checklist
- inward/outward logs

## 1) Create project
1. Go to https://supabase.com and create a new project.
2. Open **SQL Editor** and run `supabase/schema.sql`.

## 2) Get keys
From **Project Settings → API**, copy:
- `Project URL`
- `anon public key`

## 3) Wire frontend
In `assets/inventory-app.html`, add Supabase JS client and replace in-memory arrays with CRUD calls:
- `requests`
- `cart_requests`
- `cart_line_items`
- `payments`
- `stock_logs`

## 4) Delivery confirmation rule
For cart delivery confirmation:
1. Ensure all line items in `cart_line_items.received = true`
2. Update `cart_requests.status = 'delivered'`
3. Insert rows into `stock_logs` as `log_type='inward'`

> Note: this schema **does not** update master inventory quantities yet, per current requirement.

## 5) Next step (recommended)
Tighten RLS by role (`member`, `lead`, `accounts`) once auth is connected.
