-- Supabase の SQL Editor に貼り付けて実行してください

create table bookings (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_line_id text not null,
  booking_date date not null,
  booking_time text not null,           -- 例: '09:00'
  status text not null default 'pending', -- pending / confirmed / cancelled
  created_at timestamptz default now()
);

-- 同じ日時に重複予約が入らないようにするインデックス
create unique index on bookings(booking_date, booking_time)
  where status in ('pending', 'confirmed');

-- 日付での検索を高速化
create index on bookings(booking_date);
