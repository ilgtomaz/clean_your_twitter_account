export interface Tweet {
  conversation_id: string;
  id: string;
  text: string;
}

interface Meta {
  newest_id: string;
  next_token: string;
  oldest_id: string;
  result_count: number;
}

export interface GetTweetResponse {
  data: Tweet[];
  meta: Meta;
}