-- =========================================================
-- ZetaWeb · Panel /admin — esquema (versión sencilla)
--
-- Tres cosas: clientes, cobros (una vez o mensuales) y los pagos
-- recibidos de cada cobro. Importes en céntimos enteros.
-- Solo Rubén e Inés (tabla profiles) pueden leer o escribir.
--
-- Se puede ejecutar en un proyecto nuevo o encima de la versión anterior:
-- primero elimina las tablas de aquella versión (sin datos reales) y
-- conserva profiles, donde están vinculadas vuestras cuentas.
-- =========================================================

-- ---------- Limpieza de la versión anterior ----------
drop view if exists public.payment_obligations_v, public.income_allocations, public.expense_allocations cascade;
drop table if exists public.payments, public.payment_obligations, public.recurring_services, public.expenses,
    public.projects, public.settings, public.audit_log cascade;
drop table if exists public.charge_payments, public.charges, public.clients cascade;
do $$
declare
    f record;
begin
    for f in
        select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname in (
            'round_ratio', 'resolve_alloc', 'tg_resolve_alloc', 'tg_stamp', 'tg_audit', 'tg_check_project_client',
            'tg_check_obligation', 'tg_check_payment', 'recompute_payment_allocations', 'tg_payments_changed',
            'tg_obligation_alloc_changed', 'tg_check_expense', 'add_period', 'register_payment',
            'generate_recurring_obligations', 'register_recurring_expense', 'due_date_for', 'tg_charge_payment',
            'new_charge')
    loop
        execute format('drop function %s cascade', f.sig);
    end loop;
end;
$$;
drop type if exists public.alloc_mode, public.payer_key, public.client_type, public.client_status, public.service_type,
    public.project_status, public.payment_method, public.recurring_status, public.expense_category, public.expense_status cascade;

-- ---------- Usuarios autorizados ----------
do $$
begin
    create type public.partner_key as enum ('ruben', 'ines');
exception when duplicate_object then null;
end;
$$;

create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    partner public.partner_key not null unique,
    display_name text not null,
    created_at timestamptz not null default now()
);

create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (select 1 from public.profiles p where p.id = auth.uid());
$$;

-- ---------- Clientes ----------
create table public.clients (
    id uuid primary key default gen_random_uuid(),
    name text not null check (length(trim(name)) > 0),
    phone text,
    email text,
    notes text,
    archived boolean not null default false,
    created_at timestamptz not null default now(),
    created_by uuid default auth.uid() references auth.users (id) on delete set null
);

-- ---------- Cobros ----------
-- kind = 'unico'   → se cobra una vez, en due_date.
-- kind = 'mensual' → se cobra cada mes el día day_of_month (si el mes es
--                    más corto, el último día), desde start_month.
create table public.charges (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.clients (id) on delete restrict,
    concept text not null check (length(trim(concept)) > 0),
    amount_cents bigint not null check (amount_cents > 0),
    kind text not null check (kind in ('unico', 'mensual')),
    due_date date,
    day_of_month integer check (day_of_month between 1 and 31),
    start_month date check (start_month = date_trunc('month', start_month)::date),
    end_month date check (end_month = date_trunc('month', end_month)::date),
    active boolean not null default true,
    for_whom text not null default 'ambos' check (for_whom in ('ambos', 'ruben', 'ines')),
    created_at timestamptz not null default now(),
    created_by uuid default auth.uid() references auth.users (id) on delete set null,
    check (kind <> 'unico' or due_date is not null),
    check (kind <> 'mensual' or (day_of_month is not null and start_month is not null)),
    check (end_month is null or end_month >= start_month)
);
create index charges_client_idx on public.charges (client_id);

-- ---------- Pagos recibidos ----------
-- Un pago por cobro y periodo (period = fecha en que tocaba cobrar).
-- El reparto entre Rubén e Inés se guarda en el momento del pago.
create table public.charge_payments (
    id uuid primary key default gen_random_uuid(),
    charge_id uuid not null references public.charges (id) on delete restrict,
    period date not null,
    paid_on date not null default current_date,
    amount_cents bigint not null check (amount_cents > 0),
    ruben_cents bigint not null default 0,
    ines_cents bigint not null default 0,
    created_at timestamptz not null default now(),
    created_by uuid default auth.uid() references auth.users (id) on delete set null,
    unique (charge_id, period),
    check (ruben_cents >= 0 and ines_cents >= 0 and ruben_cents + ines_cents = amount_cents)
);
create index charge_payments_paid_on_idx on public.charge_payments (paid_on);

