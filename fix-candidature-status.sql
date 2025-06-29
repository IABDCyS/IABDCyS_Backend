-- Fix candidature status from 'SOUMIS' to 'SOUMISE'
-- This script fixes any candidatures that have the incorrect status

UPDATE candidatures 
SET statut = 'SOUMISE' 
WHERE statut = 'SOUMIS';

-- Verify the fix
SELECT id, numeroCandidature, statut, candidatId 
FROM candidatures 
WHERE statut IN ('SOUMIS', 'SOUMISE'); 