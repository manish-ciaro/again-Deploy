import "dotenv/config.js"
import initDB from "./dist/api/controllers/dbController.js"
await initDB() // initate database, mailserver, ssoConfigs

import express from "express";
import cors from "cors";
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import {resolve} from 'path';
import userRouter from "./dist/api/routes/userRoutes.js";
import authenticateToken from "./dist/api/controllers/sessionController.js";
import policyRouter from "./dist/api/routes/policyRoutes.js";
import complianceRouter from "./dist/api/routes/complianceRoutes.js";//
import templateRoutes from "./dist/api/routes/templateRoutes.js";
import publicRouter from "./dist/api/routes/publicRoutes.js";
import controlRoutes from "./dist/api/routes/controlRoutes.js";
import tagsRoutes from "./dist/api/routes/tagsRoutes.js";
import scopesRoutes from "./dist/api/routes/scopesRoutes.js";
import logRoutes from "./dist/api/routes/logRoutes.js";
import projectRoutes from "./dist/api/routes/projectRoutes.js";
import questionnaireRoutes from "./dist/api/routes/questionnaireRoutes.js";
import procedureRoutes from "./dist/api/routes/procedureRoutes.js";
import evidencesRoutes from "./dist/api/routes/evidencesRoutes.js";
import rolesRoutes from "./dist/api/routes/rolesRoute.js";
import { TPRRouter } from "./dist/api/routes/TPRRoutes.js";
import riskRouter from "./dist/api/routes/riskRoutes.js";
import onboardingRoute from "./dist/api/routes/onboardingRoutes.js";
import appSession from './dist/api/controllers/mongoDbSessionController.js'
import filesRoutes from "./dist/api/routes/filesRoutes.js";
import cookieParser from "cookie-parser";  //

const PORT = process.env.PORT
const app = express()
app.use(cors())

// const corsOptions = {
//     origin: 'http://192.168.0.170:3000', 
//     credentials: true,  
//   };
// app.use(cors(corsOptions));
app.use(cookieParser());   // 

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/docs', swaggerUi.serve, swaggerUi.setup(YAML.load(resolve("./openapi.yml"))))
console.log(`Docs Server started at /docs ${PORT}`)
app.use(appSession)


app.use('/auth', publicRouter)

app.use("/onboarding", onboardingRoute)

app.use("/compliance", complianceRouter)

app.use(authenticateToken)

app.use('/user', userRouter)

app.use("/policy", policyRouter)

app.use("/procedure", procedureRoutes)
app.use("/file", filesRoutes)
app.use("/templates", templateRoutes)
app.use("/control", controlRoutes)
app.use("/questionBank", questionnaireRoutes)
app.use("/tag", tagsRoutes)
app.use("/scopes", scopesRoutes)
app.use("/logs", logRoutes)
app.use("/roles", rolesRoutes)
app.use("/tpr", TPRRouter)
app.use("/risk",riskRouter)
app.use("/project",projectRoutes)

app.use("/evidences", evidencesRoutes)

 app.listen(PORT || 4444, () => {
     console.log(`Server started http://localhost:${PORT}`)
 })

// app.listen(PORT, '0.0.0.0', () => {
//     console.log(`Server started on port ${PORT}`);
// });


// Bb*GAk9K33*pR^
// HiOneLogin123

