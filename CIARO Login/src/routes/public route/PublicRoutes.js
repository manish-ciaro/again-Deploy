import React from "react";
import { BrowserRouter } from "react-router-dom";
import { Route, Routes, } from "react-router";
import Email from '../../screens/email/Email'
import Password from "../../screens/password/Password";
import ForgotPassword from "../../screens/forgot password/ForgotPassword";
import OtpScreen from "../../screens/otp/OtpScreen";
import SAFirstTimeSetPassword from "../../screens/super admin set password/SAFirstTimeSetPassword";
import PasswordChanged from "../../screens/password changed/PasswordChanged";
import ForgotUsername from "../../screens/forgot username/ForgotUsername";
import SAResetPassword from "../../screens/superadmin reset password/SAResetPassword";
import EmployeeEmail from "../../screens/employee login screen/EmployeeEmail"
import EmpFirstTimeSetPassword from "../../screens/employee set password/EmpSetPassword";
import EmpForgotPassword from "../../screens/employee forgot password/EmpForgotPassword";
import EmpResetPassword from "../../screens/employee reset password/EmpResetPassword";
import QRScreen from "../../screens/qrscreen/QRScreen";
import VerifyMfaOtp from "../../screens/mfa otp screen/VerifyMfaOtp";

export default function PublicRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login/sa" Component={Email} />
        <Route path="/password" Component={Password} />
        <Route path="/forgot_password/sa" Component={ForgotPassword} />
        <Route path="/forgot_username" Component={ForgotUsername} />
        <Route path="/verify_otp/sa" Component={OtpScreen} />
        <Route  path="/set_password/sa" Component={SAFirstTimeSetPassword} />
        <Route  path="/reset_password/sa" Component={SAResetPassword} />
        <Route  path="/password_changed_sucessfully" Component={PasswordChanged} />
        {/* Employee/Admin Routes */}
        <Route path="/login" Component={EmployeeEmail} />
        <Route path="/password/auth_mfa" Component={QRScreen} />
        <Route path="/set_password" Component={EmpFirstTimeSetPassword} />
        <Route path="/forgot_password" Component={EmpForgotPassword} />
        <Route  path="/reset_password" Component={EmpResetPassword} />        
        <Route  path="/verify_mfa_otp" Component={VerifyMfaOtp} />        
        <Route  path="/verify_email_mfa" Component={VerifyMfaOtp} />        
      </Routes>
    </BrowserRouter>
  );
}
