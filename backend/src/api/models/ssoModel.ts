import { Schema,model } from "mongoose";

export interface ssoModelInterface extends Object{
    idP_Name: string,
    issuer: string,
    ssoUrl: string,
    cert: string,
}

const ssoSchema = new Schema<ssoModelInterface>({
    idP_Name: {
        type: String,
        required: true
    },
    issuer: {
        type: String,
        required: true
    },
    ssoUrl: {
        type: String,
        required: true
    },
    cert: {
        type: String,
        required: true
    },
})

const ssoModel = model<ssoModelInterface>("sso",ssoSchema)
export default ssoModel