// TestoviCelina3.txt — Feature: Moj portfolio (#67–73).

const NASDAQ_MIC = "XNAS";
const TICKER = "MSFT";
const BANK_USD_ACCOUNT = "333000100000000420";

// PortfolioPage on main was wired to the real /api/portfolio + /api/tax/me
// endpoints in this branch. Selectors below use the .pf-* test hooks
// alongside the team's .portfolio-* visual classes.
describe("Moj portfolio — #67–73", () => {
  before(() => {
    cy.task("db:reset", null, { timeout: 120_000 });
  });

  before(() => {
    cy.loginAs("supervisor");
    cy.setExchangeOpen(NASDAQ_MIC, true);

    // Make sure agent has at least 1 MSFT in portfolio so tests have something to assert on.
    // Agent has need_approval=true, so we do BUY → approve → wait for done.
    cy.loginAs("agent");
    let orderId;
    cy.findListingByTicker(TICKER).then((l) => {
      cy.createOrderApi({
        account_number: BANK_USD_ACCOUNT,
        order_type: "market",
        direction: "buy",
        quantity: 2,
        listing_id: l.id,
      }).then((r) => {
        if (r.status >= 400) return; // limit could've been hit on retry — skip seeding then
        orderId = r.body.order_id;
        cy.loginAs("supervisor");
        cy.window().then((win) => {
          const token = win.sessionStorage.getItem("accessToken");
          cy.request({
            method: "POST",
            url: `/api/orders/${orderId}/approve`,
            headers: { Authorization: `Bearer ${token}` },
          });
        });
        // Backend scheduler ima 60s initial-delay pre nego što počne partial
        // fill-ove (orders.execution.initial-delay-seconds=60). 60s budget
        // nije dovoljan — scheduler tek startuje. 180s pokriva delay + N
        // fill-ova za male qty (2 MSFT).
        cy.waitForOrderStatus(orderId, "done", { timeoutMs: 180_000 });
      });
    });
  });

  // #67: portfolio prikazuje listu posedovanih hartija sa svim kolonama
  it("#67: portfolio tabela prikazuje sve obavezne kolone", () => {
    cy.loginAs("agent");
    cy.visit("/portfolio");

    ["Tip", "Ticker", "Količina", "Avg cena", "Trenutna", "Profit", "Modifikovano"].forEach((h) => {
      cy.get(".pf-table thead").should("contain", h);
    });
  });

  // #68: ukupan profit je suma svih profita
  it("#68: total profit je vidljiv u summary kartici", () => {
    cy.loginAs("agent");
    cy.visit("/portfolio");
    cy.get(".pf-summary").contains("Ukupan profit").should("exist");
    cy.get(".pf-summary-value").first().invoke("text").should("not.be.empty");
  });

  // #69: porez sekcija — paid this year + unpaid this month
  it("#69: portfolio prikazuje plaćen porez (godina) i neplaćen (mesec)", () => {
    cy.loginAs("agent");
    cy.visit("/portfolio");
    cy.get(".pf-summary").should("contain", "Plaćen porez");
    cy.get(".pf-summary").should("contain", "Neplaćen porez");
  });

  // #70: za akcije postoji opcija javnog rezima
  it("#70: stock holding prikazuje Public dugme", () => {
    cy.loginAs("agent");
    cy.visit("/portfolio");
    cy.contains(".pf-table tr", TICKER).within(() => {
      cy.get(".pf-public-btn").should("exist");
    });
  });

  // #71: aktuar moze da iskoristi ITM put opciju.
  // Seed (seed.sql, "Cypress portfolio #71" block) gives the agent a holding
  // on MSFT_CY71_PUT_ITM (strike 63000, spot 42000, premium 1000, qty 5).
  // Backend payout for a put = (strike − spot − premium) × qty in instrument
  // currency; same-currency credit since the target is a USD account too:
  //   (63000 − 42000 − 1000) × 5 = 100000 minor units USD.
  // Payout target is marko's USD account, NOT BANK_USD_ACCOUNT — exercise
  // debits the bank-stub system USD account (333000100000000420) for the
  // payout, so crediting the same account would net zero.
  it("#71: aktuar moze da iskoristi ITM put opciju", () => {
    const PUT_TICKER = "MSFT_CY71_PUT_ITM";
    const PAYOUT_ACCOUNT = "333000198765432120"; // marko's USD account
    const EXPECTED_PAYOUT_USD = 100_000;

    cy.loginAs("agent");

    cy.task("db:exec", {
      sql: "SELECT balance FROM accounts WHERE number = $1",
      params: [PAYOUT_ACCOUNT],
    }).then((res) => {
      const balanceBefore = Number(res.rows[0].balance);

      cy.visit("/portfolio");
      cy.contains(".pf-table tr", PUT_TICKER, { timeout: 10_000 }).within(() => {
        cy.get(".pf-exercise-btn").click();
      });
      cy.get(".pf-modal select").select(PAYOUT_ACCOUNT);
      cy.get(".pf-modal").contains("button", "Iskoristi").click();

      cy.contains(".pf-banner--ok", /uspe[sš]no iskori[sš][cć]ena/i, { timeout: 10_000 })
        .should("exist");
      cy.contains(".pf-table tr", PUT_TICKER).should("not.exist");

      cy.task("db:exec", {
        sql: "SELECT balance FROM accounts WHERE number = $1",
        params: [PAYOUT_ACCOUNT],
      }).then((after) => {
        const delta = Number(after.rows[0].balance) - balanceBefore;
        expect(delta, "USD account credited at strike not market").to.eq(EXPECTED_PAYOUT_USD);
      });
    });
  });

  // #72: klijent ne vidi opciju iskoriscavanja
  it("#72: klijent ne vidi 'Iskoristi' dugme na portfolio strani", () => {
    cy.loginAs("client");
    cy.visit("/portfolio");
    cy.contains("button", "Iskoristi").should("not.exist");
  });

  // #73: hartija prelazi u portfolio nakon izvrsenog BUY ordera —
  // implicitly tested by the before() hook above (orderId reaches "done", then
  // the test below should find the holding).
  it("#73: posle done BUY ordera, MSFT je vidljiv u portfoliju", () => {
    cy.loginAs("agent");
    cy.visit("/portfolio");
    cy.contains(".pf-table tr", TICKER, { timeout: 10_000 }).should("exist");
  });
});
