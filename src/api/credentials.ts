import crypto from "crypto";
import axios from "axios";
import OAuth from "oauth-1.0a";
import { TwitterError } from "./exceptions/twitter-error";
import { UserCredentials } from "./interfaces";
import { CredentialsArgs } from "./types/credentials-args";

export class Credentials {
  private consumer_key?: string;
  private consumer_secret?: string;
  private access_token_key?: string;
  private access_token_secret?: string;
  private bearer_token?: string;
  private bearer_token_promise?: Promise<void>;
  private oauth?: OAuth;

  constructor(args: CredentialsArgs) {
    this.removeNullAndUndefined(args);
    this.validate(args);

    if ("consumer_key" in args) {
      this.consumer_key = args.consumer_key;
      this.consumer_secret = args.consumer_secret;
    }

    if ("bearer_token" in args) {
      this.bearer_token = this.getUsedBearerToken(args.bearer_token);
    }

    if ("access_token_key" in args) {
      this.access_token_key = args.access_token_key;
      this.access_token_secret = args.access_token_secret;
      this.oauth = this.generateOAuth(args);
    }
  }

  private appAuth(version: string): boolean {
    return version === "2";
  }

  private userAuth(version: string): boolean {
    return !this.appAuth(version);
  }

  public async createAuthorizationHeader(
    url: URL,
    request: { method: string; body?: object },
    version: string
  ): Promise<string> {
    if (this.appAuth(version)) {
      if (!this.bearer_token) {
        this.bearer_token = await this.createBearerToken(
          this.consumer_key,
          this.consumer_secret
        );
      }
      return `Bearer ${this.bearer_token}`;
    }

    if (this.oauth === undefined) {
      throw new Error("OAuth should be defined for user authentication");
    }

    if (
      this.access_token_key === undefined ||
      this.access_token_secret === undefined
    ) {
      throw new Error("Access token should be defined for user authentication");
    }

    return this.oauth.toHeader(
      this.oauth.authorize(
        {
          url: url.toString(),
          method: request.method,
          data: request.body,
        },
        {
          key: this.access_token_key,
          secret: this.access_token_secret,
        }
      )
    ).Authorization;
  }

  public async getNewBearerToken(version: string): Promise<void | null> {
    if (this.userAuth(version)) {
      throw new Error(
        "Refusing to create a bearer token when using user authentication"
      );
    }

    if (this.bearer_token !== undefined) return null;

    if (this.bearer_token_promise !== undefined)
      return this.bearer_token_promise;

    this.bearer_token_promise = this.createBearerToken(
      this.consumer_key,
      this.consumer_secret
    )
      .then((token) => {
        this.bearer_token = token;
      })
      .finally(() => {
        this.bearer_token_promise = undefined;
      });

    return this.bearer_token_promise;
  }

  private validate(credentials: CredentialsArgs): void {
    if (
      "consumer_key" in credentials &&
      typeof credentials.consumer_key !== "string"
    ) {
      throw new Error(
        `Invalid value for consumer_key. Expected string but got ${typeof credentials.consumer_key}`
      );
    }

    if (
      "consumer_secret" in credentials &&
      typeof credentials.consumer_key !== "string"
    ) {
      throw new Error(
        `Invalid value for consumer_secret. Expected string but got ${typeof credentials.consumer_secret}`
      );
    }

    if (
      "bearer_token" in credentials &&
      typeof credentials.bearer_token !== "string"
    ) {
      throw new Error(
        `Invalid value for bearer_token. Expected string but got  ${typeof credentials.bearer_token}`
      );
    }

    if (
      "access_token_key" in credentials &&
      typeof credentials.access_token_key !== "string"
    ) {
      throw new Error(
        `Invalid value for access_token_key. Expected string but got  ${typeof credentials.access_token_key}`
      );
    }

    if (
      "access_token_secret" in credentials &&
      typeof credentials.access_token_secret !== "string"
    ) {
      throw new Error(
        `Invalid value for access_token_secret. Expected string but got  ${typeof credentials.access_token_secret}`
      );
    }

    if (
      !("access_token_key" in credentials) &&
      !("access_token_secret" in credentials) &&
      !("consumer_key" in credentials) &&
      !("consumer_secret" in credentials) &&
      !("bearer_token" in credentials)
    ) {
      throw new Error("Invalid argument: no credentials defined");
    }

    if (
      ("consumer_key" in credentials && !("consumer_secret" in credentials)) ||
      (!("consumer_key" in credentials) && "consumer_secret" in credentials)
    ) {
      throw new Error(
        "Invalid argument: when using consumer keys, both consumer_key and " +
          "consumer_secret must be defined"
      );
    }

    if (
      ("access_token_key" in credentials &&
        !("access_token_secret" in credentials)) ||
      (!("access_token_key" in credentials) &&
        "access_token_secret" in credentials)
    ) {
      throw new Error(
        "Invalid argument: access_token_key and access_token_secret must both " +
          "be defined when using user authorization"
      );
    }

    if (
      ("access_token_key" in credentials ||
        "access_token_secret" in credentials) &&
      (!("consumer_key" in credentials) || !("consumer_secret" in credentials))
    ) {
      throw new Error(
        "Invalid argument: user authentication requires consumer_key and " +
          "consumer_secret to be defined"
      );
    }
  }

  private removeNullAndUndefined(obj: any): void {
    Object.keys(obj).forEach((key: any) => obj[key] == null && delete obj[key]);
  }

  private async createBearerToken(
    consumerKey?: string,
    consumerSecret?: string
  ): Promise<string> {
    if (consumerKey === undefined || consumerSecret === undefined) {
      return "";
    }

    const parameters = {
      grant_type: "client_credentials",
    };

    let response: any;

    try {
      response = await axios.post(
        "https://api.twitter.com/oauth2/token",
        new URLSearchParams(parameters),
        {
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${consumerKey}:${consumerSecret}`
            ).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          },
        }
      );
    } catch (error) {
      console.log(error);
    }

    if (response.status === 200) {
      const body = response.data;
      if (body.errors !== undefined && body.errors.length > 0) {
        throw new TwitterError(
          `${body.title}: ${body.errors[0].message}`,
          body.type,
          body.detail
        );
      }

      if (body.token_type !== "bearer") {
        throw new TwitterError(
          "Unexpected reply from Twitter upon obtaining bearer token",
          undefined,
          `Expected "bearer" but found ${body.token_type}`
        );
      }

      if (body.access_token !== undefined) {
        return body.access_token;
      }
    }

    return "";
  }

  private getUsedBearerToken(bearerToken: string): string {
    if (bearerToken.startsWith("Bearer ")) {
      return bearerToken.replace("Bearer ", "");
    }
    return bearerToken;
  }

  private generateOAuth(args: UserCredentials): OAuth {
    return new OAuth({
      consumer: {
        key: args.consumer_key,
        secret: args.consumer_secret,
      },
      signature_method: "HMAC-SHA1",
      hash_function(base_string, key) {
        return crypto
          .createHmac("sha1", key)
          .update(base_string)
          .digest("base64");
      },
    });
  }
}
