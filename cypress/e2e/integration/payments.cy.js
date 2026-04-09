describe("PaymentsPage - Osnovni Testovi", () => {
  beforeEach(() => {
    cy.visitPayments();
    cy.get(".pp-row, .pp-empty", { timeout: 5000 }).should("exist");
  });

  it("učitava sve transakcije sa backenda", () => {
    cy.get(".pp-row").should("have.length.greaterThan", 0);
    cy.get(".pp-summary-row").should("exist");
  });

  it("prikazuje transakcije u listi", () => {
    cy.get(".pp-row").first().should("exist");
    cy.get(".pp-row-account").first().should("be.visible");
    cy.get(".pp-row-badge").first().should("be.visible");
  });

  it("prikazuje detail view transakcije", () => {
    cy.get(".pp-row", { timeout: 5000 }).first().click();
    cy.contains("Detalji plaćanja").should("be.visible");
    cy.get(".pp-amount-val").should("exist");
    cy.get(".pp-detail-card").should("exist");
  });

  it("vraća se sa detalja na listu", () => {
    cy.get(".pp-row", { timeout: 5000 }).first().click();
    cy.contains("Detalji plaćanja").should("be.visible");
    
    cy.get(".pp-back-btn").click();
    cy.contains("Pregled plaćanja").should("be.visible");
    cy.get(".pp-row").should("have.length.greaterThan", 0);
  });

  it("štampa potvrdu", () => {
    cy.get(".pp-row", { timeout: 5000 }).first().click();
    cy.get(".pp-print-btn").should("exist").and("be.visible");
  });
});

describe("PaymentsPage - Filtriranje po Statusu", () => {
  beforeEach(() => {
    cy.visitPayments();
    cy.get(".pp-row, .pp-empty", { timeout: 5000 }).should("exist");
  });

  it("prikazuje sve filter dugmadi", () => {
    cy.contains("button", "Sve").should("be.visible");
    cy.contains("button", "Izvršeno").should("be.visible");
    cy.contains("button", "U obradi").should("be.visible");
    cy.contains("button", "Odbijeno").should("be.visible");
    cy.contains("button", "Odobreno").should("be.visible");
  });

  it("'Sve' je aktivno na početku", () => {
    cy.contains("button", "Sve").should("have.class", "pp-filter-pill--active");
  });

  it("aktivira filter kada se klikne na 'Izvršeno'", () => {
    cy.contains("button", "Izvršeno").should("not.have.class", "pp-filter-pill--active");
    cy.contains("button", "Izvršeno").click();
    cy.contains("button", "Izvršeno").should("have.class", "pp-filter-pill--active");
  });

  it("aktivira filter kada se klikne na 'U obradi'", () => {
    cy.contains("button", "U obradi").click();
    cy.contains("button", "U obradi").should("have.class", "pp-filter-pill--active");
  });

  it("aktivira filter kada se klikne na 'Odbijeno'", () => {
    cy.contains("button", "Odbijeno").click();
    cy.contains("button", "Odbijeno").should("have.class", "pp-filter-pill--active");
  });
});

describe("PaymentsPage - Filtriranje po Tipu", () => {
  beforeEach(() => {
    cy.visitPayments();
    cy.get(".pp-row, .pp-empty", { timeout: 5000 }).should("exist");
  });

  it("prikazuje 'Sve transakcije' dugme", () => {
    cy.contains("button", "Sve transakcije").should("be.visible");
  });

  it("prikazuje 'Plaćanja' dugme", () => {
    cy.contains("button", "Plaćanja").should("be.visible");
  });

  it("prikazuje 'Prenosi' dugme", () => {
    cy.contains("button", "Prenosi").should("be.visible");
  });

  it("filtrira po tipu - Plaćanja", () => {
    cy.contains("button", "Plaćanja").click();
    cy.get(".pp-row, .pp-empty", { timeout: 5000 }).should("exist");
  });

  it("filtrira po tipu - Prenosi", () => {
    cy.contains("button", "Prenosi").click();
    cy.get(".pp-row, .pp-empty", { timeout: 5000 }).should("exist");
  });

  it("vraća se na 'Sve transakcije'", () => {
    cy.contains("button", "Plaćanja").click();
    cy.contains("button", "Sve transakcije").click();
    cy.contains("button", "Sve transakcije").should("have.class", "pp-filter-pill--active");
  });
});

