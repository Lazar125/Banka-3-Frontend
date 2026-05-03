import { useEffect, useState } from "react";
import { getUserCards, getUserAccounts, requestCard } from "../services/CardService";
import CardsList from "../components/cards/CardsList";
import CreateCardForm from "../components/cards/CreateCardForm";
import TotpModal from "../components/TotpModal.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import "./CardsPage.css";

function CardsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [cards, setCards] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("list");
  const [message, setMessage] = useState("");
  const [showTotp, setShowTotp] = useState(false);
  const [totpError, setTotpError] = useState("");
  const [pendingCardData, setPendingCardData] = useState(null);

  const role = sessionStorage.getItem("userRole");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");

    if (tab === "create" && role === "client") {
      setActiveTab("create");
    } else {
      setActiveTab("list");
    }
  }, [location.search, role]);

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");

    if (!token) {
      navigate("/login");
      return;
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [cardsData, accountsData] = await Promise.all([
        getUserCards(),
        getUserAccounts()
      ]);

      setCards(cardsData);
      setAccounts(accountsData);
    } catch (error) {
      setMessage("Greška pri učitavanju: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCardRequest = (cardData) => {
    setPendingCardData(cardData);
    setTotpError("");
    setShowTotp(true);
  };

  const handleTotpConfirm = async (code) => {
    try {
      await requestCard(pendingCardData, code);

      setShowTotp(false);
      setPendingCardData(null);
      setMessage("Kartica uspešno kreirana!");

      navigate("/cards", { replace: true });
      await loadData();

      setTimeout(() => setMessage(""), 3000);

    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || "";
      if (msg.toLowerCase().includes("totp") || error.response?.status === 401) {
        setTotpError("Neispravan TOTP kod. Pokušajte ponovo.");
      } else {
        setShowTotp(false);
        setMessage("Greška: " + error.message);
      }
    }
  };

  const handleCardBlocked = (cardId, newStatus) => {
    const status = newStatus || "Blokirana";
    setCards(prev =>
      prev.map(card =>
        card.id === cardId ? { ...card, status } : card
      )
    );

    setMessage(status === "Aktivna" ? "Kartica odblokirana" : "Kartica blokirana");
    setTimeout(() => setMessage(""), 3000);
  };

  if (loading) {
    return <div className="loading">Učitavanje...</div>;
  }

  return (
    <div className="cards-page">
      <Sidebar />

      <div className="cards-container">
        <h1>
          {activeTab === "list"
            ? (role === "employee" ? "Sve kartice" : "Moje kartice")
            : "Zahtev za karticu"}
        </h1>

        {message && (
          <div className="message success">{message}</div>
        )}

        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === "list" ? "active" : ""}`}
            onClick={() => navigate("/cards")}
          >
            Sve kartice ({cards.length})
          </button>

          {role === "client" && (
            <button
              className={`tab-btn ${activeTab === "create" ? "active" : ""}`}
              onClick={() => navigate("/cards?tab=create")}
            >
              Zatraži karticu
            </button>
          )}
        </div>

        {activeTab === "list" && (
          <CardsList
            cards={cards}
            accounts={accounts}
            onCardBlocked={handleCardBlocked}
          />
        )}

        {activeTab === "create" && role === "client" && (
          <CreateCardForm
            accounts={accounts}
            onSubmit={handleCardRequest}
          />
        )}
      </div>

      {showTotp && (
        <TotpModal
          onConfirm={handleTotpConfirm}
          onCancel={() => { setShowTotp(false); setPendingCardData(null); }}
          error={totpError}
        />
      )}
    </div>
  );
}

export default CardsPage;
