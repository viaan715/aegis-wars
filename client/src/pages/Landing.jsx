import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import TemperProgress from '../components/TemperProgress.jsx';
import { useRandomTextColors } from '../lib/randomTextColors.js';
import './Landing.css';

const FEATURES = [
  {
    title: 'Build in minutes',
    body: 'Short answer, choice, rating, date, file upload — drop in the question types you need and reorder freely.',
  },
  {
    title: 'A fill experience people finish',
    body: 'One question at a time, with a progress bar that visibly heats up as respondents get closer to done.',
  },
  {
    title: 'Read the results, not just the rows',
    body: 'Per-question charts, response counts, and a one-click CSV export for the spreadsheet you already have.',
  },
];

export default function Landing() {
  const { token } = useAuth();
  const [heat, setHeat] = useState(0);
  const rootRef = useRandomTextColors();

  useEffect(() => {
    const id = setInterval(() => setHeat((h) => (h >= 100 ? 0 : h + 2)), 60);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="landing" ref={rootRef}>
      <header className="landing-nav">
        <div className="container landing-nav-inner">
          <span className="landing-brand">FormForge</span>
          <nav className="landing-nav-links">
            {token ? (
              <Link to="/dashboard" className="btn btn-primary btn-sm">
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">
                  Sign in
                </Link>
                <Link to="/signup" className="btn btn-primary btn-sm">
                  Start free
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="hero container">
        <p className="eyebrow tag-mono">FORM &amp; SURVEY BUILDER</p>
        <h1 className="display-heading hero-title">
          Raw questions,
          <br />
          forged into forms.
        </h1>
        <p className="hero-sub">
          FormForge turns a rough list of questions into a structured survey your audience actually finishes —
          then shows you what they said.
        </p>
        <div className="hero-actions">
          <Link to={token ? '/dashboard' : '/signup'} className="btn btn-primary">
            {token ? 'Go to dashboard' : 'Build your first form — free'}
          </Link>
          <Link to="/login" className="btn btn-secondary">
            Sign in
          </Link>
        </div>

        <div className="hero-demo card">
          <div className="spread hero-demo-header">
            <span className="tag-mono">QUESTION 3 OF 6</span>
            <span className="tag-mono">{heat}% TEMPERED</span>
          </div>
          <TemperProgress percent={heat} />
          <p className="hero-demo-question">How likely are you to recommend us to a colleague?</p>
          <div className="hero-demo-scale">
            {Array.from({ length: 11 }, (_, i) => (
              <span key={i} className="hero-demo-scale-item">
                {i}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="container features">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature-card card">
            <h2>{f.title}</h2>
            <p className="muted">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="landing-footer container">
        <span className="muted tag-mono">FORMFORGE</span>
        <span className="muted">Built for teams who ask questions for a living.</span>
      </footer>
    </div>
  );
}
