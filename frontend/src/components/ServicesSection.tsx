
function ServicesCards() {
  const services = [
    {
      title: "Intelligence agroclimatique",
      description:
        "Exploitez les données climatiques et environnementales pour comprendre les conditions agricoles, suivre les évolutions saisonnières et mieux anticiper les risques.",
    },
    {
      title: "Cartographie et surveillance agricole",
      description:
        "Visualisez les territoires, les parcelles et les indicateurs agroclimatiques sur des cartes interactives pour mieux comprendre les réalités du terrain.",
    },
    {
      title: "Analyse et performance agricole",
      description:
        "Analysez les données agricoles et environnementales afin d'identifier les tendances, de suivre l'état des cultures et d'évaluer les facteurs qui influencent la production.",
    },
    {
      title: "Management des projets agricoles",
      description:
        "Organisez les activités, planifiez les interventions sur le terrain et suivez l'avancement des projets, des équipes et des actions agricoles.",
    },
    {
      title: "Pilotage et aide à la décision",
      description:
        "Centralisez les indicateurs clés, consultez des tableaux de bord et exploitez des rapports pour faciliter la planification et le suivi des performances.",
    },
    {
      title: "Données et solutions sur mesure",
      description:
        "Centralisez et valorisez les données issues de différentes sources grâce à des outils d'intégration, des systèmes connectés et des solutions adaptées aux besoins des organisations.",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <article
          key={service.title}
          className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-lime-200 hover:shadow-lg"
        >
          <h3 className="mb-3 text-lg font-semibold text-gray-900 transition-colors group-hover:text-lime-700">
            {service.title}
          </h3>

          <p className="text-sm leading-7 text-gray-600">
            {service.description}
          </p>
        </article>
      ))}
    </div>
  );
}

function ServicesSection() {
  return (
    <section
      aria-labelledby="services-title"
      className="bg-gray-50"
    >
      <div className="mx-auto w-full max-w-[1440px] space-y-10 px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
              ASSAMAN-SUUF
            </p>

            <h2
              id="services-title"
              className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
            >
              Nos solutions
              <span className="text-lime-600"> agroclimatiques</span>
            </h2>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-600 sm:text-base">
              De l'analyse des données agroclimatiques au management des
              projets agricoles, ASSAMAN-SUUF accompagne les acteurs du
              secteur dans la compréhension de leur environnement, le suivi
              de leurs activités et la prise de décision.
            </p>
          </div>
        </div>

        <ServicesCards />
      </div>
    </section>
  );
}

export default ServicesSection;
