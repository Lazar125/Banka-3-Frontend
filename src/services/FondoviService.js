import api from "./api.js";

const MOCK_FONDOVI = [
    {
        id: 1,
        naziv: "Globalni Rast Fond",
        opis: "Diversifikovani fond usmeren na globalna tržišta akcija sa fokusom na rast.",
        vrednost: 152430000,
        profit: 12.4,
        minUlog: 100000,
    },
    {
        id: 2,
        naziv: "Stabilan Prinos Fond",
        opis: "Konzervativni fond sa mešanim portfoliom obveznica i akcija.",
        vrednost: 84200000,
        profit: 6.8,
        minUlog: 50000,
    },
    {
        id: 3,
        naziv: "Tehnološki Inovacioni Fond",
        opis: "Ulaganje u visokotehnološke kompanije i startapove sa visokim potencijalom.",
        vrednost: 230100000,
        profit: 21.3,
        minUlog: 200000,
    },
    {
        id: 4,
        naziv: "Zelena Energija Fond",
        opis: "Fond fokusiran na kompanije iz sektora obnovljive energije i ekologije.",
        vrednost: 67500000,
        profit: 9.1,
        minUlog: 75000,
    },
    {
        id: 5,
        naziv: "Balkanski Razvoj Fond",
        opis: "Regionalni fond koji ulaže u kompanije na tržištima Balkana.",
        vrednost: 41800000,
        profit: 7.6,
        minUlog: 30000,
    },
    {
        id: 6,
        naziv: "Nekretninski Prinos Fond",
        opis: "Real estate investment trust fokusiran na komercijalne nekretnine u Srbiji.",
        vrednost: 118900000,
        profit: 5.2,
        minUlog: 150000,
    },
    {
        id: 7,
        naziv: "Trezorski Fond",
        opis: "Niskorizični fond baziran na državnim obveznicama i trezorskim zapisima.",
        vrednost: 320000000,
        profit: 3.9,
        minUlog: 10000,
    },
    {
        id: 8,
        naziv: "Visoki Prinos Fond",
        opis: "Agresivni fond sa visokim prinosom, ulaže u korporativne obveznice visokog prinosa.",
        vrednost: 95600000,
        profit: 15.7,
        minUlog: 250000,
    },
];

export async function getFondovi() {
    try {
        const response = await api.get("/investicioni-fondovi");
        return Array.isArray(response.data) ? response.data : [];
    } catch {
        return MOCK_FONDOVI;
    }
}
