-- Remove gen_random_uuid() defaults from foreign key columns
-- These defaults are dangerous: if omitted on insert, they create references to non-existent records

ALTER TABLE public.notifications
  ALTER COLUMN recipient_id DROP DEFAULT;

ALTER TABLE public.escalistas
  ALTER COLUMN auth_id DROP DEFAULT;

ALTER TABLE public.vagas
  ALTER COLUMN hospital_id DROP DEFAULT,
  ALTER COLUMN periodo_id DROP DEFAULT,
  ALTER COLUMN tipos_vaga_id DROP DEFAULT,
  ALTER COLUMN setor_id DROP DEFAULT,
  ALTER COLUMN especialidade_id DROP DEFAULT;

ALTER TABLE public.vagas_requisitos
  ALTER COLUMN vaga_id DROP DEFAULT;
