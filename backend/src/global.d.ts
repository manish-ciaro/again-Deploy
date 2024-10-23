import { masterRecordInterface } from "./api/models/masterRecordModel.ts"
import { Secret } from "jsonwebtoken"
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DB_USER: string,
      DB_PASS: string,
      DB_NAME: string,
      DB_HOST: string,
      SECRET: string,
      ENABLE_DOCS: number,
      SESSION_KEY: string,
      WEB_URL: string
      ORG_API: string
    }
    interface globalThis {
      abc: string
    }
  }
  namespace Express {
    interface Request {
      uId: string
    }
    interface SessionData{
      auth: string
    }
  }
  declare var masterData: masterRecordInterface
}
declare module 'express-session' {
  interface SessionData {
    passport: {
      user: {
        issuer: string;
        inResponseTo: string;
        sessionIndex: string;
        nameID: string;
        nameIDFormat: string;
        nameQualifier?: string;
        spNameQualifier?: string;
        getAssertionXml: () => any;
        getAssertion: () => any;
        getSamlResponseXml: () => any;
      };
    },
    verified: boolean,
    uId: string
  }
}
export { }