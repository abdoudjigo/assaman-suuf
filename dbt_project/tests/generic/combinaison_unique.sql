-- Test générique : une combinaison de colonnes ne doit apparaître qu'une fois.
-- Sert à vérifier le grain d'un modèle (ex. station × année).

{% test combinaison_unique(model, colonnes) %}

SELECT
    {{ colonnes | join(', ') }},
    COUNT(*) AS nb_lignes
FROM {{ model }}
GROUP BY {{ colonnes | join(', ') }}
HAVING COUNT(*) > 1

{% endtest %}
