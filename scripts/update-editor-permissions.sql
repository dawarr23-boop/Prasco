-- Editor-Rolle erhält posts.delete und categories.delete Berechtigung

-- Finde die Permission IDs
DO $$
DECLARE
    posts_delete_id INTEGER;
    categories_delete_id INTEGER;
BEGIN
    -- Hole Permission IDs
    SELECT id INTO posts_delete_id FROM permissions WHERE name = 'posts.delete';
    SELECT id INTO categories_delete_id FROM permissions WHERE name = 'categories.delete';
    
    -- Posts Delete
    IF posts_delete_id IS NOT NULL THEN
        INSERT INTO role_permissions (role, permission_id, created_at, updated_at)
        VALUES ('editor', posts_delete_id, NOW(), NOW())
        ON CONFLICT (role, permission_id) DO NOTHING;
        RAISE NOTICE 'Editor hat nun posts.delete Berechtigung';
    END IF;
    
    -- Categories Delete
    IF categories_delete_id IS NOT NULL THEN
        INSERT INTO role_permissions (role, permission_id, created_at, updated_at)
        VALUES ('editor', categories_delete_id, NOW(), NOW())
        ON CONFLICT (role, permission_id) DO NOTHING;
        RAISE NOTICE 'Editor hat nun categories.delete Berechtigung';
    END IF;
END $$;

-- Zeige alle Editor-Berechtigungen
SELECT 
    rp.role,
    p.name as permission,
    p.description
FROM role_permissions rp
JOIN permissions p ON p.id = rp.permission_id
WHERE rp.role = 'editor'
ORDER BY p.name;
