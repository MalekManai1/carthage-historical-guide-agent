import {
  ABOUT_MISSION,
  AGENT_FEATURES,
  AGENT_PERSONALIZATION_CHIPS,
  HELP_ITEMS,
  PROBLEM_POINTS,
  SITE_CONTACT,
  SUSTAINABILITY_PILLARS,
  TEAM,
  type SiteView,
} from "../content/siteContent";

interface SitePagesProps {
  view: SiteView;
  onOpenChat: () => void;
  onScrollToFeatures: () => void;
}

function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </header>
  );
}

function AgentFeaturesSection({ id }: { id?: string }) {
  return (
    <section id={id} className="agent-features" aria-labelledby="agent-features-title">
      <h2 id="agent-features-title" className="section-title">
        Capacités de l&apos;agent
      </h2>
      <div className="agent-card-grid">
        {AGENT_FEATURES.map((feature) => (
          <article key={feature.title} className="agent-card">
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function PersonalizationSection() {
  return (
    <section className="personalization-section" aria-labelledby="personalization-title">
      <h2 id="personalization-title" className="section-title">
        Personnalisation
      </h2>
      <p className="personalization-lead">
        L&apos;agent peut adapter ses réponses selon :
      </p>
      <ul className="pill-list personalization-chips">
        {AGENT_PERSONALIZATION_CHIPS.map((chip) => (
          <li key={chip}>{chip}</li>
        ))}
      </ul>
    </section>
  );
}

function HomeView({ onOpenChat, onScrollToFeatures }: SitePagesProps) {
  return (
    <section className="content-panel home-panel">
      <div className="hero-section">
        <div className="hero-copy">
          <p className="hero-eyebrow">Dourbia · Carthage</p>
          <h1 className="hero-title">Guide historique intelligent pour Carthage</h1>
          <p className="hero-subtitle">
            Posez vos questions sur les monuments, les époques historiques et les visites
            culturelles. L&apos;agent répond avec une base RAG, une mémoire de session et
            des sources fiables.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn-primary" onClick={onOpenChat}>
              Essayer le guide
            </button>
            <button type="button" className="btn-secondary" onClick={onScrollToFeatures}>
              Voir les sources
            </button>
          </div>
        </div>
        <div className="hero-visual">
          <img src="/dourbia-banner.png" alt="" className="hero-banner" />
          <img src="/dourbia-logo.png" alt="Dourbia" className="hero-logo" />
        </div>
      </div>

      <AgentFeaturesSection id="agent-capabilities" />
      <PersonalizationSection />

      <div className="highlight-box chat-cta">
        <h3>Prêt à explorer ?</h3>
        <p>
          Cliquez sur le bouton orange en bas à droite ou utilisez{" "}
          <strong>Essayer le guide</strong> pour ouvrir l&apos;assistant.
        </p>
        <button type="button" className="btn-primary btn-compact" onClick={onOpenChat}>
          Ouvrir le guide
        </button>
      </div>
    </section>
  );
}

function ToursView({ onOpenChat, onScrollToFeatures }: SitePagesProps) {
  return (
    <section className="content-panel">
      <PageHeader
        title="Guide & visites"
        subtitle="Découvrez comment l'agent historique vous accompagne à Carthage."
      />
      <AgentFeaturesSection />
      <PersonalizationSection />
      <div className="highlight-box chat-cta">
        <h3>Testez l&apos;agent</h3>
        <p>Posez une question sur un monument, une période ou un circuit de visite.</p>
        <div className="hero-actions">
          <button type="button" className="btn-primary btn-compact" onClick={onOpenChat}>
            Essayer le guide
          </button>
          <button type="button" className="btn-secondary btn-compact" onClick={onScrollToFeatures}>
            Voir les capacités
          </button>
        </div>
      </div>
    </section>
  );
}

function AboutView() {
  return (
    <section className="content-panel">
      <PageHeader
        title="À propos de Dourbia"
        subtitle="Plateforme numérique intelligente pour découvrir le patrimoine culturel tunisien."
      />

      <div className="mission-card">
        <h3>Notre mission</h3>
        <p>{ABOUT_MISSION}</p>
      </div>

      <h3 className="section-title">Un tourisme durable</h3>
      <div className="card-grid">
        {SUSTAINABILITY_PILLARS.map((pillar) => (
          <article key={pillar.title} className="info-card">
            <h4>{pillar.title}</h4>
            <p>{pillar.description}</p>
          </article>
        ))}
      </div>

      <h3 className="section-title">Le problème que nous adressons</h3>
      <ul className="bullet-list">
        {PROBLEM_POINTS.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>

      <h3 className="section-title">Notre équipe</h3>
      <div className="team-grid">
        {TEAM.map((member) => (
          <article key={member.name} className="team-card">
            <strong>{member.name}</strong>
            <span>{member.role}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function ContactView() {
  return (
    <section className="content-panel">
      <PageHeader
        title="Contact"
        subtitle="Échangez avec nous pour benchmarking, évaluation et partenariat."
      />

      <div className="contact-grid">
        <article className="contact-card">
          <h3>Site web</h3>
          <a href={SITE_CONTACT.website} target="_blank" rel="noopener noreferrer">
            {SITE_CONTACT.website}
          </a>
        </article>
        <article className="contact-card">
          <h3>Email</h3>
          <a href={`mailto:${SITE_CONTACT.email}`}>{SITE_CONTACT.email}</a>
        </article>
      </div>

      <div className="highlight-box">
        <h3>Partenariats</h3>
        <p>
          Dourbia s&apos;adresse aux visiteurs, aux agences et aux institutions culturelles.
          Contactez-nous pour une démo ou une collaboration R&D.
        </p>
      </div>
    </section>
  );
}

function HelpView({ onOpenChat }: Pick<SitePagesProps, "onOpenChat">) {
  return (
    <section className="content-panel">
      <PageHeader
        title="Aide"
        subtitle="Utilisez le guide historique pour interroger le patrimoine de Carthage."
      />

      <div className="faq-list">
        {HELP_ITEMS.map((item) => (
          <article key={item.question} className="faq-card">
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </article>
        ))}
      </div>

      <div className="highlight-box">
        <h3>Exemples de questions</h3>
        <ul className="bullet-list">
          <li>Explique-moi les Thermes d&apos;Antonin.</li>
          <li>What can I visit in Carthage in 90 minutes?</li>
          <li>ما هي أهم الآثار البونيقية في قرطاج؟</li>
        </ul>
        <button type="button" className="btn-primary btn-compact" onClick={onOpenChat}>
          Poser une question
        </button>
      </div>
    </section>
  );
}

export default function SitePages(props: SitePagesProps) {
  switch (props.view) {
    case "tours":
      return <ToursView {...props} />;
    case "about":
      return <AboutView />;
    case "contact":
      return <ContactView />;
    case "help":
      return <HelpView onOpenChat={props.onOpenChat} />;
    default:
      return <HomeView {...props} />;
  }
}
