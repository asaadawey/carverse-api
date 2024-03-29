import { doubleCsrf } from "csrf-csrf";
import envVars, { isDev } from "src/config/environment";
import { getAllowedClient } from "./allowedClient.middleware";
import { AllowedClients } from "src/interfaces/enums";

export const {
    invalidCsrfTokenError,
    generateToken,
    doubleCsrfProtection
} = doubleCsrf({
    getSecret: () => envVars.cookies.secret,
    cookieName: envVars.cookies.key,
    cookieOptions: { sameSite: !isDev, secure: !isDev, signed: !isDev },
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

export const getCsrfRoute = (req, res) => {
    let fullToken = "";
    // The following will override the res.cookie function so it can be used inside mobile
    // @ts-ignore
    res.cookie = (name, val) => {
        if (name === envVars.cookies.key) {
            // Will be in
            fullToken = val;
        }
    }
    const token = req.csrfToken();
    const allowedClient = getAllowedClient(req);
    return res.json(allowedClient === AllowedClients.MobileApp ? { fullToken, token } : { token });
};