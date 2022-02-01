import { Twitter } from "./api/twitter";
import { UserCredentials } from "./user-credentials";
import { UserIdResponse } from "./interfaces/twitter/user-id-response";
import { GetTweetResponse } from "./interfaces/twitter/get-tweet-response";
import { FavoriteListResponse } from "./interfaces/twitter/favorite-list-response";

class ManageTwitter {
  private client: Twitter;
  private userCredentials: UserCredentials;
  private id: string;

  constructor() {
    this.userCredentials = new UserCredentials();
    this.client = new Twitter(this.userCredentials);
  }

  async clearYourTwitterAccount() {
    await this.deleteAllTweets();
    await this.deleteAllLikes();
    console.log("The app finished cleaning.");
  }

  private async deleteAllTweets(): Promise<void> {
    await this.getTwitterUserId();
    let errors: any[] = [];
    let tweetsIds: string[] = await this.getTweetsIds();

    while (tweetsIds.length > 0) {
      const deleteTweetsPromises = tweetsIds.map((tweetId) =>
        this.client.post(`statuses/destroy/${tweetId}.json`, {})
      );
      const results = await Promise.allSettled(deleteTweetsPromises);
      const foundErrors = results.filter(
        (result) => result.status === "rejected"
      );

      if (foundErrors.length > 0) {
        errors = errors.concat(foundErrors);
      }

      tweetsIds = await this.getTweetsIds();
    }

    if (errors.length > 0) {
      console.log(errors);
    }
  }

  private async deleteAllLikes(): Promise<void> {
    let errors: any[] = [];
    let favoriteListTweetId = await this.getFavoriteTweetIdList();

    while (favoriteListTweetId.length > 0) {
      const deleteLikesPromise = favoriteListTweetId.map((tweetId) =>
        this.client.post(`favorites/destroy.json?id=${tweetId}`, {})
      );

      const results = await Promise.allSettled(deleteLikesPromise);
      const foundErrors = results.filter(
        (result) => result.status === "rejected"
      );

      if (foundErrors.length > 0) {
        errors = errors.concat(foundErrors);
      }

      favoriteListTweetId = await this.getFavoriteTweetIdList();
    }

    if (errors.length > 0) {
      console.log(errors);
    }
  }

  private async getFavoriteTweetIdList(): Promise<string[]> {
    const favoriteList: FavoriteListResponse[] = await this.client.get(
      `favorites/list.json`,
      { count: "100" }
    );
    return favoriteList.map((favorite) => favorite.id_str);
  }

  private async getTwitterUserId(): Promise<void> {
    if (!this.id) {
      const result: UserIdResponse = await this.client.get(
        "users/by/username/deverasigor",
        {}
      );
      this.id = result.data.id;
    }
  }

  private async getTweetsIds(): Promise<string[]> {
    const tweets: GetTweetResponse = await this.client.get(
      `users/${this.id}/tweets`,
      {}
    );
    if (!tweets.data) {
      return [];
    }
    return tweets.data.map((tweet) => tweet.id);
  }
}

const manageTwitter = new ManageTwitter();
manageTwitter.clearYourTwitterAccount();
