
import { useState } from "react";
import { ChevronDown, ChevronRight, HelpCircle } from "lucide-react";

const faqCategories = [
  {
    id: "plateforme",
    title: "La plateforme",
    description: "Mission, fonctionnement et utilisateurs d'ASSAMAN-SUUF.",
  },
  {
    id: "donnees",
    title: "Données et cartographie",
    description: "Sources de données, indicateurs et cartes interactives.",
  },
  {
    id: "agroclimatique",
    title: "Intelligence agroclimatique",
    description: "Analyse climatique, surveillance et prévisions.",
  },
  {
    id: "management",
    title: "Management agricole",
    description: "Organisation et suivi des projets et opérations.",
  },
  {
    id: "acces",
    title: "Accès et accompagnement",
    description: "Utilisation de la plateforme et demandes spécifiques.",
  },
];

const faqItems = [
  {
    id: 1,
    category: "plateforme",
    question: "Qu'est-ce qu'ASSAMAN-SUUF ?",
    answer:
      "ASSAMAN-SUUF est une plateforme d'aide à la décision qui vise à valoriser les données agricoles, climatiques et environnementales pour accompagner les acteurs du secteur agricole.",
  },
  {
    id: 2,
    category: "plateforme",
    question: "À qui s'adresse ASSAMAN-SUUF ?",
    answer:
      "La plateforme s'adresse notamment aux producteurs, coopératives agricoles, ONG, institutions publiques, entreprises agroalimentaires, chercheurs et organisations engagées dans le développement agricole.",
  },
  {
    id: 3,
    category: "donnees",
    question: "Quelles données peut-on exploiter avec la plateforme ?",
    answer:
      "Selon les sources disponibles et les intégrations réalisées, les données peuvent concerner les précipitations, les températures, la végétation, les sols et les caractéristiques géographiques des territoires agricoles.",
  },
  {
    id: 4,
    category: "donnees",
    question: "À quoi sert la cartographie interactive ?",
    answer:
      "La cartographie permet de visualiser les informations géographiques et les indicateurs disponibles, de comparer différentes zones et de mieux comprendre les réalités agroclimatiques des territoires.",
  },
  {
    id: 5,
    category: "agroclimatique",
    question: "Quels problèmes agroclimatiques peut-on analyser ?",
    answer:
      "L'exploitation des données disponibles peut contribuer à l'analyse de la sécheresse, des variations de précipitations, de l'évolution de la végétation et d'autres facteurs susceptibles d'influencer les activités agricoles.",
  },
  {
    id: 6,
    category: "agroclimatique",
    question: "ASSAMAN-SUUF fournit-il des prévisions agricoles ?",
    answer:
      "L'objectif est de valoriser les données pour contribuer à l'analyse des risques et à l'estimation d'indicateurs agricoles. La disponibilité et la fiabilité des prévisions dépendent des données, des modèles utilisés et de leur validation.",
  },
  {
    id: 7,
    category: "management",
    question: "Peut-on suivre des projets agricoles avec ASSAMAN-SUUF ?",
    answer:
      "La plateforme a vocation à accompagner la planification des activités, le suivi des interventions sur le terrain, la coordination des équipes et l'évaluation des résultats, selon les fonctionnalités déployées.",
  },
  {
    id: 8,
    category: "management",
    question: "Quels indicateurs peut-on utiliser pour suivre un projet ?",
    answer:
      "Selon les besoins et les fonctionnalités disponibles, le suivi peut porter sur les activités réalisées, les zones couvertes, les interventions effectuées et les résultats obtenus.",
  },
  {
    id: 9,
    category: "acces",
    question: "Comment bénéficier des solutions d'ASSAMAN-SUUF ?",
    answer:
      "Vous pouvez présenter votre organisation, votre zone d'intervention et vos besoins afin d'identifier les solutions pertinentes et les modalités d'accompagnement envisageables.",
  },
];


