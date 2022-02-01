import * as dotenv from "dotenv";
dotenv.config();

export class UserCredentials {
  public consumer_key: string;
  public consumer_secret: string;
  public access_token_key: string;
  public access_token_secret: string;
  public bearer_token: string;

  constructor() {
    this.consumer_key = this.getConsumerKey();
    this.consumer_secret = this.getConsumerSecret();
    this.access_token_key = this.getAccessTokenKey();
    this.access_token_secret = this.getAccessTokenSecret();
    this.bearer_token = this.getBearerToken();
  }

  private getBearerToken(): string {
    if (process.env.TWITTER_BEARER_TOKEN !== undefined) {
      return process.env.TWITTER_BEARER_TOKEN;
    }
    return "";
  }

  private getConsumerKey(): string {
    if (process.env.TWITTER_CONSUMER_KEY !== undefined) {
      return process.env.TWITTER_CONSUMER_KEY;
    }
    return "";
  }

  private getConsumerSecret(): string {
    if (process.env.TWITTER_CONSUMER_SECRET !== undefined) {
      return process.env.TWITTER_CONSUMER_SECRET;
    }
    return "";
  }

  private getAccessTokenKey(): string {
    if (process.env.TWITTER_ACCESS_TOKEN_KEY !== undefined) {
      return process.env.TWITTER_ACCESS_TOKEN_KEY;
    }
    return "";
  }

  private getAccessTokenSecret(): string {
    if (process.env.TWITTER_ACCESS_TOKEN_SECRET !== undefined) {
      return process.env.TWITTER_ACCESS_TOKEN_SECRET;
    }
    return "";
  }
}
