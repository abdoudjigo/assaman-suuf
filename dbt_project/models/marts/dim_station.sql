-- Dimension station :
-- une ligne représente une station climatique.
-- zone_key rattache chaque station à sa région.

SELECT DISTINCT

    MD5(station) AS station_key,

    station,
    station_nom,

    MD5(
        CASE
            WHEN station_nom IN ('Dakar-Ouakam', 'Dakar/Yoff')
                THEN 'Dakar'

            WHEN station_nom = 'Diourbel'
                THEN 'Diourbel'

            WHEN station_nom = 'Kaolack'
                THEN 'Kaolack'

            WHEN station_nom = 'Kedougou'
                THEN 'Kedougou'

            WHEN station_nom = 'Kolda'
                THEN 'Kolda'

            WHEN station_nom = 'Linguere'
                THEN 'Louga'

            WHEN station_nom = 'Matam/Ouro Sogui'
                THEN 'Matam'

            WHEN station_nom IN ('Podor', 'Saint Louis')
                THEN 'Saint-Louis'

            WHEN station_nom = 'Tambacounda'
                THEN 'Tambacounda'

            WHEN station_nom = 'Thies'
                THEN 'Thies'

            WHEN station_nom IN ('Ziguinchor', 'Cap Skiring')
                THEN 'Ziguinchor'

            ELSE NULL
        END
    ) AS zone_key

FROM {{ ref('stg_climat') }}

WHERE station IS NOT NULL
