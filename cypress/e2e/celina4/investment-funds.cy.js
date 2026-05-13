// Scenariji #31, #32 — Detaljan prikaz investicionog fonda (task #225).
  // Scenariji #38–39 — Kreiranje investicionog fonda (task #227).
  // Scenariji #29–30 (discovery lista) su u tasku #223 — nisu ovde.
  // Učitavanje fonda je u mock modu (USE_MOCK = true u 
  investmentFundService.js).
  //
  // Napomena uz #38 — "fond postaje dostupan na discovery stranici":
  // Discovery stranica nije još implementirana (backend endpoint /investment-funds
  // ne postoji u ovoj fazi). Ovaj korak scenarija biće pokriven kada backend
  // isporuči endpoint i discovery stranicu. Preostali koraci (#38) su potpuno
  // pokriveni.

  const DETAIL_PAGE = "/investment-funds/1";
  const PAGE = "/investment-funds/create";
  const SUPERVISOR_EMAIL = "supervisor@banka.raf";

  describe("Investicioni fondovi — detaljan prikaz (#31, #32)", () => {

    // #31: Klijent otvara detaljan prikaz fonda
    it("#31: detaljan prikaz sadrži naziv, opis, menadžera, finansijske podatke,
   hartije i grafikon", () => {
      cy.loginAs("client");
      cy.visit(DETAIL_PAGE);
  
      cy.contains("h1", "Alpha Growth Fund", { timeout: 8000
  }).should("be.visible");

      cy.get(".create-subtitle").should("not.be.empty");

      cy.contains(".ifd-stat-label", "Vrednost fonda").should("exist");
      cy.contains(".ifd-stat-label", "Likvidnost").should("exist");
      cy.contains(".ifd-stat-label", "Profit").should("exist");
      cy.contains(".ifd-stat-label", "Min. ulog").should("exist");

      cy.contains(".ifd-field-label", "Menadžer").should("exist");
      cy.contains(".ifd-field-label", "Broj računa").should("exist");
      cy.get(".ifd-field-value").should("contain", SUPERVISOR_EMAIL);

      cy.get(".ifd-table", { timeout: 8000 }).should("be.visible");
      cy.get(".ifd-table thead").within(() => {
        cy.contains("th", "Ticker").should("exist");
        cy.contains("th", "Cena").should("exist");
        cy.contains("th", "Promena").should("exist");
        cy.contains("th", "Obim").should("exist");
        cy.contains("th", "Init. Margin").should("exist");
        cy.contains("th", "Datum nabavke").should("exist");
      });
      cy.get(".ifd-table tbody tr").should("have.length.greaterThan", 0);
      cy.get(".ifd-ticker").first().should("not.be.empty");

      cy.get(".ifd-chart-card").should("be.visible");
      cy.get(".ifd-period-tabs").within(() => {
        cy.contains("button", "Mesečno").should("exist");
        cy.contains("button", "Kvartalno").should("exist");
        cy.contains("button", "Godišnje").should("exist");
      });
    });
  
    // #32: Supervizor vidi dugme za prodaju pored svake hartije
    it("#32: supervizor vidi dugme Prodaj pored svake hartije u fondu", () => {
      cy.loginAs("supervisor");
      cy.visit(DETAIL_PAGE);

      cy.get(".ifd-table tbody tr", { timeout: 8000
  }).should("have.length.greaterThan", 0);

      cy.get(".ifd-table tbody tr").each(($row) => {
        cy.wrap($row).find(".ifd-sell-btn").should("exist").and("contain",
  "Prodaj");
      });
    });
  
  });

  describe("Investicioni fondovi — #38–39", () => {

    // #38: Supervizor uspešno kreira novi investicioni fond.
    it("#38: supervizor unosi podatke i kreira fond — success view prikazuje 
  generisane podatke i menadžera", () => {
      cy.loginAs("supervisor");
      cy.visit(PAGE);
  
      cy.contains("h1", "Novi investicioni fond").should("be.visible");

      cy.get(".fund-manager-input")
        .should("have.value", SUPERVISOR_EMAIL)
        .and("have.attr", "readonly");

      cy.get("#name").type("Alpha Growth Fund");
      cy.get("#strategyDescription").type(
        "Strategija fokusirana na rast vrednosti akcija u tehnološkom sektoru 
  kroz dugoročna ulaganja."
      );
      cy.get("#minimumInvestment").type("5000");
  
      cy.contains("button", "Kreiraj fond").click();

      cy.contains("h1", "Fond uspešno kreiran", { timeout: 5000
  }).should("be.visible");

      cy.get(".fund-success-overview h2").should("have.text", "Alpha Growth 
  Fund");

      cy.get(".fund-success-overview > div > p")
        .invoke("text")
        .should("match", /^IF-\d{4}-\d{6}$/);

      cy.get(".fund-fields-grid .fund-field-value")
        .should("contain", SUPERVISOR_EMAIL);

      cy.get(".status-badge.is-active").should("contain", "Aktivan");
    });

    // #39: Agent nema pristup stranici za kreiranje fonda.
    it("#39: agent dobija odbijen pristup — ProtectedRoute preusmerava na
  /securities", () => {
      cy.loginAs("agent");
      cy.visit(PAGE, { failOnStatusCode: false });

      cy.url({ timeout: 5000 }).should("not.include", "/investment-funds");
  
      cy.contains("h1", "Novi investicioni fond").should("not.exist");
    });

  });
