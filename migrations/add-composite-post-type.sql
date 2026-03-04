-- Migration: Füge 'composite' als neuen contentType hinzu
-- Multi-Layer-Komposite für dynamische Digital-Signage-Inhalte
-- Muss AUSSERHALB einer Transaktion ausgeführt werden (PostgreSQL ENUM-Einschränkung)

ALTER TYPE "enum_posts_contentType" ADD VALUE IF NOT EXISTS 'composite';
