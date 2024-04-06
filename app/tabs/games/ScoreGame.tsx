import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  updateDoc,
  where,
} from "firebase/firestore"
import { Button, IconButton, List, Surface, Text } from "react-native-paper"
import { useEffect, useRef, useState } from "react"
import { StyleSheet, ScrollView, View, Animated } from "react-native"
import { FIRESTORE_DB } from "../../../firebase"
import { theme } from "../../theme/theme"
import * as ScreenOrientation from "expo-screen-orientation"
import Loading from "../../components/Loading"
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs"
import moment from "moment"
import Timer from "../../components/Timer"
import { Dropdown } from "react-native-element-dropdown"

const Tab = createMaterialTopTabNavigator()

const Score = ({ route, navigation }) => {
  const { id } = route.params
  const [data, setData] = useState<any>()
  const [gameRef, setGameRef] = useState<any>()
  const [hasPlayer2, setHasPlayer2] = useState<boolean>(false)
  // Loading
  const [loading, setLoading] = useState<boolean>(false)
  const [changingSet, setChangingSet] = useState<boolean>(true)

  // Fetch Game Data
  useEffect(() => {
    const ref = doc(FIRESTORE_DB, "games", id)
    const sub = onSnapshot(ref, {
      next: (snapshot) => {
        if (snapshot.exists()) {
          const snap = snapshot.data()
          if (snap.details.category.split(".")[1] === "doubles") {
            setHasPlayer2(true)
          } else {
            setHasPlayer2(false)
          }
          setData(snap)
          setGameRef(ref)
          setChangingSet(false)
        }
      },
    })

    return () => sub()
  }, [id])

  const start = async () => {
    setLoading(true)
    try {
      await runTransaction(FIRESTORE_DB, async (transaction) => {
        // Disable All Other Games to Inactive
        const gamesRef = collection(FIRESTORE_DB, "games")
        const gamesQuery = query(
          gamesRef,
          where("details.court", "==", data.details.court),
          where("statuses.active", "==", true)
        )
        const gamesSnap = await getDocs(gamesQuery)

        gamesSnap.forEach((doc) => {
          const gameRef = doc.ref
          const docData = doc.data()
          transaction.update(gameRef, {
            ...docData,
            statuses: {
              ...docData.statuses,
              active: false,
            },
          })
        })

        // Set Current Selected Game as Active
        const currentRef = doc(FIRESTORE_DB, "games", id)
        const currentDoc = await getDoc(currentRef)
        if (currentDoc.exists()) {
          const data = currentDoc.data()
          transaction.update(currentRef, {
            ...data,
            statuses: {
              ...data.statuses,
              active: true,
              current: "current",
            },
            time: {
              ...data.time,
              start: moment().toDate(),
            },
          })
        }

        // Update court status to active
        const courtRef = doc(FIRESTORE_DB, "courts", data.details.court)
        const courtDoc = await getDoc(courtRef)
        if (courtDoc.exists()) {
          transaction.update(courtRef, { active: true })
        }
      })
    } catch (error: any) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const score = async (scorer: string) => {
    setLoading(true)
    try {
      const current = `set_${data.details.playing_set}`
      const updatedScoreSheet = data.sets[current].scoresheet
      const team = scorer[0]
      updatedScoreSheet[data.sets[current].current_round - 1] = {
        team_scored: team,
        current_a_score: (team == "a" ? 1 : 0) + data?.sets[current].a_score,
        current_b_score: (team == "b" ? 1 : 0) + data?.sets[current].b_score,
        scorer: scorer,
      }

      switch (team) {
        case "a":
          await updateDoc(gameRef, {
            sets: {
              ...data.sets,
              [`set_${data.details.playing_set}`]: {
                ...data.sets[current],
                current_round: data.sets[current].current_round + 1,
                a_score: data.sets[current].a_score + 1,
                scoresheet: [...updatedScoreSheet],
                last_team_scored: team,
                winner:
                  data.sets[current].a_score + 1 >= data.details.max_score
                    ? "a"
                    : "",
              },
            },
          })
          break
        case "b":
          await updateDoc(gameRef, {
            sets: {
              ...data.sets,
              [`set_${data.details.playing_set}`]: {
                ...data.sets[current],
                current_round: data.sets[current].current_round + 1,
                b_score: data.sets[current].b_score + 1,
                scoresheet: [...updatedScoreSheet],
                last_team_scored: team,
                winner:
                  data.sets[current].b_score + 1 >= data.details.max_score
                    ? "b"
                    : "",
              },
            },
          })
          break
      }
    } catch (error: any) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const undo = async () => {
    setLoading(true)
    try {
      const current = `set_${data.details.playing_set}`
      const currentRow = data?.sets[current].scoresheet.length - 1
      const currentTeamScored =
        data?.sets[current].scoresheet[currentRow].team_scored
      // Update Scoresheet
      const updatedScoreSheet = data.sets[current].scoresheet
      updatedScoreSheet.pop()

      switch (currentTeamScored) {
        case "a":
          await updateDoc(gameRef, {
            sets: {
              ...data.sets,
              [`set_${data.details.playing_set}`]: {
                ...data.sets[current],
                current_round: data.sets[current].current_round - 1,
                a_score: data.sets[current].a_score - 1,
                scoresheet: [...updatedScoreSheet],
                last_team_scored:
                  updatedScoreSheet.length > 0
                    ? updatedScoreSheet[updatedScoreSheet.length - 1]
                        .team_scored
                    : "",
                winner: "",
              },
            },
          })
          break
        case "b":
          await updateDoc(gameRef, {
            sets: {
              ...data.sets,
              [`set_${data.details.playing_set}`]: {
                ...data.sets[current],
                current_round: data.sets[current].current_round - 1,
                b_score: data.sets[current].b_score - 1,
                scoresheet: [...updatedScoreSheet],
                last_team_scored:
                  updatedScoreSheet.length > 0
                    ? updatedScoreSheet[updatedScoreSheet.length - 1]
                        .team_scored
                    : "",
                winner: "",
              },
            },
          })
          break
      }
    } catch (error: any) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const finish = async () => {
    setLoading(true)
    try {
      await updateDoc(gameRef, {
        details: {
          ...data.details,
          game_winner:
            Object.values(data.sets).filter((set: any) => set.winner === "a")
              .length >= 2
              ? "a"
              : Object.values(data.sets).filter(
                  (set: any) => set.winner === "b"
                ).length >= 2
              ? "b"
              : "",
        },
        statuses: { ...data.statuses, current: "finished" },
        time: { ...data.time, end: moment().toDate() },
      })
      navigation.navigate("Games")
    } catch (error: any) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const changeSet = async (value: number) => {
    setChangingSet(true)
    try {
      await updateDoc(gameRef, {
        details: { ...data.details, playing_set: value },
      })
    } catch (error: any) {
      console.error(error)
    } finally {
      setChangingSet(false)
    }
  }

  const handleScoreboard = async () => {
    try {
      await runTransaction(FIRESTORE_DB, async (transaction) => {
        const snap = await transaction.get(doc(FIRESTORE_DB, "games", id))
        const game = snap.data()
        // Game Update
        transaction.update(doc(FIRESTORE_DB, "games", id), {
          ...data,
          statuses: {
            ...data.statuses,
            active: !game?.statuses.active,
          },
        })
        // Court Update
        const courtName = game?.details.court
        const courtQuery = query(
          collection(FIRESTORE_DB, "courts"),
          where("court_name", "==", courtName)
        )
        const courtSnapshot = await getDocs(courtQuery)
        if (!courtSnapshot.empty) {
          transaction.update(
            doc(FIRESTORE_DB, "courts", courtSnapshot.docs[0].id),
            {
              court_in_use: !game?.statuses.active,
            }
          )
        }
      })
    } catch (error) {
      console.error(error)
    }
  }

  const reset = async () => {
    setChangingSet(true)
    try {
      await updateDoc(gameRef, {
        sets: {
          ...data.sets,
          [`set_${data.details.playing_set}`]: {
            a_score: 0,
            b_score: 0,
            current_round: 1,
            last_team_scored: "",
            scoresheet: [],
            shuttles_used: 0,
            winner: "",
          },
        },
      })
    } catch (error: any) {
      console.error(error)
    } finally {
      setChangingSet(false)
    }
  }

  if (changingSet) {
    return <Loading />
  }

  return (
    <>
      {!!data?.time.start ? (
        <ScrollView>
          <View style={{ flex: 1, padding: 12, gap: 8 }}>
            {data?.details.no_of_sets > 1 && (
              <Dropdown
                style={styles.dropdown}
                selectedTextStyle={{ textAlign: "center" }}
                placeholderStyle={{ textAlign: "center" }}
                data={Array.from({
                  length:
                    Object.values(data?.sets).filter(
                      (set: any) => set.winner !== ""
                    ).length == 2 &&
                    !!(
                      Object.values(data.sets).filter(
                        (set: any) => set.winner === "a"
                      ).length >= 2 ||
                      Object.values(data.sets).filter(
                        (set: any) => set.winner === "b"
                      ).length >= 2
                    )
                      ? 2
                      : Object.values(data?.sets).filter(
                          (set: any) => set.winner !== ""
                        ).length + 1,
                }).map((_, index) => ({
                  label: `SET ${index + 1}`,
                  value: index + 1,
                }))}
                value={!changingSet ? data.details.playing_set : ""}
                mode="default"
                labelField="label"
                valueField="value"
                placeholder="Select Set"
                onChange={(item: any) => changeSet(item.value)}
              />
            )}
            {!!(
              data?.details.no_of_sets === 1 &&
              !!(
                data.sets[`set_${data.details.playing_set}`].a_score >=
                  data.details.max_score ||
                data.sets[`set_${data.details.playing_set}`].b_score >=
                  data.details.max_score
              )
            ) ||
              (!!(
                data?.details.no_of_sets === 3 &&
                !!(
                  Object.values(data.sets).filter(
                    (set: any) => set.winner === "a"
                  ).length >= 2 ||
                  Object.values(data.sets).filter(
                    (set: any) => set.winner === "b"
                  ).length >= 2
                )
              ) && (
                <Button mode="contained" onPress={finish}>
                  Finish
                </Button>
              ))}
            {!!(!!data?.time.start && !data?.time.end) && (
              <Timer start={data?.time.start} />
            )}
            {/* Team Name and Score */}
            <View
              style={{
                display: "flex",
                flexDirection:
                  data?.details.playing_set % 2 === 0 ? "row-reverse" : "row",
                justifyContent: "space-between",
              }}
            >
              <View
                style={{
                  backgroundColor: "#FAC898",
                  width: "49.5%",
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 8,
                }}
              >
                {data.sets[`set_${data.details.playing_set}`].a_score >=
                  data.details.max_score && (
                  <Text
                    style={{
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      position: "absolute",
                      marginTop: -24,
                    }}
                  >
                    Winner ♛
                  </Text>
                )}
                <Text>
                  {!!data.players.team_a.team_name
                    ? data.players.team_a.team_name
                    : "Team A"}{" "}
                </Text>
                <Text variant="displayLarge">
                  {data.sets[`set_${data.details.playing_set}`].a_score}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: "#ddf6dd",
                  width: "49.5%",
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 8,
                }}
              >
                {data.sets[`set_${data.details.playing_set}`].b_score >=
                  data.details.max_score && (
                  <Text
                    style={{
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      position: "absolute",
                      marginTop: -24,
                    }}
                  >
                    Winner ♛
                  </Text>
                )}
                <Text>
                  {!!data.players.team_b.team_name
                    ? data.players.team_b.team_name
                    : "Team B"}{" "}
                </Text>
                <Text variant="displayLarge">
                  {data.sets[`set_${data.details.playing_set}`].b_score}
                </Text>
              </View>
            </View>
            {/* Players */}
            <View
              style={{
                display: "flex",
                flexDirection:
                  data?.details.playing_set % 2 === 0 ? "row-reverse" : "row",
                justifyContent: "space-between",
              }}
            >
              <View
                style={{
                  backgroundColor: "#FAC898",
                  width: "49.5%",
                  display: "flex",
                  justifyContent: "center",
                  paddingRight: 8,
                  borderRadius: 8,
                  height: 120,
                }}
              >
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <IconButton
                      icon="plus"
                      size={24}
                      mode="contained-tonal"
                      containerColor="#ddf6dd"
                      onPress={() => score("a1")}
                      loading={loading}
                      disabled={
                        loading ||
                        !!(
                          data.sets[`set_${data.details.playing_set}`]
                            .a_score >= data.details.max_score ||
                          data.sets[`set_${data.details.playing_set}`]
                            .b_score >= data.details.max_score
                        )
                      }
                    />
                    <Text
                      style={{
                        fontSize: 30,
                        fontWeight: "bold",
                      }}
                    >
                      {data?.players.team_a.player_1.use_nickname
                        ? data?.players.team_a.player_1.nickname
                        : `${data?.players.team_a.player_1.first_name} ${data?.players.team_a.player_1.last_name}`}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 30, fontWeight: "bold" }}>
                    {
                      data?.sets[
                        `set_${data.details.playing_set}`
                      ].scoresheet.filter(
                        (round: any) => round?.scorer === "a1"
                      ).length
                    }
                  </Text>
                </View>
                {hasPlayer2 && (
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <IconButton
                        icon="plus"
                        size={24}
                        mode="contained-tonal"
                        containerColor="#ddf6dd"
                        onPress={() => score("a2")}
                        loading={loading}
                        disabled={
                          loading ||
                          !!(
                            data.sets[`set_${data.details.playing_set}`]
                              .a_score >= data.details.max_score ||
                            data.sets[`set_${data.details.playing_set}`]
                              .b_score >= data.details.max_score
                          )
                        }
                      />
                      <Text style={{ fontSize: 30, fontWeight: "bold" }}>
                        {data?.players.team_a.player_2.use_nickname
                          ? data?.players.team_a.player_2.nickname
                          : `${data?.players.team_a.player_2.first_name} ${data?.players.team_a.player_2.last_name}`}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 30, fontWeight: "bold" }}>
                      {
                        data?.sets[
                          `set_${data.details.playing_set}`
                        ].scoresheet.filter(
                          (round: any) => round?.scorer === "a2"
                        ).length
                      }
                    </Text>
                  </View>
                )}
              </View>
              <View
                style={{
                  backgroundColor: "#ddf6dd",
                  width: "49.5%",
                  display: "flex",
                  justifyContent: "center",
                  paddingRight: 8,
                  borderRadius: 8,
                  height: 120,
                }}
              >
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <IconButton
                      icon="plus"
                      size={24}
                      mode="contained-tonal"
                      containerColor="#FAC898"
                      onPress={() => score("b1")}
                      loading={loading}
                      disabled={
                        loading ||
                        !!(
                          data.sets[`set_${data.details.playing_set}`]
                            .a_score >= data.details.max_score ||
                          data.sets[`set_${data.details.playing_set}`]
                            .b_score >= data.details.max_score
                        )
                      }
                    />
                    <Text style={{ fontSize: 30, fontWeight: "bold" }}>
                      {data?.players.team_b.player_1.use_nickname
                        ? data?.players.team_b.player_1.nickname
                        : `${data?.players.team_b.player_1.first_name} ${data?.players.team_b.player_1.last_name}`}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 30, fontWeight: "bold" }}>
                    {
                      data?.sets[
                        `set_${data.details.playing_set}`
                      ].scoresheet.filter(
                        (round: any) => round?.scorer === "b1"
                      ).length
                    }
                  </Text>
                </View>
                {hasPlayer2 && (
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <IconButton
                        icon="plus"
                        size={24}
                        mode="contained-tonal"
                        containerColor="#FAC898"
                        onPress={() => score("b2")}
                        loading={loading}
                        disabled={
                          loading ||
                          !!(
                            data.sets[`set_${data.details.playing_set}`]
                              .a_score >= data.details.max_score ||
                            data.sets[`set_${data.details.playing_set}`]
                              .b_score >= data.details.max_score
                          )
                        }
                      />
                      <Text style={{ fontSize: 30, fontWeight: "bold" }}>
                        {data?.players.team_b.player_2.use_nickname
                          ? data?.players.team_b.player_2.nickname
                          : `${data?.players.team_b.player_2.first_name} ${data?.players.team_b.player_2.last_name}`}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 30, fontWeight: "bold" }}>
                      {
                        data?.sets[
                          `set_${data.details.playing_set}`
                        ].scoresheet.filter(
                          (round: any) => round?.scorer === "b2"
                        ).length
                      }
                    </Text>
                  </View>
                )}
              </View>
            </View>
            {/* Action Buttons */}
            <View
              style={{
                width: "100%",
                flex: 1,
                flexDirection: "row",
                justifyContent: "space-evenly",
              }}
            >
              <Button
                loading={loading}
                style={{
                  width:
                    data.sets[`set_${data.details.playing_set}`].scoresheet
                      .length > 0
                      ? "30%"
                      : "80%",
                }}
                mode="contained"
                onPress={handleScoreboard}
                buttonColor={data?.statuses.active ? "#506A88" : "#789FCC"}
                disabled={loading}
              >
                {data?.statuses.active ? "Hide" : "Show"} Scoreboard
              </Button>
              {data?.sets[`set_${data.details.playing_set}`].scoresheet.length >
                0 && (
                <>
                  <Button
                    loading={loading}
                    buttonColor="#F7CAC9"
                    style={{ width: "30%" }}
                    mode="contained"
                    icon="undo-variant"
                    textColor="red"
                    onPress={undo}
                    disabled={loading}
                  >
                    Undo Score
                  </Button>
                  <Button
                    style={{ width: "30%" }}
                    loading={loading}
                    mode="contained"
                    onPress={reset}
                    disabled={loading}
                    textColor="black"
                    icon="restore-alert"
                    buttonColor="skyblue"
                  >
                    Reset
                  </Button>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      ) : (
        <View>
          <Button mode="contained" onPress={start}>
            Start
          </Button>
        </View>
      )}
    </>
  )
}

