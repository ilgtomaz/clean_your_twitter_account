import axios from "axios";
import { Credentials } from "./credentials";
import { TwitterError } from "./exceptions/twitter-error";
import { RequestParameters } from "./interfaces/request-parameters";
import { CredentialsArgs } from "./types/credentials-args";

export class Twitter {
  private credentials: Credentials;
  private baseUrl: string = "https://api.twitter.com/";

  constructor(args: CredentialsArgs) {
    this.credentials = new Credentials(args);
  }

  public async get<T extends any>(
    endpoint: string,
    parameters?: RequestParameters
  ): Promise<T> {
    const queryParameters = this.createQueryParameters(parameters);
    const version = this.getUsedVersion(endpoint);
    const stringUrl = `${this.baseUrl}${version}/${endpoint}${queryParameters}`;
    const headers = {
      Authorization: await this.credentials.createAuthorizationHeader(
        new URL(stringUrl),
        { method: "GET" },
        version
      ),
    };

    try {
      const result = await axios.get(stringUrl, { headers });
      return result.data;
    } catch (error: any) {
      throw new TwitterError(
        error.message,
        error.response.status,
        `Error while trying to make a get request on twitter api. Message: ${error.message}`
      );
    }
  }

  public async post<T extends any>(
    endpoint: string,
    body: object,
    parameters?: RequestParameters
  ): Promise<T> {
    const queryParameters = this.createQueryParameters(parameters);
    const version = this.getUsedVersion(endpoint);
    const stringUrl = `${this.baseUrl}${version}/${endpoint}${queryParameters}`;
    const headers = {
      Authorization: await this.credentials.createAuthorizationHeader(
        new URL(stringUrl),
        { method: "POST" },
        version
      ),
    };

    try {
      const result = await axios.post(stringUrl, body, { headers });
      return result.data;
    } catch (error: any) {
      throw new TwitterError(
        error.message,
        error.response.status,
        `Error while trying to make a post request on twitter api. Message: ${error.message}`
      );
    }
  }

  public async delete<T extends any>(
    endpoint: string,
    parameters?: RequestParameters
  ): Promise<T> {
    const queryParameters = this.createQueryParameters(parameters);
    const version = this.getUsedVersion(endpoint);
    const stringUrl = `${this.baseUrl}${version}/${endpoint}${queryParameters}`;
    const headers = {
      Authorization: await this.credentials.createAuthorizationHeader(
        new URL(stringUrl),
        { method: "POST" },
        version
      ),
    };

    try {
      const result = await axios.delete(stringUrl, { headers });
      return result.data;
    } catch (error: any) {
      throw new TwitterError(
        error.message,
        error.response.status,
        `Error while trying to make a delete request on twitter api. Message: ${error.message}`
      );
    }
  }

  private getUsedVersion(endpoint: string): string {
    const version2 = ["tweets", "users"];
    const exceptions = ["show", "lookup"];
    const path = endpoint.split("/")[0];
    const complement = endpoint.split("/")[1];

    if (version2.includes(path) && !exceptions.includes(complement)) {
      return "2";
    }

    return "1.1";
  }

  private createQueryParameters(parameters?: RequestParameters): string {
    if (parameters === undefined || parameters === null) {
      return "";
    }

    let queryParameters = Object.keys(parameters).reduce(
      (accumulator: string, currentValue: string, index: number) => {
        accumulator += `${currentValue}=${parameters[currentValue]}`;
        if (index < Object.keys(parameters).length - 1) {
          accumulator += "&";
        }
        return accumulator;
      },
      ""
    );

    if (queryParameters !== "") {
      queryParameters = `?${queryParameters}`;
    }
    return queryParameters;
  }
}
