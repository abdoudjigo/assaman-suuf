/*
|--------------------------------------------------------------------------
| FILTRES
|--------------------------------------------------------------------------
*/

function FilterPanel({
                         filters,
                         setFilters,
                         onApply,
                         onReset,
                         onClose,
                     }) {
    const updateNestedFilter = (section, field, value) => {
        setFilters((current) => ({
            ...current,
            [section]: {
                ...current[section],
                [field]: value,
            },
        }));
    };

    const toggleArrayFilter = (section, field, value) => {
        setFilters((current) => {
            const currentValues = current[section][field];

            const nextValues = currentValues.includes(value)
                ? currentValues.filter((item) => item !== value)
                : [...currentValues, value];

            return {
                ...current,
                [section]: {
                    ...current[section],
                    [field]: nextValues,
                },
            };
        });
    };

    return (
        <PanelShell
            title="Filtres"
            subtitle="Définissez les données que vous souhaitez analyser"
            icon={Filter}
            onClose={onClose}
            width="w-[430px]"
        >
            <div className="space-y-3">
                <FilterSection
                    title="Géographie"
                    icon={MapPinned}
                    defaultOpen
                >
                    <div className="grid grid-cols-2 gap-2">
                        <SelectField
                            label="Région"
                            value={filters.geography.region}
                            onChange={(value) =>
                                updateNestedFilter("geography", "region", value)
                            }
                            options={[
                                "Dakar",
                                "Diourbel",
                                "Fatick",
                                "Kaffrine",
                                "Kaolack",
                                "Kédougou",
                                "Louga",
                                "Matam",
                                "Saint-Louis",
                                "Sédhiou",
                                "Tambacounda",
                                "Thiès",
                                "Ziguinchor",
                            ]}
                        />

                        <SelectField
                            label="Département"
                            value={filters.geography.department}
                            onChange={(value) =>
                                updateNestedFilter("geography", "department", value)
                            }
                            options={[
                                "Kaffrine",
                                "Kaolack",
                                "Nioro",
                                "Fatick",
                                "Foundiougne",
                            ]}
                        />

                        <SelectField
                            label="Commune"
                            value={filters.geography.commune}
                            onChange={(value) =>
                                updateNestedFilter("geography", "commune", value)
                            }
                            options={[
                                "Kaffrine",
                                "Kaolack",
                                "Nioro-du-Rip",
                                "Koungheul",
                            ]}
                        />

                        <SelectField
                            label="Zone agricole"
                            value={filters.geography.agriculturalZone}
                            onChange={(value) =>
                                updateNestedFilter(
                                    "geography",
                                    "agriculturalZone",
                                    value
                                )
                            }
                            options={[
                                "Bassin arachidier",
                                "Vallée du fleuve Sénégal",
                                "Niayes",
                                "Casamance",
                                "Ferlo",
                            ]}
                        />
                    </div>
                </FilterSection>

                <FilterSection title="Période & climat" icon={CloudRain}>
                    <div className="grid grid-cols-2 gap-2">
                        <InputField
                            label="Année début"
                            type="number"
                            value={filters.climate.periodStart}
                            onChange={(value) =>
                                updateNestedFilter("climate", "periodStart", value)
                            }
                        />

                        <InputField
                            label="Année fin"
                            type="number"
                            value={filters.climate.periodEnd}
                            onChange={(value) =>
                                updateNestedFilter("climate", "periodEnd", value)
                            }
                        />

                        <InputField
                            label="Pluie min. (mm)"
                            value={filters.climate.rainfallMin}
                            onChange={(value) =>
                                updateNestedFilter("climate", "rainfallMin", value)
                            }
                        />

                        <InputField
                            label="Pluie max. (mm)"
                            value={filters.climate.rainfallMax}
                            onChange={(value) =>
                                updateNestedFilter("climate", "rainfallMax", value)
                            }
                        />
                    </div>
                </FilterSection>

                <FilterSection title="Agriculture" icon={Sprout}>
                    <div className="grid grid-cols-2 gap-2">
                        <SelectField
                            label="Culture"
                            value={filters.agriculture.crop}
                            onChange={(value) =>
                                updateNestedFilter("agriculture", "crop", value)
                            }
                            options={[
                                "Arachide",
                                "Mil",
                                "Maïs",
                                "Riz",
                                "Sorgho",
                                "Niébé",
                                "Tomate",
                                "Oignon",
                                "Canne à sucre",
                            ]}
                        />

                        <SelectField
                            label="Saison"
                            value={filters.agriculture.season}
                            onChange={(value) =>
                                updateNestedFilter("agriculture", "season", value)
                            }
                            options={[
                                "Hivernage",
                                "Contre-saison",
                                "Saison sèche",
                            ]}
                        />

                        <SelectField
                            label="Type d'exploitation"
                            value={filters.agriculture.farmingType}
                            onChange={(value) =>
                                updateNestedFilter(
                                    "agriculture",
                                    "farmingType",
                                    value
                                )
                            }
                            options={[
                                "Familiale",
                                "Industrielle",
                                "Coopérative",
                                "Agro-industrielle",
                            ]}
                        />

                        <SelectField
                            label="Irrigation"
                            value={filters.agriculture.irrigation}
                            onChange={(value) =>
                                updateNestedFilter(
                                    "agriculture",
                                    "irrigation",
                                    value
                                )
                            }
                            options={["Oui", "Non", "Partielle"]}
                        />
                    </div>
                </FilterSection>

                <FilterSection
                    title="Pratiques agricoles"
                    icon={SlidersHorizontal}
                >
                    <div className="space-y-2">
                        <SelectField
                            label="Type d'engrais"
                            value={filters.practices.fertilizerType}
                            onChange={(value) =>
                                updateNestedFilter(
                                    "practices",
                                    "fertilizerType",
                                    value
                                )
                            }
                            options={[
                                "Urée",
                                "NPK",
                                "DAP",
                                "Engrais organique",
                                "Fumier",
                                "Compost",
                            ]}
                        />

                        <div className="grid grid-cols-2 gap-2">
                            <InputField
                                label="Dose d'engrais"
                                value={filters.practices.fertilizerDose}
                                onChange={(value) =>
                                    updateNestedFilter(
                                        "practices",
                                        "fertilizerDose",
                                        value
                                    )
                                }
                            />

                            <SelectField
                                label="Application"
                                value={filters.practices.fertilizerApplicationPeriod}
                                onChange={(value) =>
                                    updateNestedFilter(
                                        "practices",
                                        "fertilizerApplicationPeriod",
                                        value
                                    )
                                }
                                options={[
                                    "Avant semis",
                                    "Au semis",
                                    "Après semis",
                                    "Plusieurs applications",
                                ]}
                            />
                        </div>

                        <SelectField
                            label="Méthode d'irrigation"
                            value={filters.practices.irrigationMethod}
                            onChange={(value) =>
                                updateNestedFilter(
                                    "practices",
                                    "irrigationMethod",
                                    value
                                )
                            }
                            options={[
                                "Goutte-à-goutte",
                                "Aspersion",
                                "Gravitaire",
                                "Pivot",
                                "Aucune",
                            ]}
                        />

                        <SelectField
                            label="Type de travail du sol"
                            value={filters.practices.tillage}
                            onChange={(value) =>
                                updateNestedFilter(
                                    "practices",
                                    "tillage",
                                    value
                                )
                            }
                            options={[
                                "Conventionnel",
                                "Minimal",
                                "Sans labour",
                            ]}
                        />
                    </div>
                </FilterSection>

                <FilterSection title="Sols" icon={Mountain}>
                    <div className="grid grid-cols-2 gap-2">
                        <SelectField
                            label="Type de sol"
                            value={filters.soil.soilType}
                            onChange={(value) =>
                                updateNestedFilter("soil", "soilType", value)
                            }
                            options={[
                                "Sableux",
                                "Argileux",
                                "Limoneux",
                                "Latéritique",
                                "Hydromorphe",
                            ]}
                        />

                        <SelectField
                            label="Fertilité"
                            value={filters.soil.fertility}
                            onChange={(value) =>
                                updateNestedFilter("soil", "fertility", value)
                            }
                            options={["Faible", "Moyenne", "Élevée"]}
                        />

                        <SelectField
                            label="Salinité"
                            value={filters.soil.salinity}
                            onChange={(value) =>
                                updateNestedFilter("soil", "salinity", value)
                            }
                            options={["Faible", "Moyenne", "Forte"]}
                        />

                        <InputField
                            label="pH"
                            value={filters.soil.ph}
                            onChange={(value) =>
                                updateNestedFilter("soil", "ph", value)
                            }
                        />
                    </div>
                </FilterSection>

                <FilterSection title="Eau" icon={Droplets}>
                    <div className="grid grid-cols-2 gap-2">
                        <SelectField
                            label="Disponibilité"
                            value={filters.water.availability}
                            onChange={(value) =>
                                updateNestedFilter(
                                    "water",
                                    "availability",
                                    value
                                )
                            }
                            options={["Faible", "Moyenne", "Élevée"]}
                        />

                        <SelectField
                            label="Stress hydrique"
                            value={filters.water.waterStress}
                            onChange={(value) =>
                                updateNestedFilter(
                                    "water",
                                    "waterStress",
                                    value
                                )
                            }
                            options={["Faible", "Moyen", "Élevé"]}
                        />
                    </div>
                </FilterSection>

                <FilterSection
                    title="Observation satellite"
                    icon={Satellite}
                >
                    <div className="grid grid-cols-2 gap-2">
                        <SelectField
                            label="Indice"
                            value={filters.remoteSensing.index}
                            onChange={(value) =>
                                updateNestedFilter(
                                    "remoteSensing",
                                    "index",
                                    value
                                )
                            }
                            options={["NDVI", "EVI", "NDWI", "LAI", "LST"]}
                        />

                        <InputField
                            label="Valeur minimale"
                            value={filters.remoteSensing.minValue}
                            onChange={(value) =>
                                updateNestedFilter(
                                    "remoteSensing",
                                    "minValue",
                                    value
                                )
                            }
                        />
                    </div>
                </FilterSection>

                <FilterSection
                    title="Risques"
                    icon={AlertTriangle}
                >
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            "Sécheresse",
                            "Inondation",
                            "Stress thermique",
                            "Stress hydrique",
                            "Phytosanitaire",
                            "Érosion",
                        ].map((risk) => (
                            <CheckOption
                                key={risk}
                                label={risk}
                                checked={filters.risks.selected.includes(risk)}
                                onChange={() =>
                                    toggleArrayFilter(
                                        "risks",
                                        "selected",
                                        risk
                                    )
                                }
                            />
                        ))}
                    </div>
                </FilterSection>

                <FilterSection
                    title="Infrastructures"
                    icon={Building2}
                >
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            "Marchés",
                            "Entrepôts",
                            "Forages",
                            "Barrages",
                            "Routes",
                            "Stations météo",
                            "Transformation",
                        ].map((type) => (
                            <CheckOption
                                key={type}
                                label={type}
                                checked={filters.infrastructure.types.includes(type)}
                                onChange={() =>
                                    toggleArrayFilter(
                                        "infrastructure",
                                        "types",
                                        type
                                    )
                                }
                            />
                        ))}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <SelectField
                            label="Statut"
                            value={filters.infrastructure.status}
                            onChange={(value) =>
                                updateNestedFilter(
                                    "infrastructure",
                                    "status",
                                    value
                                )
                            }
                            options={[
                                "Existante",
                                "En construction",
                                "Hors service",
                                "Abandonnée",
                            ]}
                        />

                        <InputField
                            label="Depuis l'année"
                            value={filters.infrastructure.fromYear}
                            onChange={(value) =>
                                updateNestedFilter(
                                    "infrastructure",
                                    "fromYear",
                                    value
                                )
                            }
                        />

                        <InputField
                            label="Jusqu'à l'année"
                            value={filters.infrastructure.toYear}
                            onChange={(value) =>
                                updateNestedFilter(
                                    "infrastructure",
                                    "toYear",
                                    value
                                )
                            }
                        />
                    </div>
                </FilterSection>

                {/*
        |--------------------------------------------------------------------------
        | HISTORIQUE
        |--------------------------------------------------------------------------
        | L'historique reste un filtre / critère de recherche.
        | Il ne devient pas automatiquement une couche.
        |--------------------------------------------------------------------------
        */}

                <FilterSection
                    title="Historique"
                    icon={Activity}
                >
                    <div className="grid grid-cols-2 gap-2">
                        <InputField
                            label="Année début"
                            value={filters.historical.yearStart}
                            onChange={(value) =>
                                updateNestedFilter(
                                    "historical",
                                    "yearStart",
                                    value
                                )
                            }
                        />

                        <InputField
                            label="Année fin"
                            value={filters.historical.yearEnd}
                            onChange={(value) =>
                                updateNestedFilter(
                                    "historical",
                                    "yearEnd",
                                    value
                                )
                            }
                        />
                    </div>

                    <div className="mt-2 space-y-2">
                        <SelectField
                            label="Historique des infrastructures"
                            value={filters.historical.infrastructureHistory}
                            onChange={(value) =>
                                updateNestedFilter(
                                    "historical",
                                    "infrastructureHistory",
                                    value
                                )
                            }
                            options={[
                                "Nouvelles infrastructures",
                                "Infrastructures existantes",
                                "Infrastructures supprimées",
                                "Évolution des infrastructures",
                            ]}
                        />

                        <SelectField
                            label="Historique des cultures"
                            value={filters.historical.cropHistory}
                            onChange={(value) =>
                                updateNestedFilter(
                                    "historical",
                                    "cropHistory",
                                    value
                                )
                            }
                            options={[
                                "Rotation des cultures",
                                "Évolution des surfaces",
                                "Changement de culture",
                            ]}
                        />

                        <SelectField
                            label="Changement d'occupation des sols"
                            value={filters.historical.landUseChange}
                            onChange={(value) =>
                                updateNestedFilter(
                                    "historical",
                                    "landUseChange",
                                    value
                                )
                            }
                            options={[
                                "Agricole vers non agricole",
                                "Non agricole vers agricole",
                                "Stable",
                            ]}
                        />
                    </div>
                </FilterSection>
            </div>

            <div className="sticky bottom-0 mt-4 flex gap-2 border-t border-slate-100 bg-white pt-3">
                <button
                    onClick={onReset}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                    Réinitialiser
                </button>

                <button
                    onClick={onApply}
                    className="flex flex-[1.5] items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-xs font-semibold text-white hover:bg-green-700"
                >
                    <Check size={15} />
                    Appliquer les filtres
                </button>
            </div>
        </PanelShell>
    );
}
