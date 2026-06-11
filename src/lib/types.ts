export type Match = {
  id: number;
  stage: string | null;
  group_name: string | null;
  matchday: number | null;
  home_team: string;
  away_team: string;
  home_crest: string | null;
  away_crest: string | null;
  utc_kickoff: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
};

export type Prediction = {
  id: string;
  user_id: string;
  match_id: number;
  pred_home: number;
  pred_away: number;
  points: number;
};

export type LeaderboardRow = {
  user_id: string;
  display_name: string;
  total_points: number;
  exactos: number;
  signos: number;
  pronosticos: number;
};
