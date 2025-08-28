import { useState } from "react";
import InitStore from "./components/InitStore";
import HasStore from "./components/HasStore";
import CreateProposal from "./components/CreateProposal";
import ProposalCount from "./components/ProposalCount";
import CloseProposal from "./components/CloseProposal";
import Vote from "./components/Vote";
import GetVotes from "./components/GetVotes";
import HeaderStatus from "./components/HeaderStatus";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState<
    "signer" | "viewer" | "voter" | "results"
  >("signer");

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand__dot" />
          Voting dApp
        </div>

        <HeaderStatus />

        <nav className="tabs" aria-label="Primary">
          <button
            className={activeTab === "signer" ? "tab active" : "tab"}
            onClick={() => setActiveTab("signer")}
            type="button"
          >
            Signer
          </button>
          <button
            className={activeTab === "viewer" ? "tab active" : "tab"}
            onClick={() => setActiveTab("viewer")}
            type="button"
          >
            Viewer
          </button>
          <button
            className={activeTab === "voter" ? "tab active" : "tab"}
            onClick={() => setActiveTab("voter")}
            type="button"
          >
            Voter
          </button>
          <button
            className={activeTab === "results" ? "tab active" : "tab"}
            onClick={() => setActiveTab("results")}
            type="button"
          >
            Results
          </button>
        </nav>
      </header>

      <main className="content">
        {activeTab === "signer" && (
          <section className="grid-2" aria-label="Signer actions">
            <div className="card">
              <h2 className="card__title">Create a Store</h2>
              <p className="card__hint">
                Initializes your on-chain <code>VotingStore</code> with your
                admin account.
              </p>
              <div className="card__body">
                <InitStore />
              </div>
            </div>

            <div className="card">
              <h2 className="card__title">New Proposal</h2>
              <p className="card__hint">
                Calls <code>create_proposal(question, options)</code>.
              </p>
              <div className="card__body">
                <CreateProposal />
              </div>
            </div>

            <div className="card">
              <h2 className="card__title">Close Proposal</h2>
              <p className="card__hint">
                Calls <code>close_proposal(proposal_id)</code>. Only the creator
                can close.
              </p>
              <div className="card__body">
                <CloseProposal />
              </div>
            </div>
          </section>
        )}

        {activeTab === "viewer" && (
          <section className="grid-2" aria-label="Viewer tools">
            <div className="card">
              <h2 className="card__title">Check Store</h2>
              <p className="card__hint">
                View <code>has_store(address)</code>.
              </p>
              <div className="card__body">
                <HasStore />
              </div>
            </div>

            <div className="card">
              <h2 className="card__title">Proposal Count</h2>
              <p className="card__hint">
                View <code>get_proposal_count(owner)</code>.
              </p>
              <div className="card__body">
                <ProposalCount />
              </div>
            </div>
          </section>
        )}

        {activeTab === "voter" && (
          <section className="grid-1" aria-label="Voter actions">
            <div className="card">
              <h2 className="card__title">Cast Vote</h2>
              <p className="card__hint">
                Calls <code>vote(owner, proposal_id, choices)</code>.
                Multi-select supported.
              </p>
              <div className="card__body">
                <Vote />
              </div>
            </div>
          </section>
        )}

        {activeTab === "results" && (
          <section className="grid-1" aria-label="Results">
            <GetVotes />
          </section>
        )}
      </main>

      <footer className="footer">
        <div className="footer__text">
          Built with Supra TypeScript SDK & Move • Demo UI for
          education/testing.
        </div>
      </footer>
    </div>
  );
}
