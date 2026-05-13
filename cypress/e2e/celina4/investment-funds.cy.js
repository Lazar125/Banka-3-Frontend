// Scenariji #38–39: Kreiranje investicionog fonda.
// Forma radi u mock modu (USE_MOCK = true u investmentFundService.js) —
// kreiranje ne zahteva backend endpoint, ali login i zaštita rute rade
// standardno kroz pravi backend.
//
// Napomena uz #38 — "fond postaje dostupan na discovery stranici":
// Discovery stranica nije još implementirana (backend endpoint /investment-funds
// ne postoji u ovoj fazi). Ovaj korak scenarija biće pokriven kada backend
// isporuči endpoint i discovery stranicu. Preostali koraci (#38) su potpuno
// pokriveni.

const PAGE = "/investment-funds/create";
const SUPERVISOR_EMAIL = "supervisor@banka.raf";

describe("Investicioni fondovi — #38–39", () => {
  // #38: Supervizor uspešno kreira novi investicioni fond.
  it("#38: supervizor unosi podatke i kreira fond — success view prikazuje generisane podatke i menadžera", () => {
    cy.loginAs("supervisor");
    cy.visit(PAGE);

    // Forma je dostupna supervizoru
    cy.contains("h1", "Novi investicioni fond").should("be.visible");

    // Menadžer je automatski popunjen na osnovu ulogovanog supervizora (read-only)
    cy.get(".fund-manager-input")
      .should("have.value", SUPERVISOR_EMAIL)
      .and("have.attr", "readonly");

    // When: supervizor unosi naziv fonda, opis strategije i minimalni iznos
    cy.get("#name").type("Alpha Growth Fund");
    cy.get("#strategyDescription").type(
      "Strategija fokusirana na rast vrednosti akcija u tehnološkom sektoru kroz dugoročna ulaganja."
    );
    cy.get("#minimumInvestment").type("5000");

    // When: potvrdi kreiranje
    cy.contains("button", "Kreiraj fond").click();

    // Then: sistem kreira novi investicioni fond — success view se prikazuje
    cy.contains("h1", "Fond uspešno kreiran", { timeout: 5000 }).should("be.visible");

    // And: naziv fonda je vidljiv u success prikazu
    cy.get(".fund-success-overview h2").should("have.text", "Alpha Growth Fund");

    // And: automatski kreiran dinarski račun vezan za fond (format IF-GGGG-XXXXXX)
    cy.get(".fund-success-overview > div > p")
      .invoke("text")
      .should("match", /^IF-\d{4}-\d{6}$/);

    // And: supervizor je postavljen kao menadžer fonda
    cy.get(".fund-fields-grid .fund-field-value")
      .should("contain", SUPERVISOR_EMAIL);

    // And: fond je aktivan u sistemu
    cy.get(".status-badge.is-active").should("contain", "Aktivan");

    // And: "fond postaje dostupan na discovery stranici" — blokirano,
    // videti napomenu na vrhu fajla.
  });

  // #39: Agent nema pristup stranici za kreiranje fonda.
  it("#39: agent dobija odbijen pristup — ProtectedRoute preusmerava na /securities", () => {
    cy.loginAs("agent");
    cy.visit(PAGE, { failOnStatusCode: false });

    // Then: pristup je odbijen — URL se menja (ProtectedRoute redirect)
    cy.url({ timeout: 5000 }).should("not.include", "/investment-funds");

    // And: forma za kreiranje fonda nije prikazana
    cy.contains("h1", "Novi investicioni fond").should("not.exist");
  });
});
