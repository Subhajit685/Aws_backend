import { Google } from "arctic"
import dotenv from "dotenv"
dotenv.config()

export const google = new Google(
 process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:3000/google/callback",
);

// http://localhost:3000/google/callback?state=zXkslRtTTMYmOSrneBGk-RrLv1YgeX6zfRU-otTlFHw&code=4%2F0AUJR-x4HJBxrhjPDG64U0P9dQ20gfTGoa6mKsB8xHvBObo7UJ0jKIWeg21gzGmoxPOIzpg&scope=email+profile+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email+openid&authuser=0&prompt=consent