-- Fecha de cobro de un cobro mensual en el mes de `d`.
create or replace function public.due_date_for(day_of_month integer, d date)
returns date
language sql
immutable
set search_path = ''
as $$
    select (date_trunc('month', d)::date
        + (least(day_of_month, extract(day from (date_trunc('month', d) + interval '1 month - 1 day'))::integer) - 1));
$$;

-- Valida el periodo y fija el reparto. «Ambos»: mitad para cada uno; si
-- sobra un céntimo, se redondea con la regla mitad al par para Rubén.
create or replace function public.tg_charge_payment()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    c record;
    half bigint;
begin
    select * into c from public.charges where id = new.charge_id;
    if c.kind = 'unico' and new.period <> c.due_date then
        raise exception 'Periodo no válido para este cobro';
    end if;
    if c.kind = 'mensual' and (new.period <> public.due_date_for(c.day_of_month, new.period)
            or new.period < c.start_month
            or (c.end_month is not null and new.period >= (c.end_month + interval '1 month')::date)) then
        raise exception 'Periodo no válido para este cobro mensual';
    end if;
    if c.for_whom = 'ruben' then
        new.ruben_cents := new.amount_cents; new.ines_cents := 0;
    elsif c.for_whom = 'ines' then
        new.ruben_cents := 0; new.ines_cents := new.amount_cents;
    else
        half := new.amount_cents / 2;
        if mod(new.amount_cents, 2) = 1 and mod(half, 2) = 1 then half := half + 1; end if;
        new.ruben_cents := half; new.ines_cents := new.amount_cents - half;
    end if;
    return new;
end;
$$;

create trigger charge_payments_split before insert or update on public.charge_payments
    for each row execute function public.tg_charge_payment();

-- Alta rápida en una sola transacción: cliente nuevo (opcional), cobro y,
-- si ya está pagado, su pago.
create or replace function public.new_charge(
    p_id uuid, p_client_id uuid, p_new_client text, p_concept text, p_amount_cents bigint,
    p_kind text, p_due_date date, p_day_of_month integer, p_start_month date,
    p_for_whom text, p_paid boolean)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
    cid uuid := p_client_id;
begin
    if cid is null then
        if p_new_client is null or length(trim(p_new_client)) = 0 then
            raise exception 'Elige un cliente o escribe el nombre de uno nuevo';
        end if;
        insert into public.clients (name) values (trim(p_new_client)) returning id into cid;
    end if;
    insert into public.charges (id, client_id, concept, amount_cents, kind, due_date, day_of_month, start_month, for_whom)
    values (p_id, cid, p_concept, p_amount_cents, p_kind,
        case when p_kind = 'unico' then p_due_date end,
        case when p_kind = 'mensual' then p_day_of_month end,
        case when p_kind = 'mensual' then date_trunc('month', p_start_month)::date end,
        p_for_whom);
    if p_paid and p_kind = 'unico' then
        insert into public.charge_payments (charge_id, period, paid_on, amount_cents)
        values (p_id, p_due_date, least(current_date, p_due_date), p_amount_cents);
    end if;
    return p_id;
end;
$$;

-- ---------- Permisos y seguridad a nivel de fila ----------
revoke all on all tables in schema public from anon, public;
revoke all on all functions in schema public from anon, public;
revoke all on all sequences in schema public from anon, public;
alter default privileges in schema public revoke all on tables from anon, public;
alter default privileges in schema public revoke all on functions from anon, public;
alter default privileges in schema public revoke all on sequences from anon, public;

revoke all on all tables in schema public from authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.clients, public.charges, public.charge_payments to authenticated;
grant execute on function public.is_member() to authenticated;
grant execute on function public.due_date_for(integer, date) to authenticated;
grant execute on function public.new_charge(uuid, uuid, text, text, bigint, text, date, integer, date, text, boolean) to authenticated;

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.charges enable row level security;
alter table public.charge_payments enable row level security;

drop policy if exists members_read on public.profiles;
create policy members_read on public.profiles for select to authenticated using (public.is_member());

do $$
declare
    t text;
begin
    foreach t in array array['clients', 'charges', 'charge_payments'] loop
        execute format('create policy members_all on public.%I for all to authenticated using (public.is_member()) with check (public.is_member())', t);
    end loop;
end;
$$;