const Scoresheet = ({ route }) => {
  const { id } = route.params
  const [data, setData] = useState<any>()
  const [hasPlayer2, setHasPlayer2] = useState<boolean>(false)

  // Fetch Game Data
  useEffect(() => {
    const ref = doc(FIRESTORE_DB, "games", id)
    const sub = onSnapshot(ref, {
      next: (snapshot) => {
        if (snapshot.exists()) {
          const snap = snapshot.data()
          if (snap.details.category.split(".")[1] === "doubles") {
            setHasPlayer2(true)
          } else {
            setHasPlayer2(false)
          }
          setData(snap)
        }
      },
    })

    return () => sub()
  }, [id])

  return (
    <>
      {/* Scoresheet */}
      <View style={styles.scoresheet}>
        {/* Players */}
        <View style={{ minWidth: "30%" }}>
          {/* TEAM A */}
          {/* Player 1 */}
          <View
            style={{
              ...styles.box,
              width: "100%",
              alignItems: "flex-start",
              paddingLeft: 5,
            }}
          >
            <Text variant="bodyLarge">
              {data?.players.team_a.player_1.use_nickname
                ? data?.players.team_a.player_1.nickname
                : `${data?.players.team_a.player_1.first_name[0]}. ${data?.players.team_a.player_1.last_name}`}{" "}
              (
              {
                data?.sets[`set_${data.details.playing_set}`].scoresheet.filter(
                  (round: any) => round?.scorer === "a1"
                ).length
              }
              )
            </Text>
          </View>
          {hasPlayer2 && (
            <View
              style={{
                ...styles.box,
                width: "100%",
                alignItems: "flex-start",
                paddingLeft: 5,
              }}
            >
              <Text variant="bodyLarge">
                {data?.players.team_a.player_2.use_nickname
                  ? data?.players.team_a.player_2.nickname
                  : `${data?.players.team_a.player_2.first_name[0]}. ${data?.players.team_a.player_2.last_name}`}{" "}
                (
                {
                  data?.sets[
                    `set_${data.details.playing_set}`
                  ].scoresheet.filter((round: any) => round?.scorer === "a2")
                    .length
                }
                )
              </Text>
            </View>
          )}
          {/* TEAM B */}
          {/* Player 1 */}
          <View
            style={{
              ...styles.box,
              backgroundColor: "#a6a6a6",
              width: "100%",
              alignItems: "flex-start",
              paddingLeft: 5,
            }}
          >
            <Text variant="bodyLarge">
              {data?.players.team_b.player_1.use_nickname
                ? data?.players.team_b.player_1.nickname
                : `${data?.players.team_b.player_1.first_name[0]}. ${data?.players.team_b.player_1.last_name}`}{" "}
              (
              {
                data?.sets[`set_${data.details.playing_set}`].scoresheet.filter(
                  (round: any) => round?.scorer === "b1"
                ).length
              }
              )
            </Text>
          </View>
          {hasPlayer2 && (
            <View
              style={{
                ...styles.box,
                backgroundColor: "#a6a6a6",
                width: "100%",
                alignItems: "flex-start",
                paddingLeft: 5,
              }}
            >
              <Text variant="bodyLarge">
                {data?.players.team_b.player_2.use_nickname
                  ? data?.players.team_b.player_2.nickname
                  : `${data?.players.team_b.player_2.first_name[0]}. ${data?.players.team_b.player_2.last_name}`}{" "}
                (
                {
                  data?.sets[
                    `set_${data.details.playing_set}`
                  ].scoresheet.filter((round: any) => round?.scorer === "b2")
                    .length
                }
                )
              </Text>
            </View>
          )}
        </View>
        {/* Score */}
        <ScrollView
          horizontal={true}
          style={{
            display: "flex",
            flexDirection: "row",
            width: "60%",
          }}
        >
          <View>
            {hasPlayer2 && (
              <Surface mode="flat" style={styles.box} elevation={5}>
                {""}
              </Surface>
            )}
            <Surface mode="flat" style={styles.box} elevation={5}>
              <Text variant="bodyLarge" style={styles.score}>
                0
              </Text>
            </Surface>
            <Surface
              mode="flat"
              style={{ ...styles.box, backgroundColor: "#a6a6a6" }}
              elevation={5}
            >
              <Text variant="bodyLarge" style={styles.score}>
                0
              </Text>
            </Surface>
            {hasPlayer2 && (
              <Surface
                mode="flat"
                style={{ ...styles.box, backgroundColor: "#a6a6a6" }}
                elevation={5}
              >
                {""}
              </Surface>
            )}
          </View>
          {data?.sets[`set_${data.details.playing_set}`].scoresheet.length >
            0 && (
            <>
              {data?.sets[`set_${data.details.playing_set}`].scoresheet.map(
                (score: any, index: number) => {
                  return (
                    <View key={index}>
                      <Surface mode="flat" style={styles.box} elevation={5}>
                        <Text style={styles.score} variant="bodyLarge">
                          {score?.scorer === "a1" && score.current_a_score}
                        </Text>
                      </Surface>
                      {hasPlayer2 && (
                        <Surface mode="flat" style={styles.box} elevation={5}>
                          <Text style={styles.score} variant="bodyLarge">
                            {score?.scorer === "a2" && score.current_a_score}
                          </Text>
                        </Surface>
                      )}
                      <Surface
                        mode="flat"
                        style={{ ...styles.box, backgroundColor: "#a6a6a6" }}
                        elevation={5}
                      >
                        <Text style={styles.score} variant="bodyLarge">
                          {score?.scorer === "b1" && score.current_b_score}
                        </Text>
                      </Surface>
                      {hasPlayer2 && (
                        <Surface
                          mode="flat"
                          style={{
                            ...styles.box,
                            backgroundColor: "#a6a6a6",
                          }}
                          elevation={5}
                        >
                          <Text style={styles.score} variant="bodyLarge">
                            {score?.scorer === "b2" && score.current_b_score}
                          </Text>
                        </Surface>
                      )}
                    </View>
                  )
                }
              )}
            </>
          )}
        </ScrollView>
      </View>
    </>
  )
}

