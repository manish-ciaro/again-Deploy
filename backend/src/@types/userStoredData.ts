import { VerifyOptions } from "jsonwebtoken";
export default interface userStoredData extends VerifyOptions{
    id: string,
    uId?: string,
    name: string,
    expiryDate: Date,
}