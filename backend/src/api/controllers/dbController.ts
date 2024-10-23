import {connect} from 'mongoose'
import { setGLobal } from './onboardingController.js';

export const DB_URL = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/${process.env.DB_NAME}`

export default async function initDB(): Promise<boolean> {
    return new Promise((resolve)=>{
        connect(DB_URL).then(async ()=>{
            await setGLobal()
            resolve(true)
        }).catch(e=>{
            console.log(e)
            resolve(false)
        });
    })
}
