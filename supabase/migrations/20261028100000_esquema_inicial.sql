-- =========================================================
-- ZetaWeb · Panel de gestión — esquema inicial
--
-- Convenciones:
--   * Importes en céntimos enteros (bigint). Nunca float.
--   * Cada operación económica guarda su propio reparto entre Rubén e Inés
--     (columnas ruben_cents / ines_cents) como instantánea histórica. La
--     base de datos garantiza que ruben_cents + ines_cents = importe.
--   * Redondeo: la parte de Rubén se redondea al céntimo con la regla
--     "mitad al par" (bancario) e Inés recibe el resto, de modo que la suma
--     siempre cuadra exactamente.
--   * Solo los usuarios dados de alta en public.profiles (Rubén e Inés)
--     pueden leer o escribir. El rol anónimo no tiene acceso a nada.
-- =========================================================

-- ---------- Tipos ----------
create type public.partner_key as enum ('ruben', 'ines');
create type public.alloc_mode as enum ('ruben', 'ines', 'pct', 'fixed');
create type public.payer_key as enum ('ruben', 'ines', 'empresa');
create type public.client_type as enum ('particular', 'autonomo', 'empresa');
create type public.client_status as enum ('potencial', 'activo', 'inactivo', 'antiguo');
create type public.service_type as enum ('web', 'webapp', 'pwa', 'movil', 'tienda', 'mantenimiento', 'consultoria', 'otro');
create type public.project_status as enum ('pendiente', 'en_curso', 'entregado', 'cancelado', 'archivado');
create type public.payment_method as enum ('transferencia', 'efectivo', 'tarjeta', 'bizum', 'otro');
create type public.recurring_status as enum ('activo', 'pausado', 'cancelado');
create type public.expense_category as enum ('dominio', 'hosting', 'software', 'ia', 'publicidad', 'comisiones', 'material', 'servicios_profesionales', 'impuestos', 'otros');
create type public.expense_status as enum ('pendiente', 'pagado');

