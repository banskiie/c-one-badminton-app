// Details
type Details = {
  created_date: any
  game_no: string
  court: string
  category:
    | {
        name: string
        type: string
      }
    | string
  group_no: string
  no_of_sets: 1 | 3
  max_score: 21 | 31
  game_winner: string
  shuttles_used: number
  playing_set: 1 | 2 | 3
  plus_two_rule: false
  plus_two_score: number
}

// Per Set
type Sets = {
  set_1: Set
  set_2?: Set
  set_3?: Set
}

type Set = {
  a_score: number
  b_score: number
  current_round: number
  last_team_scored: string
  winner: string
  scoresheet: Round[]
  switch: boolean
}

type Round = {
  current_a_score: number
  current_b_score: number
  scorer: string
  team_scored: string
}

// Times
type Time = {
  slot: any
  start: any
  end: any
}

// Players
type Players = {
  team_a: Team
  team_b: Team
}

type Team = {
  team_name?: string
  player_1: Player
  player_2: Player
}

type Player = {
  first_name: string
  last_name: string
  nickname?: string
  use_nickname: boolean
}

// Officials
type Officials = {
  umpire: string
  referee: string
  service_judge?: string
}

// Status
type Statuses = {
  current: "upcoming" | "current" | "forfeit" | "no match" | "finished"
  active: boolean
}

export type Game = {
  details: Details
  sets: Sets
  time: Time
  players: Players
  officials: Officials
  statuses: Statuses
}

export const InitialGameState: Game = {
  details: {
    created_date: Date.now(),
    game_no: "",
    court: "",
    category: "",
    group_no: "",
    no_of_sets: 1,
    max_score: 21,
    game_winner: "",
    shuttles_used: 0,
    playing_set: 1,
    plus_two_rule: false,
    plus_two_score: 30,
  },
  sets: {
    set_1: {
      a_score: 0,
      b_score: 0,
      current_round: 1,
      last_team_scored: "",
      winner: "",
      scoresheet: [],
      switch: false,
    },
  },
  time: {
    slot: "",
    start: "",
    end: "",
  },
  players: {
    team_a: {
      team_name: "",
      player_1: {
        first_name: "",
        last_name: "",
        nickname: "",
        use_nickname: true,
      },
      player_2: {
        first_name: "",
        last_name: "",
        nickname: "",
        use_nickname: true,
      },
    },
    team_b: {
      team_name: "",
      player_1: {
        first_name: "",
        last_name: "",
        nickname: "",
        use_nickname: true,
      },
      player_2: {
        first_name: "",
        last_name: "",
        nickname: "",
        use_nickname: true,
      },
    },
  },
  officials: {
    umpire: "",
    service_judge: "",
    referee: "",
  },
  statuses: {
    current: "upcoming",
    active: false,
  },
}

export const GameReducer = (state: any, action: any) => {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value }
    case "RESET_FIELDS":
      return InitialGameState
    default:
      return state
  }
}
