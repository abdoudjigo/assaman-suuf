-- Test générique : la colonne doit rester dans [min_value, max_value].
-- Les NULL sont ignorés (leur absence se teste avec not_null).
-- Une borne omise n'est pas contrôlée.

{% test valeur_dans_intervalle(model, column_name, min_value=none, max_value=none) %}

SELECT *
FROM {{ model }}
WHERE {{ column_name }} IS NOT NULL
  AND (
        1 = 0
        {% if min_value is not none %}
        OR {{ column_name }} < {{ min_value }}
        {% endif %}
        {% if max_value is not none %}
        OR {{ column_name }} > {{ max_value }}
        {% endif %}
  )

{% endtest %}
