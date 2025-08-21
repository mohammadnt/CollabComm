
export interface DataResponse {
  user: CollabUserInfo;
  is_cache_cleared: boolean;
}


export interface CollabUserInfo {
  id: string;
  creation_date: string;
  first_name: string;
  last_name: string;
  username: string;
  type: number;
  last_message_counter: number;
  media_id: string;

}
