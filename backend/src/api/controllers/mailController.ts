import { createTransport, Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';
import dotenv from 'dotenv';

dotenv.config()

interface sendMailOptsInterface {
    to: string;
    subject: string;
    text: string;
    from?: string;
}

// let from = '';
let from = process.env.EMAIL_ADDRESS || '';
let transport: Transporter<SMTPTransport.SentMessageInfo> | null = null;

export default function initMailServer() {
    console.log('Initializing mail server...');
    
    try {
        // from = global.masterData.OrgDetails.emailServer.auth.emailAddress; 
        if (transport) transport.close();

        transport = createTransport({
            // host: global.masterData.OrgDetails.emailServer.host,
            host: process.env.HOST,
            port: parseInt(process.env.EMAIL_PORT || '587'),
            // port:process.env.EMAIL_PORT
            // port: global.masterData.OrgDetails.emailServer.port,
            auth: {
                // user: global.masterData.OrgDetails.emailServer.auth.username,
                // pass: global.masterData.OrgDetails.emailServer.auth.password,
                user: process.env.USER,
                pass: process.env.PASS,
            },
            secure: false, // Set to true if using SSL
        });

        transport.verify((err,success)=>{
                    if (err) {
                        console.log(err);
                        process.exit(0)
                   } else {
                        console.log('Server is ready to take our messages');
                   }
                })
    } catch (error) {
        console.error('Error initializing mail server:', error);
        process.exit(1);
    }
}

async function sendMail(opts: sendMailOptsInterface = { to: '', subject: '', text: '' }) {
    try {

        if (!transport) {
            initMailServer();
        }
        opts.from = opts.from || from;

        if (!transport) {
            throw new Error('Transport initialization failed');
        }
        return await transport.sendMail(opts);
    } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    }
}

export { sendMail };

