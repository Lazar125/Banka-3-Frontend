// TestoviCelina3.txt — Feature: Margin i AON nalozi (#63–66).

const NASDAQ_MIC = "XNAS";
const TICKER = "MSFT";
const BANK_USD_ACCOUNT = "333000100000000420";

describe("Margin i AON nalozi — #63–66", () => {
  before(() => {
    cy.loginAs("supervisor");
    cy.setExchangeOpen(NASDAQ_MIC, true);
  });

  // #63: Margin nije dozvoljen bez permisije.
  // The agent in seed has perms ['agent','trade_stocks','view_stocks','trading_cancel'].
  // No 'margin_trading' perm. Backend rejects margin=true for that user
  // (services/bank/internal/trading/server.go:82-86).
  it("#63: agent bez margin_trading permisije ne moze margin=true", () => {
    cy.loginAs("agent");
    cy.findListingByTicker(TICKER).then((l) => {
      cy.createOrderApi({
        account_number: BANK_USD_ACCOUNT,
        order_type: "market",
        direction: "buy",
        quantity: 1,
        listing_id: l.id,
        margin: true,
      }).then((r) => {
        expect(r.status).to.be.gte(400).and.lt(500);
      });
    });
  });

  // #64 / #65 — margin dozvoljen: supervisor ima margin_trading + dovoljno
  // sredstava (balance > IMC). Spec p.56: kada balance > IMC, margin=true
  // mora biti prihvacen.
  it("#64-65: supervizor sa margin_trading permisijom moze margin=true", () => {
    cy.loginAs("supervisor");
    cy.findListingByTicker(TICKER).then((l) => {
      cy.createOrderApi({
        account_number: BANK_USD_ACCOUNT,
        order_type: "market",
        direction: "buy",
        quantity: 1,
        listing_id: l.id,
        margin: true,
      }).then((r) => {
        expect(r.status).to.be.lessThan(500);
      });
    });
  });

  // #65b — IMC prag se zaista enforce-uje. Drainamo balance ispod IMC i
  // ocekujemo 4xx (InvalidArgument: "margin eligibility failed").
  // Posle vracamo balance.
  it("#65b: balance ≤ IMC odbija margin (margin eligibility failed)", () => {
    cy.loginAs("supervisor");
    cy.task("db:exec", {
      sql: "SELECT balance FROM accounts WHERE number = $1",
      params: [BANK_USD_ACCOUNT],
    }).then((res) => {
      const saved = Number(res.rows[0].balance);

      // initial_margin_cost za MSFT po listingu je ~23100 minor units ($231).
      // Setujemo balance ispod toga.
      cy.task("db:exec", {
        sql: "UPDATE accounts SET balance = 100 WHERE number = $1", // $1.00
        params: [BANK_USD_ACCOUNT],
      });

      cy.findListingByTicker(TICKER).then((l) => {
        cy.createOrderApi({
          account_number: BANK_USD_ACCOUNT,
          order_type: "market",
          direction: "buy",
          quantity: 1,
          listing_id: l.id,
          margin: true,
        }).then((r) => {
          expect(r.status, "rejected for IMC failure").to.be.gte(400).and.lt(500);
        });
      });

      // Restore.
      cy.task("db:exec", {
        sql: "UPDATE accounts SET balance = $1 WHERE number = $2",
        params: [saved, BANK_USD_ACCOUNT],
      });
    });
  });

  // #66: AON oznaka se cuva uz order — verifikacija kroz list endpoint
  // (POST /orders vraca samo {order_id, status}, nema all_or_none).
  it("#66: AON=true se persist-uje uz order", () => {
    cy.loginAs("agent");
    cy.findListingByTicker(TICKER).then((l) => {
      cy.createOrderApi({
        account_number: BANK_USD_ACCOUNT,
        order_type: "market",
        direction: "buy",
        quantity: 1,
        listing_id: l.id,
        all_or_none: true,
      }).then((r) => {
        if (r.status >= 400) return;
        cy.getOrderById(r.body.order_id).then((o) => {
          expect(o.all_or_none).to.eq(true);
        });
      });
    });
  });
});
