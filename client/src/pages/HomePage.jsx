import { Link } from "react-router-dom";
import { FeatureCard } from "../components/FeatureCard";
import { SignalMeter } from "../components/SignalMeter";

export function HomePage({ settings }) {
  const missionDays = [
    {
      day: "Day 1",
      title: "The Signal Begins",
      body: "Decode the first transmission, follow the light trail, and lock down the Safe Zone."
    },
    {
      day: "Day 2",
      title: "Into the Other Side",
      body: "Rebuild the antenna grid, descend into the lab, and seal unstable fractures."
    },
    {
      day: "Day 3",
      title: "The Mind Flayer Day",
      body: "Keep discipline under pressure while the breach tests every crew's loyalty."
    },
    {
      day: "Day 4",
      title: "Close the Gate",
      body: "Deliver the final declaration, stabilize the camp, and bring everyone home."
    }
  ];

  const crewRoles = [
    "Signalers reconnect broken channels and decode transmissions.",
    "Lanterns carry courage into the darkest missions.",
    "Gatekeepers hold the line around the breach perimeter.",
    "Trackers read patterns others miss and uncover the hidden trail."
  ];

  return (
    <section className="stack home-stack">
      <article className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Classified Summer Operation</p>
          <div className="signal-stamp">1986 // HAVENWOOD</div>
          <h2>{settings.campTitle}</h2>
          <h3>{settings.subtitle}</h3>
          <p className="hero-summary">{settings.backstory}</p>
          <div className="button-row">
            <Link className="button" to="/crew-access">Enter as Crew</Link>
            <Link className="button secondary" to="/rules">Camp Rules</Link>
            <Link className="button danger" to="/leader-login">Leader Access</Link>
          </div>
        </div>

        <aside className="hero-console panel">
          <div className="console-header">
            <span>GATE MONITOR</span>
            <span>CHANNEL 11</span>
          </div>
          <div className="gate-banner">
            <span>Current Overall Gate Status</span>
            <strong>{settings.overallGateStatus}</strong>
          </div>
          <div className="meter-stack">
            <SignalMeter label="Signal Integrity" value={78} tone="cyan" />
            <SignalMeter label="Shadow Pressure" value={43} tone="red" />
            <SignalMeter label="Camp Readiness" value={91} tone="blue" />
          </div>
          <div className="transmission-box">
            <span>Live Transmission</span>
            <strong>Safe Zone synced. Awaiting crew deployment.</strong>
          </div>
        </aside>
      </article>

      <section className="home-grid">
        <article className="panel marquee-panel">
          <p className="eyebrow">Mission Brief</p>
          <h3>Why This Camp Feels Different</h3>
          <p>
            Havenwood Mission Control is built like a field console, not a brochure.
            Crews can move fast on phones, leaders can manage scores in one place,
            and the whole camp gets a cinematic mystery wrapper.
          </p>
          <div className="marquee-strip">
            <span>Decode clues</span>
            <span>Manage crews</span>
            <span>Track the Gate</span>
            <span>Print final awards</span>
          </div>
        </article>

        <article className="panel archive-panel">
          <p className="eyebrow">Crew Specialties</p>
          <h3>Four Teams. Four Roles.</h3>
          <div className="crew-role-list">
            {crewRoles.map((role) => (
              <div key={role} className="crew-role-item">
                <span className="crew-role-dot" />
                <p>{role}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="feature-grid">
        <FeatureCard
          eyebrow="Crew Flow"
          title="Fast Mobile Access"
          body="Enter with a code, check active missions, submit answers, and read the latest transmission without extra taps."
          accent="blue"
        />
        <FeatureCard
          eyebrow="Leader Tools"
          title="Scoreboard With Control"
          body="Adjust Light Tokens, Shadow Marks, recovery bonuses, and notes from a dashboard that feels like a mission console."
          accent="red"
        />
        <FeatureCard
          eyebrow="Camp Finale"
          title="Awards Ready"
          body="Standings, best member, most improved, exportable JSON, and a print-friendly final report are built in."
          accent="cyan"
        />
      </section>

      <article className="panel timeline-panel">
        <div className="split-header">
          <div>
            <p className="eyebrow">4-Day Arc</p>
            <h3>Operation Timeline</h3>
          </div>
          <span className="status-pill active">Live Campaign</span>
        </div>
        <div className="timeline-grid">
          {missionDays.map((item) => (
            <div key={item.day} className="timeline-card">
              <span>{item.day}</span>
              <h4>{item.title}</h4>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