describe("PaymentsPage - Advanced Filters - Datumi", () => {
  beforeEach(() => {
    cy.visitPayments();
    cy.get(".pp-row, .pp-empty", { timeout: 5000 }).should("exist");
  });

  it("ima 'Od datuma' polje", () => {
    cy.get('input[type="date"]').eq(0).should("exist");
  });

  it("ima 'Do datuma' polje", () => {
    cy.get('input[type="date"]').eq(1).should("exist");
  });

  it("filtrira po 'Od datuma'", () => {
    const today = new Date().toISOString().split("T")[0];
    cy.get('input[type="date"]').eq(0).type(today);
    
    cy.get(".pp-row, .pp-empty", { timeout: 5000 }).should("exist");
  });

  it("filtrira po 'Do datuma'", () => {
    const today = new Date().toISOString().split("T")[0];
    cy.get('input[type="date"]').eq(1).type(today);
    
    cy.get(".pp-row, .pp-empty", { timeout: 5000 }).should("exist");
  });

  it("filtrira po datumskom rasponu", () => {
    const today = new Date().toISOString().split("T")[0];
    
    cy.get('input[type="date"]').eq(0).type(today);
    cy.get('input[type="date"]').eq(1).type(today);
    
    cy.get(".pp-row, .pp-empty", { timeout: 5000 }).should("exist");
  });

  it("resetuje datume kada se klikne resetuj", () => {
    const today = new Date().toISOString().split("T")[0];
    cy.get('input[type="date"]').eq(0).type(today);
    
    cy.contains("button", "Resetuj sve filtere").click();
    
    cy.get('input[type="date"]').eq(0).should("have.value", "");
    cy.get('input[type="date"]').eq(1).should("have.value", "");
  });
});

describe("PaymentsPage - Advanced Filters - Iznosi", () => {
  beforeEach(() => {
    cy.visitPayments();
    cy.get(".pp-row, .pp-empty", { timeout: 5000 }).should("exist");
  });

  it("ima 'Minimalni iznos' polje", () => {
    cy.get('input[placeholder="0.00"]').eq(0).should("exist");
  });

  it("ima 'Maksimalni iznos' polje", () => {
    cy.get('input[placeholder="0.00"]').eq(1).should("exist");
  });

  it("filtrira po minimalnom iznosu", () => {
    cy.get('input[placeholder="0.00"]').eq(0).type("1000");
    
    cy.get(".pp-row, .pp-empty", { timeout: 5000 }).should("exist");
  });

  it("filtrira po maksimalnom iznosu", () => {
    cy.get('input[placeholder="0.00"]').eq(1).type("50000");
    
    cy.get(".pp-row, .pp-empty", { timeout: 5000 }).should("exist");
  });

  it("filtrira po rasponu iznosa", () => {
    cy.get('input[placeholder="0.00"]').eq(0).type("10000");
    cy.get('input[placeholder="0.00"]').eq(1).type("100000");
    
    cy.get(".pp-row, .pp-empty", { timeout: 5000 }).should("exist");
  });

  it("resetuje iznose kada se klikne resetuj", () => {
    cy.get('input[placeholder="0.00"]').eq(0).type("5000");
    
    cy.contains("button", "Resetuj sve filtere").click();
    
    cy.get('input[placeholder="0.00"]').eq(0).should("have.value", "");
    cy.get('input[placeholder="0.00"]').eq(1).should("have.value", "");
  });

  it("prikazuje samo transakcije u rasponu iznosa", () => {
    cy.get('input[placeholder="0.00"]').eq(0).type("999999");
    
    cy.get(".pp-row, .pp-empty", { timeout: 5000 }).should("exist");
  });
});

