-- Migration: Add 'ldap' to sso_provider ENUM
-- Datum: 2026-02-27
-- Beschreibung: Fehlender 'ldap' Wert in enum_users_sso_provider hinzufügen
-- Bug: TypeScript-Typ und ssoController nutzten 'ldap', aber DB-ENUM hatte es nicht

-- PostgreSQL: ENUM-Typ um neuen Wert erweitern
-- ALTER TYPE ... ADD VALUE ist idempotent mit IF NOT EXISTS (PG 9.3+)
DO $$
BEGIN
    -- Prüfe ob der ENUM-Typ existiert
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_sso_provider') THEN
        -- Füge 'ldap' hinzu falls noch nicht vorhanden
        BEGIN
            ALTER TYPE "enum_users_sso_provider" ADD VALUE IF NOT EXISTS 'ldap';
            RAISE NOTICE 'Added ldap to enum_users_sso_provider';
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'ldap already exists in enum_users_sso_provider';
        END;
    ELSE
        RAISE NOTICE 'enum_users_sso_provider type does not exist yet (will be created by Sequelize sync)';
    END IF;
END
$$;