-- ---------- Usuarios autorizados ----------
-- Una fila por socio. Las cuentas se crean a mano en Supabase Auth y luego
-- se vinculan aquí (ver supabase/README.md). Sin fila aquí no hay acceso.
create table public.profiles (
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

-- ---------- Utilidades de cálculo ----------
-- a * num / den redondeado al entero más cercano, mitades al par.
create or replace function public.round_ratio(a bigint, num bigint, den bigint)
returns bigint
language plpgsql
immutable
set search_path = ''
as $$
declare
    p numeric := a::numeric * num;
    q numeric;
    r numeric;
begin
    if den <= 0 or a < 0 or num < 0 then
        raise exception 'round_ratio: argumentos no válidos';
    end if;
    q := floor(p / den);
    r := p - q * den;
    if r * 2 > den or (r * 2 = den and mod(q, 2) = 1) then
        q := q + 1;
    end if;
    return q::bigint;
end;
$$;

-- Resuelve el reparto de un importe según el modo elegido.
create or replace function public.resolve_alloc(
    amount bigint, mode public.alloc_mode, ruben_bp integer, ruben_in bigint, ines_in bigint,
    out ruben bigint, out ines bigint, out bp integer)
language plpgsql
immutable
set search_path = ''
as $$
begin
    case mode
        when 'ruben' then ruben := amount; ines := 0; bp := 10000;
        when 'ines' then ruben := 0; ines := amount; bp := 0;
        when 'pct' then
            if ruben_bp is null or ruben_bp < 0 or ruben_bp > 10000 then
                raise exception 'El porcentaje de reparto debe estar entre 0 y 100';
            end if;
            bp := ruben_bp;
            ruben := public.round_ratio(amount, ruben_bp, 10000);
            ines := amount - ruben;
        when 'fixed' then
            if ruben_in is null or ines_in is null or ruben_in < 0 or ines_in < 0 then
                raise exception 'El reparto por importes necesita dos importes no negativos';
            end if;
            if ruben_in + ines_in <> amount then
                raise exception 'El reparto no cuadra: % + % céntimos no suman el total de %', ruben_in, ines_in, amount;
            end if;
            ruben := ruben_in; ines := ines_in; bp := null;
    end case;
end;
$$;

-- Trigger genérico: rellena ruben_cents / ines_cents a partir del modo.
-- TG_ARGV[0] es el nombre de la columna con el importe total.
create or replace function public.tg_resolve_alloc()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    amount bigint := (to_jsonb(new) ->> tg_argv[0])::bigint;
    res record;
begin
    select * into res from public.resolve_alloc(amount, new.alloc_mode, new.alloc_ruben_bp, new.ruben_cents, new.ines_cents);
    new.ruben_cents := res.ruben;
    new.ines_cents := res.ines;
    new.alloc_ruben_bp := res.bp;
    return new;
end;
$$;

-- Marca de tiempo y autoría.
create or replace function public.tg_stamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if tg_op = 'INSERT' then
        new.created_at := now();
        new.created_by := auth.uid();
    else
        new.created_at := old.created_at;
        new.created_by := old.created_by;
    end if;
    new.updated_at := now();
    new.updated_by := auth.uid();
    return new;
end;
$$;

-- ---------- Auditoría ----------
create table public.audit_log (
    id bigint generated always as identity primary key,
    table_name text not null,
    row_id uuid,
    action text not null,
    old_data jsonb,
    new_data jsonb,
    changed_by uuid default auth.uid(),
    changed_at timestamptz not null default now()
);
create index audit_log_row_idx on public.audit_log (table_name, row_id);

create or replace function public.tg_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.audit_log (table_name, row_id, action, old_data, new_data, changed_by)
    values (
        tg_table_name,
        coalesce(new.id, old.id),
        lower(tg_op),
        case when tg_op <> 'INSERT' then to_jsonb(old) end,
        case when tg_op <> 'DELETE' then to_jsonb(new) end,
        auth.uid()
    );
    return null;
end;
$$;

-- ---------- Configuración ----------
create table public.settings (
    id integer primary key default 1 check (id = 1),
    default_alloc_mode public.alloc_mode not null default 'pct',
    default_alloc_ruben_bp integer not null default 5000 check (default_alloc_ruben_bp between 0 and 10000),
    updated_at timestamptz not null default now(),
    updated_by uuid default auth.uid()
);
insert into public.settings (id) values (1);

-- ---------- Clientes ----------
create table public.clients (
    id uuid primary key default gen_random_uuid(),
    name text not null check (length(trim(name)) > 0),
    contact_name text,
    email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    phone text,
    client_type public.client_type not null default 'empresa',
    status public.client_status not null default 'activo',
    signup_date date not null default current_date,
    services public.service_type[] not null default '{}',
    notes text,
    responsible public.partner_key,
    archived_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_by uuid references auth.users (id) on delete set null,
    updated_by uuid references auth.users (id) on delete set null
);

-- ---------- Proyectos ----------
create table public.projects (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.clients (id) on delete restrict,
    name text not null check (length(trim(name)) > 0),
    description text,
    service_type public.service_type not null default 'web',
    start_date date,
    due_date date,
    status public.project_status not null default 'pendiente',
    accepted boolean not null default true,
    price_cents bigint not null default 0 check (price_cents >= 0),
    alloc_mode public.alloc_mode not null default 'pct',
    alloc_ruben_bp integer,
    ruben_cents bigint not null default 0,
    ines_cents bigint not null default 0,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_by uuid references auth.users (id) on delete set null,
    updated_by uuid references auth.users (id) on delete set null,
    check (due_date is null or start_date is null or due_date >= start_date),
    check (ruben_cents >= 0 and ines_cents >= 0 and ruben_cents + ines_cents = price_cents)
);
create index projects_client_idx on public.projects (client_id);

-- ---------- Cuotas recurrentes ----------
create table public.recurring_services (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.clients (id) on delete restrict,
    project_id uuid references public.projects (id) on delete restrict,
    name text not null check (length(trim(name)) > 0),
    description text,
    amount_cents bigint not null check (amount_cents > 0),
    period_months integer not null check (period_months in (1, 3, 6, 12)),
    start_date date not null,
    next_due_date date not null,
    end_date date,
    status public.recurring_status not null default 'activo',
    alloc_mode public.alloc_mode not null default 'pct',
    alloc_ruben_bp integer,
    ruben_cents bigint not null default 0,
    ines_cents bigint not null default 0,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_by uuid references auth.users (id) on delete set null,
    updated_by uuid references auth.users (id) on delete set null,
    check (end_date is null or end_date >= start_date),
    check (next_due_date >= start_date),
    check (ruben_cents >= 0 and ines_cents >= 0 and ruben_cents + ines_cents = amount_cents)
);
create index recurring_client_idx on public.recurring_services (client_id);

-- ---------- Obligaciones de pago (lo que nos deben) ----------
create table public.payment_obligations (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.clients (id) on delete restrict,
    project_id uuid references public.projects (id) on delete restrict,
    recurring_service_id uuid references public.recurring_services (id) on delete restrict,
    period_start date,
    concept text not null check (length(trim(concept)) > 0),
    reference text,
    issue_date date not null default current_date,
    due_date date,
    amount_cents bigint not null check (amount_cents > 0),
    alloc_mode public.alloc_mode not null default 'pct',
    alloc_ruben_bp integer,
    ruben_cents bigint not null default 0,
    ines_cents bigint not null default 0,
    notes text,
    voided_at timestamptz,
    void_reason text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_by uuid references auth.users (id) on delete set null,
    updated_by uuid references auth.users (id) on delete set null,
    check (due_date is null or due_date >= issue_date),
    check ((recurring_service_id is null) = (period_start is null)),
    check (ruben_cents >= 0 and ines_cents >= 0 and ruben_cents + ines_cents = amount_cents)
);
create index obligations_client_idx on public.payment_obligations (client_id);
create index obligations_project_idx on public.payment_obligations (project_id);
-- Una cuota no puede generar dos obligaciones para el mismo periodo.
create unique index obligations_recurring_period_uq
    on public.payment_obligations (recurring_service_id, period_start)
    where recurring_service_id is not null;
-- Un número de factura no puede repetirse.
create unique index obligations_reference_uq
    on public.payment_obligations (lower(reference))
    where reference is not null and length(trim(reference)) > 0;

-- ---------- Cobros (dinero recibido) ----------
create table public.payments (
    id uuid primary key default gen_random_uuid(),
    obligation_id uuid not null references public.payment_obligations (id) on delete restrict,
    client_id uuid not null references public.clients (id) on delete restrict,
    paid_on date not null,
    amount_cents bigint not null check (amount_cents > 0),
    method public.payment_method not null default 'transferencia',
    reference text,
    notes text,
    ruben_cents bigint not null default 0,
    ines_cents bigint not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_by uuid references auth.users (id) on delete set null,
    updated_by uuid references auth.users (id) on delete set null,
    check (ruben_cents >= 0 and ines_cents >= 0 and ruben_cents + ines_cents = amount_cents)
);
create index payments_obligation_idx on public.payments (obligation_id);
create index payments_client_idx on public.payments (client_id);
create index payments_paid_on_idx on public.payments (paid_on);

-- ---------- Gastos ----------
create table public.expenses (
    id uuid primary key default gen_random_uuid(),
    concept text not null check (length(trim(concept)) > 0),
    category public.expense_category not null default 'otros',
    amount_cents bigint not null check (amount_cents > 0),
    expense_date date not null,
    status public.expense_status not null default 'pagado',
    paid_on date,
    paid_by public.payer_key,
    recurrence_months integer check (recurrence_months in (1, 3, 6, 12)),
    recurrence_end date,
    recurrence_active boolean not null default true,
    recurring_parent_id uuid references public.expenses (id) on delete restrict,
    supplier text,
    project_id uuid references public.projects (id) on delete restrict,
    client_id uuid references public.clients (id) on delete restrict,
    alloc_mode public.alloc_mode not null default 'pct',
    alloc_ruben_bp integer,
    ruben_cents bigint not null default 0,
    ines_cents bigint not null default 0,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_by uuid references auth.users (id) on delete set null,
    updated_by uuid references auth.users (id) on delete set null,
    check (status = 'pendiente' or (paid_on is not null and paid_by is not null)),
    check (recurrence_end is null or (recurrence_months is not null and recurrence_end >= expense_date)),
    check (recurring_parent_id is null or recurrence_months is null),
    check (ruben_cents >= 0 and ines_cents >= 0 and ruben_cents + ines_cents = amount_cents)
);
create index expenses_date_idx on public.expenses (expense_date);
create index expenses_parent_idx on public.expenses (recurring_parent_id);
-- El mismo periodo de un gasto recurrente no puede registrarse dos veces.
create unique index expenses_recurring_period_uq
    on public.expenses (recurring_parent_id, expense_date)
    where recurring_parent_id is not null;

-- ---------- Coherencia entre entidades ----------
create or replace function public.tg_check_project_client()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if new.project_id is not null and not exists (
        select 1 from public.projects p where p.id = new.project_id and p.client_id = new.client_id
    ) then
        raise exception 'El proyecto no pertenece a ese cliente';
    end if;
    return new;
end;
$$;

create or replace function public.tg_check_obligation()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    paid bigint;
begin
    if new.recurring_service_id is not null and not exists (
        select 1 from public.recurring_services r where r.id = new.recurring_service_id and r.client_id = new.client_id
    ) then
        raise exception 'La cuota recurrente no pertenece a ese cliente';
    end if;
    if tg_op = 'UPDATE' then
        select coalesce(sum(amount_cents), 0) into paid from public.payments where obligation_id = new.id;
        if new.amount_cents < paid then
            raise exception 'El importe no puede ser inferior a lo ya cobrado (% céntimos)', paid;
        end if;
        if new.client_id <> old.client_id and paid > 0 then
            raise exception 'No se puede cambiar el cliente de una obligación con cobros';
        end if;
        if new.voided_at is not null and old.voided_at is null and paid > 0 then
            raise exception 'No se puede anular una obligación que tiene cobros registrados';
        end if;
    end if;
    return new;
end;
$$;

-- Antes de guardar un cobro: hereda el cliente, bloquea la obligación y
-- comprueba que no se supera el saldo pendiente.
create or replace function public.tg_check_payment()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    ob record;
    others bigint;
begin
    select * into ob from public.payment_obligations where id = new.obligation_id for update;
    if not found then
        raise exception 'La obligación de pago no existe';
    end if;
    if ob.voided_at is not null then
        raise exception 'No se pueden registrar cobros en una obligación anulada';
    end if;
    new.client_id := ob.client_id;
    select coalesce(sum(amount_cents), 0) into others
        from public.payments where obligation_id = new.obligation_id and id <> new.id;
    if others + new.amount_cents > ob.amount_cents then
        raise exception 'El cobro supera el saldo pendiente (pendiente: % céntimos)', ob.amount_cents - others
            using errcode = 'P0001', hint = 'EXCESO';
    end if;
    -- Reparto provisional (como si fuera el último cobro); el trigger
    -- posterior lo recalcula respetando el orden por fecha.
    new.ruben_cents := public.round_ratio(others + new.amount_cents, ob.ruben_cents, ob.amount_cents)
        - public.round_ratio(others, ob.ruben_cents, ob.amount_cents);
    new.ines_cents := new.amount_cents - new.ruben_cents;
    return new;
end;
$$;

-- Reparte cada cobro según la obligación de forma acumulada: el reparto
-- acumulado tras cada cobro es round(cobrado * parte_ruben / total), así que
-- cuando la obligación queda saldada los cobros suman exactamente el reparto
-- acordado, sin céntimos perdidos.
create or replace function public.recompute_payment_allocations(p_obligation uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
    ob record;
    pay record;
    cum bigint := 0;
    prev_ruben bigint := 0;
    cur_ruben bigint;
begin
    select * into ob from public.payment_obligations where id = p_obligation;
    if not found then
        return;
    end if;
    for pay in
        select id, amount_cents from public.payments
        where obligation_id = p_obligation
        order by paid_on, created_at, id
    loop
        cum := cum + pay.amount_cents;
        cur_ruben := public.round_ratio(cum, ob.ruben_cents, ob.amount_cents);
        update public.payments
            set ruben_cents = cur_ruben - prev_ruben,
                ines_cents = pay.amount_cents - (cur_ruben - prev_ruben)
            where id = pay.id
              and (ruben_cents, ines_cents) is distinct from (cur_ruben - prev_ruben, pay.amount_cents - (cur_ruben - prev_ruben));
        prev_ruben := cur_ruben;
    end loop;
end;
$$;

create or replace function public.tg_payments_changed()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if tg_op in ('UPDATE', 'DELETE') then
        perform public.recompute_payment_allocations(old.obligation_id);
    end if;
    if tg_op in ('INSERT', 'UPDATE') and (tg_op = 'INSERT' or new.obligation_id <> old.obligation_id
            or new.amount_cents <> old.amount_cents or new.paid_on <> old.paid_on) then
        perform public.recompute_payment_allocations(new.obligation_id);
    end if;
    return null;
end;
$$;

create or replace function public.tg_obligation_alloc_changed()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    perform public.recompute_payment_allocations(new.id);
    return null;
end;
$$;

create or replace function public.tg_check_expense()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if new.project_id is not null and new.client_id is not null and not exists (
        select 1 from public.projects p where p.id = new.project_id and p.client_id = new.client_id
    ) then
        raise exception 'El proyecto no pertenece a ese cliente';
    end if;
    if new.status = 'pendiente' then
        new.paid_on := null;
    end if;
    return new;
end;
$$;

-- ---------- Triggers ----------
create trigger clients_stamp before insert or update on public.clients for each row execute function public.tg_stamp();
create trigger projects_stamp before insert or update on public.projects for each row execute function public.tg_stamp();
create trigger recurring_stamp before insert or update on public.recurring_services for each row execute function public.tg_stamp();
create trigger obligations_stamp before insert or update on public.payment_obligations for each row execute function public.tg_stamp();
create trigger payments_stamp before insert or update on public.payments for each row execute function public.tg_stamp();
create trigger expenses_stamp before insert or update on public.expenses for each row execute function public.tg_stamp();

create trigger projects_alloc before insert or update on public.projects for each row execute function public.tg_resolve_alloc('price_cents');
create trigger recurring_alloc before insert or update on public.recurring_services for each row execute function public.tg_resolve_alloc('amount_cents');
create trigger obligations_alloc before insert or update on public.payment_obligations for each row execute function public.tg_resolve_alloc('amount_cents');
create trigger expenses_alloc before insert or update on public.expenses for each row execute function public.tg_resolve_alloc('amount_cents');

create trigger recurring_client_check before insert or update on public.recurring_services for each row execute function public.tg_check_project_client();
create trigger obligations_client_check before insert or update on public.payment_obligations for each row execute function public.tg_check_project_client();
create trigger obligations_check before insert or update on public.payment_obligations for each row execute function public.tg_check_obligation();
create trigger payments_check before insert or update on public.payments for each row execute function public.tg_check_payment();
create trigger expenses_check before insert or update on public.expenses for each row execute function public.tg_check_expense();

create trigger payments_changed after insert or delete or update of obligation_id, amount_cents, paid_on
    on public.payments for each row execute function public.tg_payments_changed();
create trigger obligations_alloc_changed after update of amount_cents, ruben_cents, ines_cents
    on public.payment_obligations for each row execute function public.tg_obligation_alloc_changed();

create trigger clients_audit after insert or update or delete on public.clients for each row execute function public.tg_audit();
create trigger projects_audit after insert or update or delete on public.projects for each row execute function public.tg_audit();
create trigger recurring_audit after insert or update or delete on public.recurring_services for each row execute function public.tg_audit();
create trigger obligations_audit after insert or update or delete on public.payment_obligations for each row execute function public.tg_audit();
create trigger payments_audit after insert or update or delete on public.payments for each row execute function public.tg_audit();
create trigger expenses_audit after insert or update or delete on public.expenses for each row execute function public.tg_audit();

-- ---------- Funciones de negocio (transaccionales) ----------

-- Fecha del siguiente periodo: suma `months` meses manteniendo el día de
-- referencia (si el mes es más corto se usa su último día).
create or replace function public.add_period(d date, months integer, anchor_day integer)
returns date
language sql
immutable
set search_path = ''
as $$
    select (date_trunc('month', d) + make_interval(months => months))::date
        + (least(anchor_day,
                 extract(day from (date_trunc('month', d) + make_interval(months => months + 1) - interval '1 day'))::integer) - 1);
$$;

-- Registra un cobro. Si supera el saldo pendiente:
--   p_excess = 'rechazar'   → error (por defecto)
--   p_excess = 'a_cuenta'   → se cobra el pendiente y el exceso se registra
--                             como una obligación nueva «pago a cuenta»
--                             ya cobrada, con el mismo reparto.
create or replace function public.register_payment(
    p_id uuid, p_obligation uuid, p_paid_on date, p_amount_cents bigint,
    p_method public.payment_method, p_reference text, p_notes text,
    p_excess text default 'rechazar')
returns uuid
language plpgsql
set search_path = ''
as $$
declare
    ob record;
    paid bigint;
    pending bigint;
    extra_ob uuid;
begin
    if p_amount_cents is null or p_amount_cents <= 0 then
        raise exception 'El importe del cobro debe ser mayor que cero';
    end if;
    select * into ob from public.payment_obligations where id = p_obligation for update;
    if not found then
        raise exception 'La obligación de pago no existe';
    end if;
    select coalesce(sum(amount_cents), 0) into paid from public.payments where obligation_id = p_obligation;
    pending := ob.amount_cents - paid;

    if p_amount_cents <= pending or p_excess = 'rechazar' then
        insert into public.payments (id, obligation_id, client_id, paid_on, amount_cents, method, reference, notes)
        values (p_id, p_obligation, ob.client_id, p_paid_on, p_amount_cents, p_method, p_reference, p_notes);
        return p_id;
    end if;

    if p_excess <> 'a_cuenta' then
        raise exception 'Gestión del exceso no válida: %', p_excess;
    end if;

    if pending > 0 then
        insert into public.payments (id, obligation_id, client_id, paid_on, amount_cents, method, reference, notes)
        values (p_id, p_obligation, ob.client_id, p_paid_on, pending, p_method, p_reference, p_notes);
    end if;

    insert into public.payment_obligations (client_id, project_id, concept, issue_date, amount_cents,
        alloc_mode, alloc_ruben_bp, ruben_cents, ines_cents, notes)
    values (ob.client_id, ob.project_id, 'Pago a cuenta (exceso sobre «' || ob.concept || '»)', p_paid_on,
        p_amount_cents - pending, 'pct',
        case when ob.amount_cents > 0 then public.round_ratio(10000, ob.ruben_cents, ob.amount_cents)::integer else 5000 end,
        0, 0, 'Generada automáticamente al registrar un cobro superior al pendiente.')
    returning id into extra_ob;

    insert into public.payments (id, obligation_id, client_id, paid_on, amount_cents, method, reference, notes)
    values (case when pending > 0 then gen_random_uuid() else p_id end, extra_ob, ob.client_id, p_paid_on,
        p_amount_cents - pending, p_method, p_reference, p_notes);
    return p_id;
end;
$$;

-- Genera las obligaciones de las cuotas recurrentes activas cuyo periodo
-- empieza en o antes de p_until. Es idempotente: cada periodo solo se crea
-- una vez (índice único) y la próxima fecha avanza en la misma transacción.
create or replace function public.generate_recurring_obligations(p_until date, p_service uuid default null)
returns integer
language plpgsql
set search_path = ''
as $$
declare
    svc record;
    d date;
    created integer := 0;
    n integer;
begin
    for svc in
        select * from public.recurring_services
        where status = 'activo' and (p_service is null or id = p_service)
        for update
    loop
        d := svc.next_due_date;
        while d <= p_until and (svc.end_date is null or d <= svc.end_date) loop
            insert into public.payment_obligations (client_id, project_id, recurring_service_id, period_start,
                concept, issue_date, due_date, amount_cents, alloc_mode, alloc_ruben_bp, ruben_cents, ines_cents)
            values (svc.client_id, svc.project_id, svc.id, d,
                svc.name || ' · ' || to_char(d, 'MM/YYYY'), d, d, svc.amount_cents,
                svc.alloc_mode, svc.alloc_ruben_bp, svc.ruben_cents, svc.ines_cents)
            on conflict (recurring_service_id, period_start) where recurring_service_id is not null do nothing;
            get diagnostics n = row_count;
            created := created + n;
            d := public.add_period(d, svc.period_months, extract(day from svc.start_date)::integer);
        end loop;
        if d <> svc.next_due_date then
            update public.recurring_services set next_due_date = d where id = svc.id;
        end if;
    end loop;
    return created;
end;
$$;

-- Registra la siguiente ocurrencia de un gasto recurrente (copia la plantilla).
create or replace function public.register_recurring_expense(
    p_template uuid, p_date date, p_status public.expense_status, p_paid_on date, p_paid_by public.payer_key)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
    t record;
    new_id uuid;
begin
    select * into t from public.expenses where id = p_template and recurrence_months is not null;
    if not found then
        raise exception 'El gasto no es una plantilla recurrente';
    end if;
    if p_date = t.expense_date then
        raise exception 'Ese periodo ya está registrado';
    end if;
    insert into public.expenses (concept, category, amount_cents, expense_date, status, paid_on, paid_by,
        recurring_parent_id, supplier, project_id, client_id, alloc_mode, alloc_ruben_bp, ruben_cents, ines_cents, notes)
    values (t.concept, t.category, t.amount_cents, p_date, p_status, p_paid_on, p_paid_by,
        t.id, t.supplier, t.project_id, t.client_id, t.alloc_mode, t.alloc_ruben_bp, t.ruben_cents, t.ines_cents, null)
    returning id into new_id;
    return new_id;
end;
$$;

-- ---------- Vistas ----------
create view public.payment_obligations_v with (security_invoker = on) as
select o.*,
    coalesce(p.paid, 0) as paid_cents,
    o.amount_cents - coalesce(p.paid, 0) as pending_cents,
    coalesce(p.paid_ruben, 0) as paid_ruben_cents,
    coalesce(p.paid_ines, 0) as paid_ines_cents,
    case
        when o.voided_at is not null then 'anulada'
        when coalesce(p.paid, 0) >= o.amount_cents then 'pagado'
        when o.due_date is not null and o.due_date < current_date then 'vencido'
        when coalesce(p.paid, 0) > 0 then 'parcial'
        else 'pendiente'
    end as status
from public.payment_obligations o
left join (
    select obligation_id, sum(amount_cents) as paid, sum(ruben_cents) as paid_ruben, sum(ines_cents) as paid_ines
    from public.payments group by obligation_id
) p on p.obligation_id = o.id;

-- Reparto de ingresos en formato largo (una fila por socio y operación).
create view public.income_allocations with (security_invoker = on) as
select 'cobro'::text as kind, p.id as operation_id, p.client_id, o.project_id, p.paid_on as op_date,
       'ruben'::public.partner_key as partner, p.ruben_cents as amount_cents
from public.payments p join public.payment_obligations o on o.id = p.obligation_id
union all
select 'cobro', p.id, p.client_id, o.project_id, p.paid_on, 'ines', p.ines_cents
from public.payments p join public.payment_obligations o on o.id = p.obligation_id
union all
select 'obligacion', o.id, o.client_id, o.project_id, o.issue_date, 'ruben', o.ruben_cents
from public.payment_obligations o where o.voided_at is null
union all
select 'obligacion', o.id, o.client_id, o.project_id, o.issue_date, 'ines', o.ines_cents
from public.payment_obligations o where o.voided_at is null;

-- Reparto de gastos: quién lo asume y quién lo adelantó.
create view public.expense_allocations with (security_invoker = on) as
select e.id as expense_id, e.expense_date, e.status, e.paid_by, 'ruben'::public.partner_key as partner, e.ruben_cents as amount_cents
from public.expenses e
union all
select e.id, e.expense_date, e.status, e.paid_by, 'ines', e.ines_cents
from public.expenses e;

-- ---------- Permisos y seguridad a nivel de fila ----------
revoke all on all tables in schema public from anon, public;
revoke all on all sequences in schema public from anon, public;
revoke all on all functions in schema public from anon, public;
alter default privileges in schema public revoke all on tables from anon, public;
alter default privileges in schema public revoke all on functions from anon, public;
alter default privileges in schema public revoke all on sequences from anon, public;

revoke all on all tables in schema public from authenticated;
grant select on public.profiles, public.audit_log to authenticated;
grant select, update on public.settings to authenticated;
grant select, insert, update on public.clients, public.projects, public.recurring_services to authenticated;
grant select, insert, update, delete on public.payment_obligations, public.payments, public.expenses to authenticated;
grant select on public.payment_obligations_v, public.income_allocations, public.expense_allocations to authenticated;

grant execute on function public.is_member() to authenticated;
grant execute on function public.round_ratio(bigint, bigint, bigint) to authenticated;
grant execute on function public.add_period(date, integer, integer) to authenticated;
grant execute on function public.resolve_alloc(bigint, public.alloc_mode, integer, bigint, bigint) to authenticated;
grant execute on function public.recompute_payment_allocations(uuid) to authenticated;
grant execute on function public.register_payment(uuid, uuid, date, bigint, public.payment_method, text, text, text) to authenticated;
grant execute on function public.generate_recurring_obligations(date, uuid) to authenticated;
grant execute on function public.register_recurring_expense(uuid, date, public.expense_status, date, public.payer_key) to authenticated;

alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.audit_log enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.recurring_services enable row level security;
alter table public.payment_obligations enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;

create policy members_read on public.profiles for select to authenticated using (public.is_member());
create policy members_read on public.audit_log for select to authenticated using (public.is_member());
create policy members_read on public.settings for select to authenticated using (public.is_member());
create policy members_update on public.settings for update to authenticated using (public.is_member()) with check (public.is_member());

do $$
declare
    t text;
begin
    foreach t in array array['clients', 'projects', 'recurring_services', 'payment_obligations', 'payments', 'expenses'] loop
        execute format('create policy members_select on public.%I for select to authenticated using (public.is_member())', t);
        execute format('create policy members_insert on public.%I for insert to authenticated with check (public.is_member())', t);
        execute format('create policy members_update on public.%I for update to authenticated using (public.is_member()) with check (public.is_member())', t);
    end loop;
    foreach t in array array['payment_obligations', 'payments', 'expenses'] loop
        execute format('create policy members_delete on public.%I for delete to authenticated using (public.is_member())', t);
    end loop;
end;
$$;
