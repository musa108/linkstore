export const verifyPaystackTransaction = async (reference: string) => {
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
};
