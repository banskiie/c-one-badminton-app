import { ScrollView, StyleSheet, View } from "react-native"
import {
  Button,
  TextInput,
  Text,
  Checkbox,
  HelperText,
} from "react-native-paper"
import { useEffect, useReducer, useState } from "react"
import { Dropdown } from "react-native-element-dropdown"
import { InitialGameState, GameReducer } from "../../reducers/game"
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  doc,
  updateDoc,
} from "firebase/firestore"
import { FIRESTORE_DB, FIREBASE_AUTH } from "../../../firebase"

const AddGame = ({ route, navigation }: any) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [errors, setErrors] = useState<any>()
  // Game Data
  const [payload, dispatch] = useReducer(GameReducer, InitialGameState)
  const { details, sets, time, players, officials, statuses } = payload
  // Options
  const [categories, setCategories] = useState<any[]>([])
  const [format, setFormat] = useState<any[]>([
    { label: "Best of 1", value: 1 },
    { label: "Best of 3", value: 3 },
  ])
  // Player Count
  const [doubles, setDoubles] = useState<boolean>(false)

  // Categories Options
  useEffect(() => {
    const categoryRef = collection(FIRESTORE_DB, "categories")
    onSnapshot(query(categoryRef, orderBy("created_date", "asc")), {
      next: (snapshot) => {
        setCategories(
          snapshot.docs.map((doc: any) => ({
            label: `${doc.data().category_name} (${doc.data().category_type})`,
            value: `${doc.data().category_name}.${doc.data().category_type}`,
          }))
        )
      },
    })
    // Set Court to Current Court
    handleFieldChange("details.court", FIREBASE_AUTH.currentUser.displayName)
  }, [])

  // Navigation Header
  useEffect(() => {
    if (route && !!route.params) {
      for (const key in route.params.data) {
        if (key in InitialGameState) {
          dispatch({
            type: "SET_FIELD",
            field: key,
            value: route.params.data[key],
          })
        }
      }
    }
  }, [route])

  // Doubles Check
  useEffect(() => {
    if (details.category) {
      const values = details.category.split(".")
      const check = { ...errors }

      switch (values[1]) {
        case "singles":
          setDoubles(false)
          delete check[`team_a.player_2.nickname`]
          delete check[`team_a.player_2.first_name`]
          delete check[`team_a.player_2.last_name`]
          delete check[`team_b.player_2.nickname`]
          delete check[`team_b.player_2.first_name`]
          delete check[`team_b.player_2.last_name`]
          setErrors(check)
          break
        case "doubles":
          setDoubles(true)
          break
        default:
          setDoubles(false)
          break
      }
    }
  }, [doubles, details])

  // Check Error
  const checkErrors = (load: any) => {
    const data = { ...load.details, ...load.players }
    const check = { ...errors }
    for (const key in data) {
      switch (key) {
        case "category":
          if (!data[key]) {
            check[key] = "Please select a category"
          } else {
            delete check[key]
          }
          break
        case "no_of_sets":
          if (!data[key]) {
            check[key] = "Please select the number of sets."
          } else {
            delete check[key]
          }
          break
        case "max_score":
          if (data[key] <= 2) {
            check[key] = "Winning score must not be less than 2."
          } else if (details.plus_two_score - data[key] <= 1) {
            check[key] =
              "Winning score should less than 2 points away for the max score."
          } else {
            delete check[key]
          }
          break
        case "plus_two_score":
          if (data[key] - details.max_score <= 1) {
            check[key] =
              "Max score should less than 2 points away for the winning score."
          } else {
            delete check[key]
          }
          break
        case "team_a":
          const team_a_obj = data[key]
          for (const team_att in team_a_obj) {
            if (
              team_att === "player_1" ||
              !!(team_att === "player_2" && doubles)
            ) {
              const player = team_a_obj[team_att]
              for (const player_att in player) {
                switch (player_att) {
                  case "first_name":
                    if (!player[player_att] && !player.use_nickname) {
                      check[`team_a.${team_att}.${player_att}`] =
                        "First name must not be blank"
                    }
                    break
                  case "last_name":
                    if (!player[player_att] && !player.use_nickname) {
                      check[`team_a.${team_att}.${player_att}`] =
                        "Last name must not be blank"
                    }
                    break
                  case "nickname":
                    if (!player[player_att] && player.use_nickname) {
                      check[`team_a.${team_att}.${player_att}`] =
                        "Nickname must not be blank"
                    }
                    break
                }
              }
            }
          }
          break
        case "team_b":
          const team_b_obj = data[key]
          for (const team_att in team_b_obj) {
            if (
              team_att === "player_1" ||
              !!(team_att === "player_2" && doubles)
            ) {
              const player = team_b_obj[team_att]
              for (const player_att in player) {
                switch (player_att) {
                  case "first_name":
                    if (!player[player_att] && !player.use_nickname) {
                      check[`team_b.${team_att}.${player_att}`] =
                        "First name must not be blank"
                    }
                    break
                  case "last_name":
                    if (!player[player_att] && !player.use_nickname) {
                      check[`team_b.${team_att}.${player_att}`] =
                        "Last name must not be blank"
                    }
                    break
                  case "nickname":
                    if (!player[player_att] && player.use_nickname) {
                      check[`team_b.${team_att}.${player_att}`] =
                        "Nickname must not be blank"
                    }
                    break
                }
              }
            }
          }
          break
        default:
          break
      }
    }
    setErrors(check)
    if (Object.keys(check).length === 0) {
      return false
    } else {
      return true
    }
  }

  const handleFieldChange = (field: string, value: any) => {
    const fields = field.split(".")
    const updatedErrors = { ...errors }
    if (fields.length === 2) {
      const [object, attribute] = fields
      delete updatedErrors[attribute]
      if (attribute === "category") {
        const values = value.split(".")
        dispatch({
          type: "SET_FIELD",
          field: object,
          value: {
            ...payload[object],
            [attribute]: value,
            max_score: values[1] === "doubles" ? 31 : 21,
            plus_two_score: values[1] === "doubles" ? 40 : 30,
          },
        })
      } else if (attribute === "max_score") {
        dispatch({
          type: "SET_FIELD",
          field: object,
          value: {
            ...payload[object],
            [attribute]: Number.isNaN(value) ? 0 : value,
            plus_two_score: Number.isNaN(value) ? 0 : value + 9,
          },
        })
      } else if (attribute === "plus_two_rule") {
        if (!value) {
          dispatch({
            type: "SET_FIELD",
            field: object,
            value: {
              ...payload[object],
              [attribute]: value,
              plus_two_score: details.max_score + 9,
            },
          })
        } else {
          dispatch({
            type: "SET_FIELD",
            field: object,
            value: {
              ...payload[object],
              [attribute]: value,
            },
          })
        }
      } else if (attribute === "no_of_sets") {
        dispatch({
          type: "SET_FIELD",
          field: object,
          value: {
            ...payload[object],
            [attribute]: value,
          },
        })
        switch (value) {
          case 1:
            dispatch({
              type: "SET_FIELD",
              field: "sets",
              value: {
                set_1: {
                  a_score: 0,
                  b_score: 0,
                  current_round: 1,
                  last_team_scored: "",
                  winner: "",
                  scoresheet: [
                    {
                      team_scored: "",
                      scored_at: "",
                      current_a_score: 0,
                      current_b_score: 0,
                      a_switch: true,
                      b_switch: true,
                      scorer: "",
                      to_serve: "",
                      next_serve: "",
                    },
                  ],
                  switch: false,
                },
              },
            })
            break
          case 3:
            dispatch({
              type: "SET_FIELD",
              field: "sets",
              value: {
                set_1: {
                  a_score: 0,
                  b_score: 0,
                  current_round: 1,
                  last_team_scored: "",
                  winner: "",
                  scoresheet: [
                    {
                      team_scored: "",
                      scored_at: "",
                      current_a_score: 0,
                      current_b_score: 0,
                      a_switch: true,
                      b_switch: true,
                      scorer: "",
                      to_serve: "",
                      next_serve: "",
                    },
                  ],
                  switch: false,
                },
                set_2: {
                  a_score: 0,
                  b_score: 0,
                  current_round: 1,
                  last_team_scored: "",
                  winner: "",
                  scoresheet: [
                    {
                      team_scored: "",
                      scored_at: "",
                      current_a_score: 0,
                      current_b_score: 0,
                      a_switch: true,
                      b_switch: true,
                      scorer: "",
                      to_serve: "",
                      next_serve: "",
                    },
                  ],
                  switch: false,
                },
                set_3: {
                  a_score: 0,
                  b_score: 0,
                  current_round: 1,
                  last_team_scored: "",
                  winner: "",
                  scoresheet: [
                    {
                      team_scored: "",
                      scored_at: "",
                      current_a_score: 0,
                      current_b_score: 0,
                      a_switch: true,
                      b_switch: true,
                      scorer: "",
                      to_serve: "",
                      next_serve: "",
                    },
                  ],
                  switch: false,
                },
              },
            })
            break
        }
      } else {
        dispatch({
          type: "SET_FIELD",
          field: object,
          value: { ...payload[object], [attribute]: value },
        })
      }
    } else if (fields.length === 3 || fields.length === 4) {
      const [object, attribute, team_attribute, player_attribute] = fields
      if (fields.length === 3) {
        dispatch({
          type: "SET_FIELD",
          field: object,
          value: {
            ...payload[object],
            [attribute]: {
              ...payload[object][attribute],
              [team_attribute]: value,
            },
          },
        })
      } else {
        delete updatedErrors[
          `${attribute}.${team_attribute}.${player_attribute}`
        ]
        dispatch({
          type: "SET_FIELD",
          field: object,
          value: {
            ...payload[object],
            [attribute]: {
              ...payload[object][attribute],
              [team_attribute]: {
                ...payload[object][attribute][team_attribute],
                [player_attribute]: value,
              },
            },
          },
        })
      }
    } else {
      delete updatedErrors[field]
      setErrors(updatedErrors)
      dispatch({ type: "SET_FIELD", field, value })
    }
    setErrors(updatedErrors)
  }

  const submit = async () => {
    setLoading(true)
    try {
      const hasErrors = checkErrors(payload)
      if (!hasErrors) {
        if (!!route.params?.data && !!route.params?.id) {
          await updateDoc(doc(FIRESTORE_DB, "games", route.params.id), payload)
        } else {
          await addDoc(collection(FIRESTORE_DB, "games"), payload)
        }
        navigation.navigate("Games")
      } else {
        alert("Oops! You have an error!")
      }
    } catch (error: unknown) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.form}>
      {/* Rules */}
      <View style={{ padding: 5 }}>
        <Text
          style={{ textAlign: "center", fontWeight: "bold" }}
          variant="headlineSmall"
        >
          Rules
        </Text>
        <View>
          <Text style={styles.label}>Category</Text>
          <Dropdown
            data={categories}
            labelField="label"
            valueField="value"
            value={details.category}
            itemTextStyle={{ textTransform: "capitalize" }}
            selectedTextStyle={{ textTransform: "capitalize" }}
            placeholder="Select Category"
            onChange={(item) => {
              handleFieldChange("details.category", item.value)
            }}
            style={{
              ...styles.dropdown,
              borderColor: !!errors?.category ? "red" : "black",
            }}
          />
          {!!errors?.category && (
            <HelperText type="error" visible={!!errors?.category}>
              {errors?.category}
            </HelperText>
          )}
        </View>
        <View>
          <Text style={styles.label}>Format</Text>
          <Dropdown
            data={format}
            labelField="label"
            valueField="value"
            value={details.no_of_sets}
            placeholder="Select Format"
            onChange={(item) => {
              handleFieldChange("details.no_of_sets", +item.value)
            }}
            style={{
              ...styles.dropdown,
              borderColor: !!errors?.no_of_sets ? "red" : "black",
            }}
          />
          {!!errors?.no_of_sets && (
            <HelperText type="error" visible={!!errors?.no_of_sets}>
              {errors?.no_of_sets}
            </HelperText>
          )}
        </View>
        <View>
          <Text style={styles.label}>Winning Score</Text>
          <TextInput
            mode="outlined"
            keyboardType="number-pad"
            value={details.max_score == 0 ? "0" : details.max_score.toString()}
            onChangeText={(value) => {
              if (!(value.includes(".") || value.includes("-"))) {
                handleFieldChange("details.max_score", +value)
              }
            }}
            error={!!errors?.max_score}
          />
          {!!errors?.max_score && (
            <HelperText type="error" visible={!!errors?.max_score}>
              {errors?.max_score}
            </HelperText>
          )}
        </View>
        <View
          style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}
        >
          <Checkbox
            status={details.plus_two_rule ? "checked" : "unchecked"}
            onPress={() => {
              handleFieldChange("details.plus_two_rule", !details.plus_two_rule)
            }}
          />
          <Text variant="bodyLarge">Plus Two Rule?</Text>
        </View>
        {/* Plus Two Rule */}
        {details.plus_two_rule && (
          <>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 12,
              }}
            >
              <Checkbox
                status={
                  details.plus_two_score == 9999 ? "checked" : "unchecked"
                }
                onPress={() => {
                  handleFieldChange(
                    "details.plus_two_score",
                    details.plus_two_score == 9999
                      ? details.max_score + 9
                      : 9999
                  )
                }}
              />
              <Text variant="bodyLarge">No Limit</Text>
            </View>
            {details.plus_two_score !== 9999 && (
              <View>
                <Text style={styles.label}>Max Score</Text>
                <TextInput
                  mode="outlined"
                  keyboardType="number-pad"
                  value={
                    details.plus_two_score == 0
                      ? ""
                      : details.plus_two_score.toString()
                  }
                  onChangeText={(value) => {
                    handleFieldChange("details.plus_two_score", +value)
                  }}
                  error={!!errors?.plus_two_score}
                />
                {!!errors?.plus_two_score && (
                  <HelperText type="error" visible={!!errors?.plus_two_score}>
                    {errors?.plus_two_score}
                  </HelperText>
                )}
              </View>
            )}
          </>
        )}
        <View>
          {details.max_score > 0 && (
            <HelperText type="info" visible>
              *PLUS TWO: If the score is {details.max_score - 1}-
              {details.max_score - 1}, a side must win by two clear points to
              win the game.
              {details.plus_two_score !== 9999 &&
                `If it reaches ${details.plus_two_score - 1}-${details.plus_two_score - 1
                }, the first to get their ${details.plus_two_score
                } points wins.`}
            </HelperText>
          )}
        </View>
      </View>
      {/* Players */}
      {!!details.category && (
        <View style={{ paddingVertical: 12, gap: 10 }}>
          {/* Title */}
          <View>
            <Text
              style={{
                textAlign: "center",
                fontWeight: "bold",
              }}
              variant="headlineSmall"
            >
              Players
            </Text>
          </View>
          {/* Team A */}
          <View
            style={{
              backgroundColor: "#FAC898",
              borderRadius: 4,
              padding: 5,
              paddingBottom: 10,
            }}
          >
            <Text style={{ fontWeight: "bold" }} variant="headlineSmall">
              Team A
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text
                variant="bodyLarge"
                style={{ marginVertical: 5, marginHorizontal: 5 }}
              >
                Player 1 (Team A)
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Checkbox
                  status={
                    players.team_a.player_1.use_nickname
                      ? "checked"
                      : "unchecked"
                  }
                  onPress={() => {
                    handleFieldChange(
                      "players.team_a.player_1.use_nickname",
                      !players.team_a.player_1.use_nickname
                    )
                  }}
                />
                <Text variant="bodyLarge">Use nickname?</Text>
              </View>
            </View>
            <View style={{ gap: 10 }}>
              {players.team_a.player_1.use_nickname ? (
                <View>
                  <TextInput
                    mode="outlined"
                    placeholder="Nickname"
                    value={players.team_a.player_1.nickname}
                    onChangeText={(value) => {
                      handleFieldChange(
                        "players.team_a.player_1.nickname",
                        value
                      )
                    }}
                    error={!!errors?.["team_a.player_1.nickname"]}
                  />
                  {!!errors?.["team_a.player_1.nickname"] && (
                    <HelperText
                      type="error"
                      visible={!!errors?.["team_a.player_1.nickname"]}
                    >
                      {errors?.["team_a.player_1.nickname"]}
                    </HelperText>
                  )}
                </View>
              ) : (
                <>
                  <View>
                    <TextInput
                      mode="outlined"
                      placeholder="First Name"
                      value={players.team_a.player_1.first_name}
                      onChangeText={(value) => {
                        handleFieldChange(
                          "players.team_a.player_1.first_name",
                          value
                        )
                      }}
                      error={!!errors?.["team_a.player_1.first_name"]}
                    />
                    {!!errors?.["team_a.player_1.first_name"] && (
                      <HelperText
                        type="error"
                        visible={!!errors?.["team_a.player_1.first_name"]}
                      >
                        {errors?.["team_a.player_1.first_name"]}
                      </HelperText>
                    )}
                  </View>

                  <View>
                    <TextInput
                      mode="outlined"
                      placeholder="Last Name"
                      value={players.team_a.player_1.last_name}
                      onChangeText={(value) => {
                        handleFieldChange(
                          "players.team_a.player_1.last_name",
                          value
                        )
                      }}
                      error={!!errors?.["team_a.player_1.last_name"]}
                    />
                    {!!errors?.["team_a.player_1.last_name"] && (
                      <HelperText
                        type="error"
                        visible={!!errors?.["team_a.player_1.last_name"]}
                      >
                        {errors?.["team_a.player_1.last_name"]}
                      </HelperText>
                    )}
                  </View>
                </>
              )}
            </View>
            {doubles && (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    variant="bodyLarge"
                    style={{ marginVertical: 5, marginHorizontal: 5 }}
                  >
                    Player 2 (Team A)
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Checkbox
                      status={
                        players.team_a.player_2.use_nickname
                          ? "checked"
                          : "unchecked"
                      }
                      onPress={() => {
                        handleFieldChange(
                          "players.team_a.player_2.use_nickname",
                          !players.team_a.player_2.use_nickname
                        )
                      }}
                    />
                    <Text variant="bodyLarge">Use nickname?</Text>
                  </View>
                </View>
                <View style={{ gap: 10 }}>
                  {players.team_a.player_2.use_nickname ? (
                    <View>
                      <TextInput
                        mode="outlined"
                        placeholder="Nickname"
                        value={players.team_a.player_2.nickname}
                        onChangeText={(value) => {
                          handleFieldChange(
                            "players.team_a.player_2.nickname",
                            value
                          )
                        }}
                        error={!!errors?.["team_a.player_2.nickname"]}
                      />
                      {!!errors?.["team_a.player_2.nickname"] && (
                        <HelperText
                          type="error"
                          visible={!!errors?.["team_a.player_2.nickname"]}
                        >
                          {errors?.["team_a.player_2.nickname"]}
                        </HelperText>
                      )}
                    </View>
                  ) : (
                    <>
                      <View>
                        <TextInput
                          mode="outlined"
                          placeholder="First Name"
                          value={players.team_a.player_2.first_name}
                          onChangeText={(value) => {
                            handleFieldChange(
                              "players.team_a.player_2.first_name",
                              value
                            )
                          }}
                          error={!!errors?.["team_a.player_2.first_name"]}
                        />
                        {!!errors?.["team_a.player_2.first_name"] && (
                          <HelperText
                            type="error"
                            visible={!!errors?.["team_a.player_2.first_name"]}
                          >
                            {errors?.["team_a.player_2.first_name"]}
                          </HelperText>
                        )}
                      </View>

                      <View>
                        <TextInput
                          mode="outlined"
                          placeholder="Last Name"
                          value={players.team_a.player_2.last_name}
                          onChangeText={(value) => {
                            handleFieldChange(
                              "players.team_a.player_2.last_name",
                              value
                            )
                          }}
                          error={!!errors?.["team_a.player_2.last_name"]}
                        />
                        {!!errors?.["team_a.player_2.last_name"] && (
                          <HelperText
                            type="error"
                            visible={!!errors?.["team_a.player_2.last_name"]}
                          >
                            {errors?.["team_a.player_2.last_name"]}
                          </HelperText>
                        )}
                      </View>
                    </>
                  )}
                </View>
              </>
            )}
          </View>
          {/* Team B */}
          <View
            style={{
              backgroundColor: "#ddf6dd",
              borderRadius: 4,
              padding: 5,
              paddingBottom: 10,
            }}
          >
            <Text style={{ fontWeight: "bold" }} variant="headlineSmall">
              Team B
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text
                variant="bodyLarge"
                style={{ marginVertical: 5, marginHorizontal: 5 }}
              >
                Player 1 (Team B)
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Checkbox
                  status={
                    players.team_b.player_1.use_nickname
                      ? "checked"
                      : "unchecked"
                  }
                  onPress={() => {
                    handleFieldChange(
                      "players.team_b.player_1.use_nickname",
                      !players.team_b.player_1.use_nickname
                    )
                  }}
                />
                <Text variant="bodyLarge">Use nickname?</Text>
              </View>
            </View>
            <View style={{ gap: 10 }}>
              {players.team_b.player_1.use_nickname ? (
                <View>
                  <TextInput
                    mode="outlined"
                    placeholder="Nickname"
                    value={players.team_b.player_1.nickname}
                    onChangeText={(value) => {
                      handleFieldChange(
                        "players.team_b.player_1.nickname",
                        value
                      )
                    }}
                    error={!!errors?.["team_b.player_1.nickname"]}
                  />
                  {!!errors?.["team_b.player_1.nickname"] && (
                    <HelperText
                      type="error"
                      visible={!!errors?.["team_b.player_1.nickname"]}
                    >
                      {errors?.["team_b.player_1.nickname"]}
                    </HelperText>
                  )}
                </View>
              ) : (
                <>
                  <View>
                    <TextInput
                      mode="outlined"
                      placeholder="First Name"
                      value={players.team_b.player_1.first_name}
                      onChangeText={(value) => {
                        handleFieldChange(
                          "players.team_b.player_1.first_name",
                          value
                        )
                      }}
                      error={!!errors?.["team_b.player_1.first_name"]}
                    />
                    {!!errors?.["team_b.player_1.first_name"] && (
                      <HelperText
                        type="error"
                        visible={!!errors?.["team_b.player_1.first_name"]}
                      >
                        {errors?.["team_b.player_1.first_name"]}
                      </HelperText>
                    )}
                  </View>

                  <View>
                    <TextInput
                      mode="outlined"
                      placeholder="Last Name"
                      value={players.team_b.player_1.last_name}
                      onChangeText={(value) => {
                        handleFieldChange(
                          "players.team_b.player_1.last_name",
                          value
                        )
                      }}
                      error={!!errors?.["team_b.player_1.last_name"]}
                    />
                    {!!errors?.["team_b.player_1.last_name"] && (
                      <HelperText
                        type="error"
                        visible={!!errors?.["team_b.player_1.last_name"]}
                      >
                        {errors?.["team_b.player_1.last_name"]}
                      </HelperText>
                    )}
                  </View>
                </>
              )}
            </View>
            {doubles && (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    variant="bodyLarge"
                    style={{ marginVertical: 5, marginHorizontal: 5 }}
                  >
                    Player 2 (Team B)
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Checkbox
                      status={
                        players.team_b.player_2.use_nickname
                          ? "checked"
                          : "unchecked"
                      }
                      onPress={() => {
                        handleFieldChange(
                          "players.team_b.player_2.use_nickname",
                          !players.team_b.player_2.use_nickname
                        )
                      }}
                    />
                    <Text variant="bodyLarge">Use nickname?</Text>
                  </View>
                </View>
                <View style={{ gap: 10 }}>
                  {players.team_b.player_2.use_nickname ? (
                    <View>
                      <TextInput
                        mode="outlined"
                        placeholder="Nickname"
                        value={players.team_b.player_2.nickname}
                        onChangeText={(value) => {
                          handleFieldChange(
                            "players.team_b.player_2.nickname",
                            value
                          )
                        }}
                        error={!!errors?.["team_b.player_2.nickname"]}
                      />
                      {!!errors?.["team_b.player_2.nickname"] && (
                        <HelperText
                          type="error"
                          visible={!!errors?.["team_b.player_2.nickname"]}
                        >
                          {errors?.["team_b.player_2.nickname"]}
                        </HelperText>
                      )}
                    </View>
                  ) : (
                    <>
                      <View>
                        <TextInput
                          mode="outlined"
                          placeholder="First Name"
                          value={players.team_b.player_2.first_name}
                          onChangeText={(value) => {
                            handleFieldChange(
                              "players.team_b.player_2.first_name",
                              value
                            )
                          }}
                          error={!!errors?.["team_b.player_2.first_name"]}
                        />
                        {!!errors?.["team_b.player_2.first_name"] && (
                          <HelperText
                            type="error"
                            visible={!!errors?.["team_b.player_2.first_name"]}
                          >
                            {errors?.["team_b.player_2.first_name"]}
                          </HelperText>
                        )}
                      </View>

                      <View>
                        <TextInput
                          mode="outlined"
                          placeholder="Last Name"
                          value={players.team_b.player_2.last_name}
                          onChangeText={(value) => {
                            handleFieldChange(
                              "players.team_b.player_2.last_name",
                              value
                            )
                          }}
                          error={!!errors?.["team_b.player_2.last_name"]}
                        />
                        {!!errors?.["team_b.player_2.last_name"] && (
                          <HelperText
                            type="error"
                            visible={!!errors?.["team_b.player_2.last_name"]}
                          >
                            {errors?.["team_b.player_2.last_name"]}
                          </HelperText>
                        )}
                      </View>
                    </>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      )}

      <View style={{ paddingBottom: 25 }}>
        <Button
          loading={loading}
          disabled={loading}
          mode="contained"
          onPress={submit}
        >
          Submit
        </Button>
      </View>
    </ScrollView>
  )
}

export default AddGame

const styles = StyleSheet.create({
  form: {
    display: "flex",
    padding: 12,
  },
  label: { marginVertical: 5, marginHorizontal: 5 },
  dropdown: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "grey",
    backgroundColor: "white",
  },
})
