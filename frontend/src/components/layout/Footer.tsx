
import "./Footer.css";
import { Link } from "react-router-dom";

const footerLinks = [
  {
    title: "Liens rapides",
    links: [
      { label: "Accueil", to: "/" },
      { label: "La plateforme", to: "/plateforme" },
      { label: "Fonctionnalités", to: "/fonctionnalites" },
      { label: "Comment ça fonctionne", to: "/fonctionnement" },
    ],
  },
  {
    title: "Nos services",
    links: [
      {
        label: "Analyse agroclimatique",
        to: "/services/agroclimatologie",
      },
      {
        label: "Suivi de la végétation",
        to: "/services/vegetation",
      },
      {
        label: "Cartographie interactive",
        to: "/services/cartographie",
      },
      {
        label: "Suivi des risques agricoles",
        to: "/services/risques",
      },
    ],
  },
  {
    title: "À propos",
    links: [
      { label: "Notre mission", to: "/a-propos" },
      { label: "Notre équipe", to: "/equipe" },
      { label: "Nos partenaires", to: "/partenaires" },
      { label: "Nous contacter", to: "/contact" },
    ],
  },
];

function FooterContact() {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Le formulaire sera connecté à l'API FastAPI ultérieurement.
    alert(
      "Le formulaire de contact n'est pas encore connecté au serveur."
    );
  };

  return (
    <div className="footerContact">
      <div className="footerBrand">
        <Link to="/" className="footerLogo">
          Assaman-Suuf
        </Link>

        <p>
          Assaman-Suuf transforme les données agroclimatiques en
          informations stratégiques pour une agriculture plus
          intelligente, durable et résiliente au Sénégal.
        </p>

        <Link to="/plateforme" className="footerCta">
          Découvrir la plateforme →
        </Link>
      </div>

      <div className="footerContactForm">
        <h2 className="footerTitle">Parlons de votre projet</h2>

        <p>
          Vous représentez une ONG, une institution ou une
          organisation agricole ? Échangeons sur vos besoins.
        </p>

        <form
          onSubmit={handleSubmit}
          className="footerForm"
        >
          <div className="footerFormField">
            <label htmlFor="footer-name">Nom complet</label>
            <input
              id="footer-name"
              type="text"
              name="name"
              placeholder="Votre nom"
              autoComplete="name"
              required
            />
          </div>

          <div className="footerFormField">
            <label htmlFor="footer-email">Adresse e-mail</label>
            <input
              id="footer-email"
              type="email"
              name="email"
              placeholder="vous@exemple.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="footerFormField">
            <label htmlFor="footer-message">Votre message</label>
            <textarea
              id="footer-message"
              name="message"
              placeholder="Parlez-nous de vos besoins..."
              rows={3}
              required
            />
          </div>

          <button type="submit" className="footerSubmit">
            Envoyer le message
          </button>
        </form>
      </div>
    </div>
  );
}

function FooterNavSection() {
  return (
    <nav
      className="footerNavigation"
      aria-label="Navigation de pied de page"
    >
      {footerLinks.map((section) => (
        <div className="footerNavColumn" key={section.title}>
          <h3 className="footerTitle">{section.title}</h3>

          <ul>
            {section.links.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="footerNavColumn footerInfo">
        <h3 className="footerTitle">Contact & informations</h3>

        <ul>
          <li>
            <Link to="/contact">Nous contacter</Link>
          </li>
          <li>
            <Link to="/demonstration">
              Demander une démonstration
            </Link>
          </li>
          <li>
            <Link to="/connexion">Se connecter</Link>
          </li>
          <li>
            <Link to="/partenariats">Devenir partenaire</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

function FooterPoliticsSection() {
  return (
    <div className="footerBottom">
      <p>
        © {new Date().getFullYear()} Assaman-Suuf.
        Tous droits réservés.
      </p>

      <nav aria-label="Informations légales">
        <ul className="footerLegalLinks">
          <li>
            <Link to="/politique-de-confidentialite">
              Confidentialité
            </Link>
          </li>
          <li>
            <Link to="/conditions-d-utilisation">
              Conditions d’utilisation
            </Link>
          </li>
          <li>
            <Link to="/mentions-legales">
              Mentions légales
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}

function Footer() {
  return (
    <footer className="siteFooter">
      <section className="footerTop">
        <FooterContact />
      </section>

      <section className="footerMiddle">
        <FooterNavSection />
      </section>

      <section className="footerBottomSection">
        <FooterPoliticsSection />
      </section>
    </footer>
  );
}

export default Footer;