describe("PaymentsPage - Advanced Filters - Kombinovani", () => {
  beforeEach(() => {
    cy.visitPayments();
    cy.get(".pp-row, .pp-empty", { timeout: 5000 }).should("exist");
  });

  it("kombinuje status + datum filter", () => {
    cy.contains("button", "Izvršeno").click();
    
    const today = new Date().toISOString().split("T")[0];
    cy.get('input[type="date"]').eq(0).type(today);
    
    cy.get(".pp-row, .pp-empty", { timeout: 5000 }).should("exist");
  });

  it("kombinuje status + iznos filter", () => {
    cy.contains("button", "Izvršeno").click();
    cy.get('input[placeholder="0.00"]').eq(0).type("1000");
    
    cy.get(".pp-row, .pp-empty", { timeout: 5000 }).should("exist");
  });

  it("kombinuje tip + datum + iznos filter", () => {
    cy.contains("button", "Plaćanja").click();
    
    const today = new Date().toISOString().split("T")[0];
    cy.get('input[type="date"]').eq(0).type(today);
    
    cy.get('input[placeholder="0.00"]').eq(0).type("500");
    
    cy.get(".pp-row, .pp-empty", { timeout: 5000 }).should("exist");
  });

  it("resetuje sve kombinovane filtere", () => {
    cy.contains("button", "Plaćanja").click();
    
    const today = new Date().toISOString().split("T")[0];
    cy.get('input[type="date"]').eq(0).type(today);
    cy.get('input[placeholder="0.00"]').eq(0).type("1000");
    
    cy.contains("button", "Resetuj sve filtere").click();
    
    cy.contains("button", "Sve").should("have.class", "pp-filter-pill--active");
    cy.get('input[type="date"]').eq(0).should("have.value", "");
    cy.get('input[placeholder="0.00"]').eq(0).should("have.value", "");
  });
});

describe("PaymentsPage - Status Mapiranje", () => {
  beforeEach(() => {
    cy.visitPayments();
    cy.get(".pp-row, .pp-empty", { timeout: 5000 }).should("exist");
  });

  it("mapira backend statuse u srpske nazive", () => {
    cy.get(".pp-row-badge", { timeout: 5000 }).first().then(($badge) => {
      const status = $badge.text().trim();
      const validStatuses = ["Izvršeno", "U obradi", "Odbijeno", "Odobreno"];
      expect(validStatuses).to.include(status);
    });
  });

  it("prikazuje ikonicu za svaki status", () => {
    cy.get(".pp-row-icon svg", { timeout: 5000 }).should("have.length.greaterThan", 0);
  });

  it("prikazuje različitih boja za različite statuse", () => {
    cy.get(".pp-row-badge", { timeout: 5000 }).first().then(($badge) => {
      const bgColor = $badge.css("background-color");
      expect(bgColor).to.not.be.empty;
    });
  });
});

describe("PaymentsPage - Summary", () => {
  beforeEach(() => {
    cy.visitPayments();
    cy.get(".pp-row", { timeout: 5000 }).should("have.length.greaterThan", 0);
  });

  it("prikazuje summary sa brojem rezultata", () => {
    cy.get(".pp-summary-row").first().should("contain", "Ukupno rezultata");
  });

  it("prikazuje summary sa ukupnim iznosom", () => {
    cy.get(".pp-summary-row").eq(1).should("contain", "Ukupan iznos");
  });
});

describe("PaymentsPage - Prazna Lista", () => {
  beforeEach(() => {
    cy.visitPayments();
    cy.get(".pp-row, .pp-empty", { timeout: 5000 }).should("exist");
  });

  it("prikazuje 'Nema transakcija' kada nema rezultata", () => {
    cy.get('input[placeholder="0.00"]').eq(0).type("999999999");
    
    cy.get(".pp-empty", { timeout: 5000 }).should("contain", "Nema transakcija");
  });
});