import { doubleCsrf } from "csrf-csrf";
import envVars, { isDev } from "src/config/environment";
import { getAllowedClient } from "./allowedClient.middleware";
import { AllowedClients } from "src/interfaces/enums";
import { RequestHandler } from "express";

export const {
    invalidCsrfTokenError,
    generateToken,
    doubleCsrfProtection/*: csrfRoute*/
} = doubleCsrf({
    getSecret: () => envVars.cookies.secret,
    cookieName: envVars.cookies.key,
    cookieOptions: { secure: true, signed: false, path: "/", sameSite: "none" },
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

// export const doubleCsrfProtection: RequestHandler = (req, res, next) => {
//     try {
//         // For some reasons. Chromium have some flags that making csrf not working.
//         var isChromium = req.headers['user-agent']?.match(/Chromium/);

//         if (!isChromium)
//             return csrfRoute(req, res, next)

//     } catch (e) { next(e); }

//     next();
// }

export const getCsrfRoute = (req, res) => {
    let fullToken = "";
    const allowedClient = getAllowedClient(req);
    if (allowedClient === AllowedClients.MobileApp) {
        // The following will override the res.cookie function so it can be used inside mobile
        // const currentResCookie = res.cookie;
        // @ts-ignore
        res.cookie = (name, val) => {
            if (name === envVars.cookies.key) {
                // Will be in
                fullToken = val;
            }
            // currentResCookie(name, val)
        }
        const token = req.csrfToken();
        return res.json({ fullToken, token })
    }
    else {
        return res.json({ token: generateToken(req, res) })
    }
};