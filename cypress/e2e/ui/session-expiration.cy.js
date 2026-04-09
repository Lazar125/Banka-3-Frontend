describe("Obrada isteka JWT tokena i automatska odjava (#162)", () => {
  const EXPIRED_MESSAGE = "Vaša sesija je istekla, molimo prijavite se ponovo.";

  beforeEach(() => {
    cy.window().then((win) => {
      win.sessionStorage.clear();
      win.localStorage.clear();
    });
  });

  it("401 bez refresh tokena preusmerava na login i prikazuje poruku o isteku", () => {
    // Pre-set: samo accessToken, bez refreshToken (simulacija istekle sesije
    // gde refresh nije dostupan)
    cy.visit("/login");
    cy.window().then((win) => {
      win.sessionStorage.setItem("accessToken", "expired_access_token");
      win.sessionStorage.setItem("userRole", "employee");
      win.sessionStorage.setItem("permissions", JSON.stringify(["admin"]));
    });

    cy.intercept("GET", "**/api/employees*", {
      statusCode: 401,
      body: { error: "token expired" },
    }).as("getEmployees");

    cy.visit("/employees");

    cy.url().should("include", "/login");
    cy.contains(".message", EXPIRED_MESSAGE).should("be.visible");

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("accessToken")).to.be.null;
      expect(win.sessionStorage.getItem("refreshToken")).to.be.null;
      expect(win.sessionStorage.getItem("userRole")).to.be.null;
      // Flag mora biti obrisan posle prikaza (one-shot poruka)
      expect(win.sessionStorage.getItem("sessionExpired")).to.be.null;
    });
  });

  it("401 sa neuspešnim refresh-om preusmerava na login i prikazuje poruku o isteku", () => {
    cy.visit("/login");
    cy.window().then((win) => {
      win.sessionStorage.setItem("accessToken", "old_access_token");
      win.sessionStorage.setItem("refreshToken", "invalid_refresh_token");
      win.sessionStorage.setItem("userRole", "employee");
      win.sessionStorage.setItem("permissions", JSON.stringify(["admin"]));
    });

    cy.intercept("GET", "**/api/employees*", {
      statusCode: 401,
      body: { error: "token expired" },
    }).as("getEmployees");

    // Refresh endpoint takođe vraća 401 — interceptor mora odustati
    cy.intercept("POST", "**/api/token/refresh", {
      statusCode: 401,
      body: { error: "refresh token invalid" },
    }).as("refreshToken");

    cy.visit("/employees");
    cy.wait("@refreshToken");

    cy.url().should("include", "/login");
    cy.contains(".message", EXPIRED_MESSAGE).should("be.visible");

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("accessToken")).to.be.null;
      expect(win.sessionStorage.getItem("refreshToken")).to.be.null;
      expect(win.sessionStorage.getItem("sessionExpired")).to.be.null;
    });
  });

  it("poruka o isteku se prikazuje samo jednom (one-shot)", () => {
    // Flag postavljamo PRE load-a stranice (onBeforeLoad) kako bi useEffect
    // na mount-u pronašao vrednost — simulacija stanja nakon što je interceptor
    // upravo odustao i redirect-ovao korisnika.
    cy.visit("/login", {
      onBeforeLoad(win) {
        win.sessionStorage.setItem("sessionExpired", "1");
      },
    });
    cy.contains(".message", EXPIRED_MESSAGE).should("be.visible");
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("sessionExpired")).to.be.null;
    });

    // Drugi put kad poseti login, poruke više nema (flag je već obrisan)
    cy.visit("/login");
    cy.contains(".message", EXPIRED_MESSAGE).should("not.exist");
  });

  it("uspešan refresh ne postavlja flag o isteku niti prikazuje poruku", () => {
    cy.visit("/login");
    cy.window().then((win) => {
      win.sessionStorage.setItem("accessToken", "old_access_token");
      win.sessionStorage.setItem("refreshToken", "valid_refresh_token");
      win.sessionStorage.setItem("userRole", "employee");
      win.sessionStorage.setItem("permissions", JSON.stringify(["admin"]));
    });

    let employeesCallCount = 0;
    cy.intercept("GET", "**/api/employees*", (req) => {
      employeesCallCount++;
      if (employeesCallCount === 1) {
        req.reply({ statusCode: 401, body: { error: "token expired" } });
      } else {
        req.reply({ statusCode: 200, body: [] });
      }
    }).as("getEmployees");

    cy.intercept("POST", "**/api/token/refresh", {
      statusCode: 200,
      body: {
        access_token: "new_access_token",
        refresh_token: "new_refresh_token",
      },
    }).as("refreshToken");

    cy.visit("/employees");
    cy.wait("@refreshToken");

    cy.url().should("include", "/employees");
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("sessionExpired")).to.be.null;
      expect(win.sessionStorage.getItem("accessToken")).to.eq("new_access_token");
    });
  });

  it("pogrešna lozinka na login-u ne aktivira poruku o isteku sesije", () => {
    cy.intercept("POST", "**/api/login", {
      statusCode: 401,
      body: { error: "invalid credentials" },
    }).as("loginRequest");

    cy.visit("/login");
    cy.get("#email").type("admin@bank.rs");
    cy.get("#password").type("PogresnaLozinka!");
    cy.get('button[type="submit"]').click();
    cy.wait("@loginRequest");

    // Poruka o pogrešnim kredencijalima, NE poruka o isteku sesije
    cy.contains(".message", "Pogrešan email ili lozinka").should("be.visible");
    cy.contains(".message", EXPIRED_MESSAGE).should("not.exist");

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("sessionExpired")).to.be.null;
    });
  });
});
