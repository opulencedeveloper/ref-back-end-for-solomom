export interface ISendEmail {
    to: string;
    subject: string;
    html: string;
  }
  
  export interface CustomRequest extends Request {
    auth?: any;
  }