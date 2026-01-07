import CryptoJS from "crypto-js";

// TODO: This key must be securely managed and is a placeholder here.
const ENCRYPTION_SECRET_KEY = "MyUltraSecure256BitKey!123456"; 

const aesEncrypt = <Template>(data: Template): string => {
    const jsonString = JSON.stringify(data)
    const ciphertext = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_SECRET_KEY).toString();
    return ciphertext;
};

/**
 *\ AES decryption process using the defined secret key.
 */
const aesDecrypt = <Template>(encryptedData: string): Template | null => {
        const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_SECRET_KEY);
        const jsonString = bytes.toString(CryptoJS.enc.Utf8);

        const parsedData = JSON.parse(jsonString);
        if (parsedData && (typeof parsedData.id === 'string' || parsedData.id === null)) {
            return parsedData as Template;
        }
        return null;
};

export { aesEncrypt, aesDecrypt };