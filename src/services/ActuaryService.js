const USE_MOCK = true; // TODO: Prebaciti na false kada backend implementira API

// Mock podaci
const MOCK_AGENTS = [
    { id: 1, firstName: "Marko", lastName: "Markovic", email: "marko.m@banka.rs", position: "Senior Agent", limit: 500000, usedLimit: 123400 },
    { id: 2, firstName: "Ana", lastName: "Petrovic", email: "ana.p@banka.rs", position: "Junior Agent", limit: 100000, usedLimit: 87000 },
    { id: 3, firstName: "Nikola", lastName: "Ilic", email: "nikola.i@banka.rs", position: "Agent", limit: 250000, usedLimit: 0 },
    { id: 4, firstName: "Jovana", lastName: "Jovanovic", email: "jovana.j@banka.rs", position: "Senior Agent", limit: 750000, usedLimit: 310000 },
    { id: 5, firstName: "Stefan", lastName: "Stefanovic", email: "stefan.s@banka.rs", position: "Junior Agent", limit: 100000, usedLimit: 99500 },
];

// Simulacija async operacija
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const ActuaryService = {

    //TODO: Backend endpoint - GET /api/actuaries/agents
    //dobavi sve agente
    async getAllAgents() {
        if (USE_MOCK) {
            await delay(400);
            return [...MOCK_AGENTS]; // Vraćamo kopiju
        }

        // TODO: Implementirati kada backend bude spreman
        // const response = await api.get('/actuaries/agents');
        // return response.data.map(mapActuaryData);
        throw new Error("Backend API not implemented yet");
    },

     //azuriraj limit agenta
     //TODO: Backend endpoint - PUT /api/actuaries/agents/:id/limit
    async updateAgentLimit(agentId, newLimit) {
        if (USE_MOCK) {
            await delay(400);
            console.log(`Mock: Updated agent ${agentId} limit to ${newLimit}`);
            return { success: true };
        }

        // TODO: Implementirati kada backend bude spreman
        // const response = await api.put(`/actuaries/agents/${agentId}/limit`, { limit: newLimit });
        // return response.data;
        throw new Error("Backend API not implemented yet");
    },


     //Resetuj iskorisceni limit agenta na 0
     //TODO: Backend endpoint - PUT /api/actuaries/agents/:id/reset-used-limit
    async resetUsedLimit(agentId) {
        if (USE_MOCK) {
            await delay(400);
            console.log(`Mock: Reset used limit for agent ${agentId}`);
            return { success: true };
        }

        // TODO: Implementirati kada backend bude spreman
        // const response = await api.put(`/actuaries/agents/${agentId}/reset-used-limit`);
        // return response.data;
        throw new Error("Backend API not implemented yet");
    },



    //Proveri da li je trenutni korisnik supervisor ili admin
    //Admin je automatski i Supervisor prema specifikaciji
    isSupervisorOrAdmin() {
        try {
            const permissions = JSON.parse(sessionStorage.getItem("permissions") || "[]");
            return permissions.includes("SUPERVISOR") || permissions.includes("ADMIN");
        } catch {
            return false;
        }
    }
};

// TODO: Mapiranje podataka sa backenda kada API bude implementiran
// function mapActuaryData(data) {
//     return {
//         id: data.id || data.employee_id,
//         firstName: data.first_name,
//         lastName: data.last_name,
//         email: data.email,
//         position: data.position,
//         limit: data.limit || 0,
//         usedLimit: data.used_limit || 0,
//         needApproval: data.need_approval || false
//     };
// }