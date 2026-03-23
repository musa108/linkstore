export const initializePaystackTransaction = async (email: string, amount: number, reference: string, callbackUrl: string, subaccount?: string) => {
    try {
        const response = await fetch("https://api.paystack.co/transaction/initialize", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                amount: Math.round(amount * 100), // Convert to kobo
                reference,
                callback_url: callbackUrl,
                subaccount: subaccount,
            }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("PAYSTACK_INITIALIZE_ERROR", error);
        return { status: false, message: "Network error. Please check your connection." };
    }
};

export const createPaystackSubaccount = async (businessName: string, settlementBank: string, accountNumber: string, percentageCharge: number) => {
    try {
        const response = await fetch("https://api.paystack.co/subaccount", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                business_name: businessName,
                settlement_bank: settlementBank,
                account_number: accountNumber,
                percentage_charge: percentageCharge,
            }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("PAYSTACK_SUBACCOUNT_ERROR", error);
        return { status: false, message: "Network error. Please check your connection." };
    }
};

const FALLBACK_BANKS = [
    { name: "Access Bank", code: "044" },
    { name: "First Bank", code: "011" },
    { name: "GTBank", code: "058" },
    { name: "United Bank For Africa", code: "033" },
    { name: "Zenith Bank", code: "057" },
    { name: "Opay", code: "999992" },
    { name: "Kuda Bank", code: "090267" },
    { name: "Moniepoint", code: "50515" },
    { name: "PalmPay", code: "999991" }
];

export const getPaystackBanks = async () => {
    try {
        const response = await fetch("https://api.paystack.co/bank", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
            console.warn(`Paystack API returned ${response.status}. Using fallback banks.`);
            return { status: true, data: FALLBACK_BANKS };
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("PAYSTACK_BANKS_ERROR", error);
        return { status: true, data: FALLBACK_BANKS };
    }
};

// Re-fixing the URL typo above in the replacement content
export const verifyPaystackTransaction = async (reference: string) => {
    try {
        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();

        if (data.status && data.data.status === "success") {
            return { success: true, data: data.data };
        }

        return { success: false, error: data.message };
    } catch (error) {
        console.error("PAYSTACK_VERIFY_ERROR", error);
        return { success: false, error: "Network error. Please check your connection." };
    }
};
