-- Backfill: preenche foto_url_snapshot das películas TRADICIONAIS existentes
-- com a foto de referência do tipo (Cerâmica, Vidro 3D, etc.), para a miniatura
-- aparecer na lista do pedido e no histórico — igual às capas.
--
-- A criação nova já grava a foto (AbaPeliculas.toggleTrad passa tipo.foto_url).
-- Este seed cobre os itens criados ANTES dessa correção (foto_url_snapshot NULL).
-- Já executado em produção em 2026-07-27 (239 itens atualizados).

update pedido_itens pi
set foto_url_snapshot = t.foto_url
from tipos_pelicula_tradicional t
where pi.tipo_peli_trad_id = t.id
  and pi.categoria = 'pelicula_tradicional'
  and pi.foto_url_snapshot is null
  and t.foto_url is not null;
