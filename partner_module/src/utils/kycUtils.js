export const MAX_FILE_SIZE = 200 * 1024;

export const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg"];

export const emptyForm = {
    owner_name: "",
    business_name: "",
    business_address: "",
    pan_number: "",
    gst_number: "",
    aadhaar_number: "",
    pan_document: null,
    aadhaar_document: null,
    gst_document: null
};

export const validateFile = (file) => {
    if (!file) return true;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return false;
    }

    return file.size <= MAX_FILE_SIZE;
};