const Details = ({ route }) => {
  const { id } = route.params
  const [data, setData] = useState<any>()
  const [hasPlayer2, setHasPlayer2] = useState<boolean>(false)

  // Fetch Game Data
  useEffect(() => {
    const ref = doc(FIRESTORE_DB, "games", id)
    const sub = onSnapshot(ref, {
      next: (snapshot) => {
        if (snapshot.exists()) {
          const snap = snapshot.data()
          if (snap.details.category.split(".")[1] === "doubles") {
            setHasPlayer2(true)
          } else {
            setHasPlayer2(false)
          }
          setData(snap)
        }
      },
    })

    return () => sub()
  }, [id])

  // Expandables
  const [showDetails, setShowDetails] = useState<boolean>(true)
  const [showPlayers, setShowPlayers] = useState<boolean>(false)
  const [showTimes, setShowTimes] = useState<boolean>(false)

  return (
    <ScrollView>
      <List.Section>
        <List.Accordion
          style={{ backgroundColor: theme.colors.background }}
          title="Details"
          expanded={showDetails}
          onPress={() => setShowDetails((prev: boolean) => !prev)}
        >
          <List.Item
            style={{ paddingLeft: 20 }}
            title="Category"
            description={`${data?.details.category.split(".")[0]} (${
              data?.details.category.split(".")[1]
            })`}
            descriptionStyle={{ textTransform: "capitalize" }}
          />
          <List.Item
            style={{ paddingLeft: 20 }}
            title="Court"
            description={data?.details.court}
          />
          <List.Item
            style={{ paddingLeft: 20 }}
            title="Status"
            description={data?.statuses.current}
            descriptionStyle={{ textTransform: "capitalize" }}
          />
          <List.Item
            style={{ paddingLeft: 20 }}
            title="Game No."
            description={
              data?.details.game_no !== "" ? data?.details.game_no : "N/A"
            }
          />
          <List.Item
            style={{ paddingLeft: 20 }}
            title="Group No."
            description={
              data?.details.group_no !== "" ? data?.details.group_no : "N/A"
            }
          />
          <List.Item
            style={{ paddingLeft: 20 }}
            title="Winner"
            description={
              !!data?.details.game_winner ? data?.details.game_winner : "TBD"
            }
          />
          <List.Item
            style={{ paddingLeft: 20 }}
            title="Max Score"
            description={data?.details.max_score}
          />
          <List.Item
            style={{ paddingLeft: 20 }}
            title="Sets"
            description={data?.details.no_of_sets}
          />
        </List.Accordion>
        <List.Accordion
          title="Players"
          expanded={showPlayers}
          onPress={() => setShowPlayers((prev: boolean) => !prev)}
        >
          <List.Accordion style={{ paddingLeft: 20 }} title="Team 1">
            <List.Item
              style={{ paddingLeft: 40 }}
              title="Team Name"
              description={
                !!data?.players.team_a.team_name
                  ? data?.players.team_a.team_name
                  : "N/A"
              }
            />
            <List.Item
              style={{ paddingLeft: 40 }}
              title="Player 1"
              description={
                data?.players.team_a.player_1.use_nickname
                  ? data?.players.team_a.player_1.nickname
                  : `${data?.players.team_a.player_1.first_name[0]}. ${data?.players.team_a.player_1.last_name}`
              }
            />
            {hasPlayer2 && (
              <List.Item
                style={{ paddingLeft: 40 }}
                title="Player 2"
                description={
                  data?.players.team_a.player_2.use_nickname
                    ? data?.players.team_a.player_2.nickname
                    : `${data?.players.team_a.player_2.first_name[0]}. ${data?.players.team_a.player_2.last_name}`
                }
              />
            )}
          </List.Accordion>
          <List.Accordion style={{ paddingLeft: 20 }} title="Team 2">
            <List.Item
              style={{ paddingLeft: 40 }}
              title="Team Name"
              description={
                !!data?.players.team_b.team_name
                  ? data?.players.team_b.team_name
                  : "N/A"
              }
            />
            <List.Item
              style={{ paddingLeft: 40 }}
              title="Player 1"
              description={
                data?.players.team_b.player_1.use_nickname
                  ? data?.players.team_b.player_1.nickname
                  : `${data?.players.team_b.player_1.first_name[0]}. ${data?.players.team_b.player_1.last_name}`
              }
            />
            {hasPlayer2 && (
              <List.Item
                style={{ paddingLeft: 40 }}
                title="Player 2"
                description={
                  data?.players.team_b.player_2.use_nickname
                    ? data?.players.team_b.player_2.nickname
                    : `${data?.players.team_b.player_2.first_name[0]}. ${data?.players.team_b.player_2.last_name}`
                }
              />
            )}
          </List.Accordion>
        </List.Accordion>
        <List.Accordion
          title="Time"
          expanded={showTimes}
          onPress={() => setShowTimes((prev: boolean) => !prev)}
        >
          <List.Item
            style={{ paddingLeft: 20 }}
            title="Time Slot"
            description={
              !!data?.time.slot
                ? moment(data?.time.slot.toDate()).format("LLL")
                : "TBD"
            }
          />
          <List.Item
            style={{ paddingLeft: 20 }}
            title="Match Start"
            description={
              !!data?.time.start
                ? moment(data?.time.start.toDate()).format("LLL")
                : "TBD"
            }
          />
          <List.Item
            style={{ paddingLeft: 20 }}
            title="Match End"
            description={
              !!data?.time.end
                ? moment(data?.time.end.toDate()).format("LLL")
                : "TBD"
            }
          />
        </List.Accordion>
      </List.Section>
    </ScrollView>
  )
}

