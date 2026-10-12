const API_URL = "http://localhost:5000/api/partner";


// ==========================================
// Get Logged-in Partner KYC
// ==========================================

export const getPartnerKyc = async () => {

    const response = await fetch(
        `${API_URL}/kyc`,
        {
            method: "GET",

            // Cookie me stored token backend ko bhejega
            credentials: "include",

            headers: {
                "Accept": "application/json"
            }
        }
    );


    const data = await response.json();


    if (!response.ok) {

        throw new Error(
            data.message || "Unable to fetch KYC"
        );

    }


    return data;

};


// ==========================================
// Submit / Update Partner KYC
// ==========================================

export const submitPartnerKyc = async (formData) => {

    const response = await fetch(
        `${API_URL}/kyc`,
        {
            method: "POST",

            // Cookie token automatically send hoga
            credentials: "include",

            // IMPORTANT:
            // FormData ke saath Content-Type manually mat lagana.
            body: formData
        }
    );


    const data = await response.json();


    if (!response.ok) {

        throw new Error(
            data.message || "Unable to submit KYC"
        );

    }


    return data;

};

