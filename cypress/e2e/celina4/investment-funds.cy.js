// Scenariji #31, #32 — Detaljan prikaz investicionog fonda (task #225).
// Scenariji #38–39 (kreiranje fonda) su u tasku #227 — nisu ovde.
// Scenariji #29–30 (discovery lista) su u tasku #223 — nisu ovde.
// Učitavanje fonda je u mock modu (USE_MOCK = true u investmentFundService.js).

const DETAIL_PAGE   = "/investment-funds/1";
const SUPERVISOR_EMAIL = "supervisor@banka.raf";

describe("Investicioni fondovi — detaljan prikaz (#31, #32)", () => {

  // #31: Klijent otvara detaljan prikaz fonda
  // (direktna navigacija, discovery stranica je u tasku #223)
  it("#31: detaljan prikaz sadrži naziv, opis, menadžera, finansijske podatke, hartije i grafikon", () => {
    cy.loginAs("client");
    cy.visit(DETAIL_PAGE);

    // Then: naziv fonda je vidljiv
    cy.contains("h1", "Alpha Growth Fund", { timeout: 8000 }).should("be.visible");

    // And: opis fonda je vidljiv (u headeru)
    cy.get(".create-subtitle").should("not.be.empty");

    // And: sve 4 stat kartice su prisutne
    cy.contains(".ifd-stat-label", "Vrednost fonda").should("exist");
    cy.contains(".ifd-stat-label", "Likvidnost").should("exist");
    cy.contains(".ifd-stat-label", "Profit").should("exist");
    cy.contains(".ifd-stat-label", "Min. ulog").should("exist");

    // And: menadžer i broj računa su prikazani u info gridu
    cy.contains(".ifd-field-label", "Menadžer").should("exist");
    cy.contains(".ifd-field-label", "Broj računa").should("exist");
    cy.get(".ifd-field-value").should("contain", SUPERVISOR_EMAIL);

    // And: lista hartija sa svim obaveznim kolonama
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

    // And: grafikon performansi je vidljiv sa period tabovima
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

    // When: vidi listu hartija
    cy.get(".ifd-table tbody tr", { timeout: 8000 }).should("have.length.greaterThan", 0);

    // Then: pored svake hartije postoji dugme za prodaju
    cy.get(".ifd-table tbody tr").each(($row) => {
      cy.wrap($row).find(".ifd-sell-btn").should("exist").and("contain", "Prodaj");
    });
  });

});