function FAQCategoryGrid({
  categories,
  selectedCategory,
  onSelectCategory,
  faqItems,
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {categories.map((category) => {
        const isActive = selectedCategory === category.id;

        const questionCount = faqItems.filter(
          (item) => item.category === category.id
        ).length;

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelectCategory(category.id)}
            aria-pressed={isActive}
            className={`group flex min-h-40 flex-col rounded-2xl border p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-600 focus-visible:ring-offset-2 ${
              isActive
                ? "border-lime-300 bg-lime-50 shadow-sm"
                : "border-gray-200 bg-white hover:border-lime-200"
            }`}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${
                  isActive
                    ? "bg-lime-600 text-white"
                    : "bg-gray-100 text-gray-600 group-hover:bg-lime-100 group-hover:text-lime-700"
                }`}
                aria-hidden="true"
              >
                {category.title.charAt(0)}
              </span>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  isActive
                    ? "bg-lime-100 text-lime-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {questionCount}{" "}
                {questionCount > 1 ? "questions" : "question"}
              </span>
            </div>

            <h3
              className={`text-base font-semibold ${
                isActive ? "text-lime-800" : "text-gray-900"
              }`}
            >
              {category.title}
            </h3>

            <p className="mt-2 flex-1 text-sm leading-6 text-gray-600">
              {category.description}
            </p>

            <div
              className={`mt-4 h-1 w-10 rounded-full transition-all duration-300 ${
                isActive
                  ? "w-16 bg-lime-600"
                  : "bg-gray-200 group-hover:w-14 group-hover:bg-lime-300"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

function FAQAccordion({ items }) {
  const [openQuestionId, setOpenQuestionId] = useState(null);

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
        Aucune question n'est encore disponible dans cette catégorie.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isOpen = openQuestionId === item.id;
        const answerId = `faq-answer-${item.id}`;

        return (
          <article
            key={item.id}
            className={`overflow-hidden rounded-xl border bg-white transition ${
              isOpen
                ? "border-lime-200 shadow-sm"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <button
              type="button"
              onClick={() =>
                setOpenQuestionId(isOpen ? null : item.id)
              }
              aria-expanded={isOpen}
              aria-controls={answerId}
              className="flex w-full items-center justify-between gap-4 p-5 text-left"
            >
              <span className="text-sm font-semibold leading-6 text-gray-900 sm:text-base">
                {item.question}
              </span>

              <ChevronDown
                size={20}
                aria-hidden="true"
                className={`shrink-0 text-gray-500 transition-transform duration-200 ${
                  isOpen ? "rotate-180 text-lime-700" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div
                id={answerId}
                className="border-t border-gray-100 px-5 pb-5 pt-4"
              >
                <p className="text-sm leading-7 text-gray-600">
                  {item.answer}
                </p>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function FAQSection() {
  const [selectedCategory, setSelectedCategory] = useState(
    faqCategories[0].id
  );

  const selectedCategoryData = faqCategories.find(
    (category) => category.id === selectedCategory
  );

  const filteredFAQs = faqItems.filter(
    (item) => item.category === selectedCategory
  );

  return (
    <section
      aria-labelledby="faq-title"
      className="bg-gray-50"
    >
      <div className="mx-auto w-full max-w-[1440px] px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
        <header className="mb-10 max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
            ASSAMAN-SUUF
          </p>

          <h2
            id="faq-title"
            className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
          >
            Questions fréquentes
          </h2>

          <p className="mt-4 text-sm leading-7 text-gray-600 sm:text-base">
            Retrouvez rapidement les réponses à vos questions sur
            notre plateforme, nos données agroclimatiques et nos
            solutions pour les acteurs du secteur agricole.
          </p>
        </header>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-10">

            <div className="space-y-8">
            <div>
                <div className="mb-5">
                <h3 className="text-lg font-semibold text-gray-900">
                    Explorer par catégorie
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                    Sélectionnez un thème pour consulter les questions et les
                    réponses correspondantes.
                </p>
                </div>

                <FAQCategoryGrid
                categories={faqCategories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                faqItems={faqItems}
                />
            </div>

                <div
                    className="mx-auto w-full max-w-4xl"
                    aria-live="polite"
                >
                    <header className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-lime-700">
                        Centre d'aide
                    </p>

                    <h3 className="mt-2 text-xl font-bold text-gray-900 sm:text-2xl">
                        {selectedCategoryData?.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                        {selectedCategoryData?.description}
                    </p>
                    </header>

                    <FAQAccordion
                    key={selectedCategory}
                    items={filteredFAQs}
                    />
                </div>
            </div>


            <div className="min-w-0">
                <header className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-lime-700">
                    Centre d'aide
                </p>

                <h3 className="mt-2 text-xl font-bold text-gray-900 sm:text-2xl">
                    {selectedCategoryData?.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                    {selectedCategoryData?.description}
                </p>

                <p className="mt-3 text-xs text-gray-500">
                    {filteredFAQs.length}{" "}
                    {filteredFAQs.length > 1
                    ? "questions disponibles"
                    : "question disponible"}
                </p>
                </header>

                <FAQAccordion
                key={selectedCategory}
                items={filteredFAQs}
                />
            </div>
        </div>
      </div>
    </section>
  );
}

export default FAQSection;