export default ({ navigation, route }: any) => {
  const { id } = route.params
  const [data, setData] = useState<any>()
  const fade = useRef(new Animated.Value(0)).current

  // Fade Settings
  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [fade])

  // Screen Orientation
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE)

    return () => {
      ScreenOrientation.unlockAsync()
    }
  }, [])

  // Fetch Game Data
  useEffect(() => {
    const ref = doc(FIRESTORE_DB, "games", id)
    const sub = onSnapshot(ref, {
      next: (snapshot) => {
        if (snapshot.exists()) {
          const snap = snapshot.data()
          setData(snap)
        }
      },
    })

    return () => sub()
  }, [id])

  // Navigation Header
  useEffect(() => {
    if (data) {
      navigation.setOptions({
        title: data?.details.category
          ? `${data?.details.category} | ${data?.details.game_no}`.toUpperCase()
          : "",
        headerShown: true,
      })
    }
  }, [data])

  return (
    <>
      {!!data ? (
        <Tab.Navigator
          initialRouteName="Score"
          screenOptions={{
            tabBarIndicatorStyle: { backgroundColor: theme.colors.primary },
          }}
        >
          <Tab.Screen name="Score" component={Score} initialParams={{ id }} />
          <Tab.Screen
            name="Scoresheet"
            component={Scoresheet}
            initialParams={{ id }}
          />
          <Tab.Screen
            name="Details"
            component={Details}
            initialParams={{ id }}
          />
        </Tab.Navigator>
      ) : (
        <Animated.View style={{ opacity: fade }}>
          <Loading />
        </Animated.View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 5,
    display: "flex",
    gap: 5,
  },
  dropdown: {
    borderRadius: 12,
    width: "100%",
    backgroundColor: "#E6E6E6",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  scoresheet: { display: "flex", flexDirection: "row", width: "100%" },
  box: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 36,
    width: 36,
    borderWidth: 1,
    borderColor: "black",
  },
  score: {
    fontWeight: "bold",
  },
  scorer_name: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 36,
    minWidth: "30%",
    borderWidth: 1,
    borderColor: "black",
  },
})
