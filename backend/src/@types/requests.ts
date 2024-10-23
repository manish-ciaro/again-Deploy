import { Request } from "express";

export default interface myRequests extends Request{
    uId: string
} 