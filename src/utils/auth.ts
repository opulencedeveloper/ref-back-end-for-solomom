import { expressjwt } from "express-jwt";
import bcrypt from "bcrypt";
import { IOTP } from "../auth/interface";
import nodemailer from "nodemailer";
import { ISendEmail } from "./interface";

require("dotenv").config();

export const requireSignIn = expressjwt({
  secret: `${process.env.JWT_SECRET!}`,
  algorithms: ["HS256"],
});

export const hashPassword = (password: string) => {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(12, (err, salt) => {
      if (err) {
        reject(err);
      }
      bcrypt.hash(password, salt, (error, hashed) => {
        if (error) {
          reject(error);
        }
        resolve(hashed);
      });
    });
  });
};

export const comparePassword = (password: string, hashed: string) => {
  return bcrypt.compare(password, hashed);
};

export const sendEmail = async (input: ISendEmail) => {
  const { to, subject, html } = input;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    // host: "mail.privateemail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.otp_email,
      pass: process.env.otp_password,
    },
  });

  const mailOptions = {
    from: `Blablacar <${process.env.otp_email}>`,
    to,
    subject,
    html,
  };

  await TransportMailService(transporter, mailOptions);
};

const TransportMailService = async (transporter: any, mailOptions: any) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, function (error: any, info: any) {
      if (error) {
        reject(false);
      } else {
        resolve(info.response);
      }
    });
  });
};

export const sendVerificationEmail = async (input: IOTP) => {
  return sendEmail({
    to: input.email,
    subject: "Email confirmation",
    html: `
          <p>To create your account, please copy the token provided here and paste it into the designated field on the app. 
          <br>
          Please note that the token will expire in 30 seconds, so it is important to complete this step quickly. Once you have entered the token, you can move to the next stage of account creation process.</p>
          <br>
          Token: <h3>${input.otp}</h3>`,
  });
};
