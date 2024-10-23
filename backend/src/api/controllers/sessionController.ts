import jwt from "jsonwebtoken";
import {Response,NextFunction } from "express";
import myRequests from "../../@types/requests.js";


async function authenticateToken(req:myRequests, res:Response, next:NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  try {
    var data:myRequests = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.SECRET, (err, decoded:any) => {
          if (err) {
              reject(err);
          } else {
              resolve(decoded);
          }
      });
    });

    req.uId = data.uId;
    next();
  } catch (error) {
    res.sendStatus(403)
  }
}


function makeToken(data:any,sessionTimeDay = 1) {
  var expiryDate = new Date()
  data.expiryDate = expiryDate.setDate(expiryDate.getDate() + sessionTimeDay)
  return jwt.sign(data,process.env.SECRET)
}

function getTokenData(tok:string) {
  return new Promise((resolve, reject) => {
    jwt.verify(tok, process.env.SECRET, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
}

function setPasswordToken(data:any,sessionTimeDay = 2) {
  var expiryDate = new Date()
  data.expiryDate = expiryDate.setDate(expiryDate.getDate() + sessionTimeDay)
  return jwt.sign(data,process.env.SECRET)
}



export default authenticateToken
export {makeToken,getTokenData ,setPasswordToken};
