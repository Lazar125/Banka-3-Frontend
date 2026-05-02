const activeEmployees = [
  {
    id: 1,
    first_name: "Marko",
    last_name: "Markovic",
    email: "marko@banka.raf",
    position: "Administrator",
    phone_number: "+381600000001",
    active: true,
    birth_date: "1990-01-15",
    gender: "M",
    address: "Beograd",
    username: "marko",
    department: "IT",
    permissions: ["admin"],
  },
  {
    id: 2,
    first_name: "Petar",
    last_name: "Petrovic",
    email: "petar@banka.raf",
    position: "Manager",
    phone_number: "+381601234567",
    active: true,
    birth_date: "1985-05-20",
    gender: "M",
    address: "Novi Sad",
    username: "petar",
    department: "HR",
    permissions: [],
  },
  {
    id: 3,
    first_name: "Ana",
    last_name: "Anic",
    email: "ana@banka.raf",
    position: "Viewer",
    phone_number: "+381609876543",
    active: false,
    birth_date: "1992-03-10",
    gender: "F",
    address: "Nis",
    username: "ana",
    department: "Finance",
    permissions: [],
  },
];

describe("Soft Delete - Deaktiviranje zaposlenog (Scenario 14)", () => {
  
  describe("Admin vidi sve zaposlene", () => {
    beforeEach(() => {
      cy.intercept("GET", "**/api/employees*", {
        statusCode: 200,
        body: activeEmployees,
      }).as("getEmployees");

      cy.intercept("POST", "**/api/token/refresh", {
        statusCode: 200,
        body: {
          access_token: "mock_access_token_123",
          refresh_token: "mock_refresh_token_123",
        },
      });

      cy.visit("/employees", {
        onBeforeLoad(win) {
          win.sessionStorage.setItem("accessToken", "mock_access_token_123");
          win.sessionStorage.setItem("refreshToken", "mock_refresh_token_123");
          win.sessionStorage.setItem("permissions", JSON.stringify(["admin"]));
        },
      });

      cy.wait("@getEmployees");
    });

    it("admin vidi sve zaposlene (aktivne i neaktivne)", () => {
      cy.get(".employee-row").should("have.length", 3);
      cy.get(".employee-row").eq(2).should("contain", "Ana");
    });

    it("filter info prikazuje: Pronađeno: 3 / 3 zaposlenih", () => {
      cy.get(".filter-info").should("contain", "3 / 3 zaposlenih");
    });

    it("admin vidi delete dugme za ne-admin zaposlene", () => {
      cy.get(".employee-row").eq(0).within(() => {
        cy.get(".delete-btn").should("not.exist");
      });

      cy.get(".employee-row").eq(1).within(() => {
        cy.get(".delete-btn").should("exist");
      });
    });
  });

  describe("Obični zaposleni vidi samo aktivne", () => {
    beforeEach(() => {
      cy.intercept("GET", "**/api/employees*", {
        statusCode: 200,
        body: activeEmployees,
      }).as("getEmployees");

      cy.intercept("POST", "**/api/token/refresh", {
        statusCode: 200,
        body: {
          access_token: "mock_access_token_123",
          refresh_token: "mock_refresh_token_123",
        },
      });

      cy.visit("/employees", {
        onBeforeLoad(win) {
          win.sessionStorage.setItem("accessToken", "mock_access_token_123");
          win.sessionStorage.setItem("refreshToken", "mock_refresh_token_123");
          win.sessionStorage.setItem("permissions", JSON.stringify([]));
        },
      });

      cy.wait("@getEmployees");
    });

    it("obični zaposleni vidi samo 2 aktivna (ne vidi Anu)", () => {
      cy.get(".employee-row").should("have.length", 2);
      cy.get(".employee-row").should("not.contain", "Ana");
    });

    it("filter info prikazuje: Pronađeno: 2 / 3 zaposlenih", () => {
      cy.get(".filter-info").should("contain", "2 / 3 zaposlenih");
    });
  });

  describe("Deaktiviranje zaposlenog (soft delete)", () => {
    beforeEach(() => {
      cy.intercept("GET", "**/api/employees*", {
        statusCode: 200,
        body: activeEmployees,
      }).as("getEmployees");

      cy.intercept("POST", "**/api/token/refresh", {
        statusCode: 200,
        body: {
          access_token: "mock_access_token_123",
          refresh_token: "mock_refresh_token_123",
        },
      });

      cy.visit("/employees", {
        onBeforeLoad(win) {
          win.sessionStorage.setItem("accessToken", "mock_access_token_123");
          win.sessionStorage.setItem("refreshToken", "mock_refresh_token_123");
          win.sessionStorage.setItem("permissions", JSON.stringify(["admin"]));
        },
      });

      cy.wait("@getEmployees");
    });

    it("admin može da deaktivira zaposlenog", () => {
      const deactivatedPetar = { ...activeEmployees[1], active: false };
      
      cy.intercept("PATCH", "**/api/employees/2", {
        statusCode: 200,
        body: deactivatedPetar,
      }).as("patchEmployee");

      cy.get(".employee-row").eq(1).within(() => {
        cy.get(".delete-btn").click();
      });

      cy.on("window:confirm", () => true);

      cy.wait("@patchEmployee");

      cy.get(".employee-row").should("have.length", 2);
      cy.get(".employee-row").should("not.contain", "Petar");
    });

    it("delete dialog prikazuje potvrdu", () => {
      cy.get(".employee-row").eq(1).within(() => {
        cy.get(".delete-btn").click();
      });

      cy.on("window:confirm", (text) => {
        expect(text).to.include("Petar");
        return false;
      });
    });

    it("otkazivanje ne deaktivira zaposlenog", () => {
      cy.get(".employee-row").should("have.length", 3);

      cy.get(".employee-row").eq(1).within(() => {
        cy.get(".delete-btn").click();
      });

      cy.on("window:confirm", () => false);

      cy.get(".employee-row").should("have.length", 3);
    });
  });

  describe("Status u detaljnom prikazu", () => {
    it("neaktivni zaposleni ima 'Neaktivan' status", () => {
      const inactiveEmployee = activeEmployees[2];

      cy.intercept("GET", `**/api/employees/${inactiveEmployee.id}`, {
        statusCode: 200,
        body: inactiveEmployee,
      }).as("getEmployee");

      cy.intercept("POST", "**/api/token/refresh", {
        statusCode: 200,
        body: {
          access_token: "mock_access_token_123",
          refresh_token: "mock_refresh_token_123",
        },
      });

      cy.visit(`/employees/${inactiveEmployee.id}`, {
        onBeforeLoad(win) {
          win.sessionStorage.setItem("accessToken", "mock_access_token_123");
          win.sessionStorage.setItem("refreshToken", "mock_refresh_token_123");
          win.sessionStorage.setItem("permissions", JSON.stringify(["admin"]));
        },
      });

      cy.wait("@getEmployee");

      cy.get(".status-badge").should("contain", "Neaktivan");
      cy.get(".status-badge").should("have.class", "is-inactive");
    });

    it("aktivni zaposleni ima 'Aktivan' status", () => {
      const activeEmployee = activeEmployees[0];

      cy.intercept("GET", `**/api/employees/${activeEmployee.id}`, {
        statusCode: 200,
        body: activeEmployee,
      }).as("getEmployee");

      cy.intercept("POST", "**/api/token/refresh", {
        statusCode: 200,
        body: {
          access_token: "mock_access_token_123",
          refresh_token: "mock_refresh_token_123",
        },
      });

      cy.visit(`/employees/${activeEmployee.id}`, {
        onBeforeLoad(win) {
          win.sessionStorage.setItem("accessToken", "mock_access_token_123");
          win.sessionStorage.setItem("refreshToken", "mock_refresh_token_123");
          win.sessionStorage.setItem("permissions", JSON.stringify(["admin"]));
        },
      });

      cy.wait("@getEmployee");

      cy.get(".status-badge").should("contain", "Aktivan");
      cy.get(".status-badge").should("have.class", "is-active");
    });
  });

  describe("Pretraga i filtriranje", () => {
    beforeEach(() => {
      cy.intercept("GET", "**/api/employees*", {
        statusCode: 200,
        body: activeEmployees,
      }).as("getEmployees");

      cy.intercept("POST", "**/api/token/refresh", {
        statusCode: 200,
        body: {
          access_token: "mock_access_token_123",
          refresh_token: "mock_refresh_token_123",
        },
      });

      cy.visit("/employees", {
        onBeforeLoad(win) {
          win.sessionStorage.setItem("accessToken", "mock_access_token_123");
          win.sessionStorage.setItem("refreshToken", "mock_refresh_token_123");
          win.sessionStorage.setItem("permissions", JSON.stringify(["admin"]));
        },
      });

      cy.wait("@getEmployees");
    });

    it("pretraga po imenu filtrira zaposlene", () => {
      cy.get(".search").type("Petar");
      cy.get(".employee-row").should("have.length", 1);
      cy.get(".filter-info").should("contain", "1 / 3 zaposlenih");
    });

    it("reset filtera vraća sve", () => {
      cy.get(".search").type("Petar");
      cy.get(".reset-btn").click();
      cy.get(".employee-row").should("have.length", 3);
    });
  });
});