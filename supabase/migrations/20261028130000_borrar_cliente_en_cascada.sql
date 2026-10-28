-- Borrar un cliente elimina también sus cobros y los pagos de esos cobros.
alter table public.charges drop constraint charges_client_id_fkey,
    add constraint charges_client_id_fkey foreign key (client_id) references public.clients (id) on delete cascade;
alter table public.charge_payments drop constraint charge_payments_charge_id_fkey,
    add constraint charge_payments_charge_id_fkey foreign key (charge_id) references public.charges (id) on delete cascade;
