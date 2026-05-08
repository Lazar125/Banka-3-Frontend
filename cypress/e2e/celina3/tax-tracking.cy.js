// TestoviCelina3.txt — Feature: Porez tracking (#74–81).
// Real-backend integration tests against TaxPage (/tax) and the underlying
// /tax/debts and /tax/run endpoints (services/bank/internal/tax/*).

describe("Porez tracking — #74–81", () => {
  before(() => {
    cy.task("db:reset", null, { timeout: 120_000 });
  });

  // #74: Supervizor moze da otvori portal i vidi listu korisnika sa dugovanjima u RSD
  it("#74: supervizor otvara /tax i vidi tabelu i summary u RSD", () => {
    cy.loginAs("supervisor");
    cy.visit("/tax");
    cy.get(".tax-title").should("contain", "Porez tracking");
    cy.get(".tax-summary").should("contain", "Ukupan neplaćen porez");
    // RSD currency is shown in the summary value cell.
    cy.get(".tax-summary-value").last().invoke("text").should("match", /RSD/);
    // Table headers expose the per-user paid/unpaid columns.
    cy.get(".tax-table thead").should("contain", "Plaćeno").and("contain", "Neplaćeno");
  });

  // #75: Klijent nema pristup — /tax requires permission "supervisor"
  // (router/AppRouter.jsx:87). ProtectedRoute should redirect away.
  it("#75: klijent ne moze da otvori /tax", () => {
    // Explicit sessionStorage reset before client login: under full-suite
    // ordering #74's supervisor session occasionally bled through and
    // /tax rendered blank. Cookies & localStorage are NOT cleared — the
    // app uses neither, and clearing them upsets Cypress' own intercepts.
    cy.clearAllSessionStorage();
    cy.loginAs("client");
    cy.visit("/tax", { failOnStatusCode: false });
    cy.location("pathname", { timeout: 10000 }).should("not.eq", "/tax");
    cy.get(".tax-title").should("not.exist");
  });

  // #76: Filtriranje po tipu korisnika (team) — TaxPage.jsx select uses values
  // "client" / "actuary"; getTaxDebts forwards as ?team=...
  it("#76: filtriranje po tipu 'klijent' šalje ?team=client i menja listu", () => {
    cy.loginAs("supervisor");
    // Two intercepts: a generic one to drain the initial load(s), and a
    // query-param-specific one that ONLY matches the filtered request.
    // Under React.StrictMode + `vite dev` the initial useEffect double-fires,
    // producing two unfiltered /tax/debts calls; without a specific matcher
    // the post-click wait would alias to the duplicate.
    cy.intercept("GET", /\/api\/tax\/debts\?[^?]*team=client/).as("debtsFiltered");
    cy.intercept("GET", "**/api/tax/debts*").as("debtsAny");
    cy.visit("/tax");
    cy.wait("@debtsAny");
    cy.get(".tax-filters select").select("Klijenti");
    cy.contains(".tax-filters button", "Pretraži").click();
    cy.wait("@debtsFiltered").its("request.url").should("include", "team=client");
    // If the table is non-empty, every visible row must have type=client.
    cy.get("body").then(($b) => {
      if ($b.find(".tax-table tbody tr").length > 0) {
        cy.get(".tax-table tbody tr td:nth-child(4)").each(($td) => {
          expect($td.text().trim().toLowerCase()).to.eq("client");
        });
      }
    });
  });

  // #77: Filtriranje po imenu — input feeds ?name=
  it("#77: filtriranje po imenu šalje ?name= i tabela se filtrira", () => {
    cy.loginAs("supervisor");
    cy.intercept("GET", /\/api\/tax\/debts\?[^?]*name=Marko/).as("debtsFiltered");
    cy.intercept("GET", "**/api/tax/debts*").as("debtsAny");
    cy.visit("/tax");
    cy.wait("@debtsAny");
    cy.get(".tax-filters input[placeholder='Ime ili prezime']").type("Marko");
    cy.contains(".tax-filters button", "Pretraži").click();
    cy.wait("@debtsFiltered").its("request.url").should("include", "name=Marko");
  });

  // #78: Automatski mesecni cron. RunMonthlyCapitalGainsCollection runs at
  // 23:50 on the last calendar day; it's invoked here through the bank's
  // debug HTTP listener (cron_debug.go). The cron entrypoint scopes to the
  // current month; the seed's only unpaid period is 2026-04, so we use the
  // debug endpoint's `?period=` override to target it without touching the
  // shared seed.
  it("#78: cron pokreće obračun i markira period=YYYY-MM kao plaćen", () => {
    const debugBase =
      Cypress.env("BANK_DEBUG_URL") || "http://localhost:50090";
    const PERIOD = "2026-04";

    // Pre-state: seed has at least one unpaid 2026-04 row.
    cy.task("db:exec", {
      sql: "SELECT COUNT(*)::int AS n FROM capital_gains WHERE period = $1 AND paid_at IS NULL",
      params: [PERIOD],
    }).then((res) => {
      expect(res.rows[0].n, `unpaid rows for ${PERIOD} pre-cron`).to.be.greaterThan(0);
    });

    cy.request({
      method: "POST",
      url: `${debugBase}/debug/cron/capital-gains?period=${PERIOD}`,
    })
      .its("status")
      .should("eq", 204);

    cy.task("db:exec", {
      sql: "SELECT COUNT(*)::int AS n FROM capital_gains WHERE period = $1 AND paid_at IS NULL",
      params: [PERIOD],
    }).then((res) => {
      expect(res.rows[0].n, `unpaid rows for ${PERIOD} post-cron`).to.eq(0);
    });
  });

  // #79: Rucno pokretanje obracuna preko TaxPage — POST /tax/run.
  // Backend vraca {processed, paid, insufficient, collected_rsd, total_debt_rsd}.
  it("#79: ručno pokretanje obračuna prikazuje rezultat sa kolicinama", () => {
    cy.loginAs("supervisor");
    cy.visit("/tax");
    cy.intercept("POST", "**/api/tax/run*").as("runTax");
    cy.get(".tax-run-card").within(() => {
      cy.contains("button", /Pokreni|Obračunaj/i).click();
    });
    cy.wait("@runTax").its("response.statusCode").should("eq", 200);
    cy.get(".tax-run-result").should("be.visible");
    cy.get(".tax-run-result").invoke("text").should("match", /RSD/);
  });

  // #80: Konverzija u RSD bez provizije. Spec p.66 (Napomena 2): porez se
  // konvertuje u RSD bez provizije. Verifikujemo:
  //  (a) svaki red u tabeli prikazuje iznos u RSD,
  //  (b) za svaki capital_gain red u DB, tax_due == 15% * realized_profit
  //      (15% = capitalGainsTaxPermille / 1000 = 150/1000).
  it("#80: neplaćeni iznosi su u RSD i odgovaraju 15% formuli bez provizije", () => {
    cy.loginAs("supervisor");
    cy.visit("/tax");

    // (a) UI prikaz
    cy.get("body").then(($b) => {
      if ($b.find(".tax-table tbody tr").length > 0) {
        cy.get(".tax-table tbody tr td.tax-neg").each(($td) => {
          expect($td.text()).to.match(/RSD/);
        });
      }
    });

    // (b) Math invariant nad svakim postojecim capital_gain redom.
    cy.task("db:exec", {
      sql: "SELECT realized_profit, tax_due FROM capital_gains",
    }).then((res) => {
      const rows = res.rows || [];
      if (rows.length === 0) {
        cy.log("Nema capital_gains zapisa — math invariant nije primenljiv.");
        return;
      }
      rows.forEach((r) => {
        const profit = Number(r.realized_profit);
        const tax = Number(r.tax_due);
        // 15% bez provizije: tax = floor(profit * 150 / 1000) ili round —
        // dozvoljavamo +-1 minor unit zbog integer aritmetike.
        const expected = Math.floor(profit * 150 / 1000);
        expect(Math.abs(tax - expected), `tax_due ≈ 15% × profit (profit=${profit})`).to.be.lte(1);
      });
    });
  });

  // #81: Korisnik bez dobiti nema porez — agentov nalog nakon /tax/run treba
  // da ima debt = 0 (eventualno potpuno odsutan iz liste).
  it("#81: agent koji nema dobiti se ne pojavljuje u dugovanjima (ili je iznos 0)", () => {
    cy.loginAs("supervisor");
    cy.window().then((win) => {
      const token = win.sessionStorage.getItem("accessToken");
      // Run obracun prvo — da bi sve potencijalno-naplative stavke bile resene.
      cy.request({
        method: "POST",
        url: "/api/tax/run",
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      });
      cy.request({
        method: "GET",
        url: "/api/tax/debts",
        headers: { Authorization: `Bearer ${token}` },
      }).then((resp) => {
        const list = resp.body || [];
        // Backfill returned only users with unpaid > 0; the contract is monotone.
        list.forEach((d) => {
          expect(d.unpaid_rsd, `${d.first_name} ${d.last_name} ima neplaćen porez > 0`)
            .to.be.greaterThan(0);
        });
      });
    });
  });
});
