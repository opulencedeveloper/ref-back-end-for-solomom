import { AppDataSource } from "../../app";
import { EmailVerify, VerifiedEmails } from "./entity";
import { IOTP, IVerifiedEmail } from "./interface";

class AuthService {
  public async saveOTP(input: IOTP) {
    const newEmailVerify = new EmailVerify();

    newEmailVerify.email = input.email;

    newEmailVerify.otp = input.otp;

    const emailVerify = await AppDataSource.getRepository(EmailVerify).save(
      newEmailVerify
    );

    return emailVerify;
  }

  public async readOTP(email: string, otp: string) {
    const emailVerify = await AppDataSource.getRepository(EmailVerify).findOne({
      where: { email, otp },
    });

    return emailVerify;
  }

  public async deleteOTP(email: string, otp: string) {
    const emailVerify = await AppDataSource.getRepository(EmailVerify).delete({
      email,
    });

    return emailVerify;
  }

  public async saveVerifiedEmail(input: IVerifiedEmail) {
    const newVerifiedEmails = new VerifiedEmails();

    newVerifiedEmails.email = input.email;

    const verifiedEmail = await AppDataSource.getRepository(VerifiedEmails).save(
      newVerifiedEmails
    );

    return verifiedEmail;
  }

  public async readVerifiedEmail(email: string) {
    const verifiedEmail = await AppDataSource.getRepository(VerifiedEmails).findOne({
      where: { email },
    });

    return verifiedEmail;
  }
}

export const authService = new AuthService();
