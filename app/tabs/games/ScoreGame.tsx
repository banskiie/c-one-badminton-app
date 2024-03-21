import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  updateDoc,
  where,
} from "firebase/firestore"
import {
  ActivityIndicator,
  Button,
  Divider,
  IconButton,
  List,
  Surface,
  Text,
} from "react-native-paper"
import { useCallback, useEffect, useRef, useState } from "react"
import { StyleSheet, ScrollView, View, Animated } from "react-native"
import { FIRESTORE_DB } from "../../../firebase"
import { theme } from "../../theme/theme"
import * as ScreenOrientation from "expo-screen-orientation"
import DropDown from "react-native-paper-dropdown"
import Loading from "../../components/Loading"
import NavHeader from "../../components/NavHeader"
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs"
import moment from "moment"

const Tab = createMaterialTopTabNavigator()

const Test = ({ navigation, route }: any) => {
  const { id } = route.params
  const [data, setData] = useState<any>()
  const [gameRef, setGameRef] = useState<any | null>()
  // Game Dropdown
  const [showGames, setShowGames] = useState<boolean>(false)
  // Scoresheet Visiblity
  const [showScoreSheet, setShowScoreSheet] = useState<boolean>(false)
  // Match Details
  const [showMatchDetails, setShowMatchDetails] = useState<boolean>(false)
  // Loading
  const [loading, setLoading] = useState<boolean>(false)
  const [pageLoading, setPageLoading] = useState<boolean>(true)
  const fade = useRef(new Animated.Value(0)).current
  // Player 2 check
  const [hasPlayer2, setHasPlayer2] = useState<boolean>(false)

  // Navigation Header
  useEffect(() => {
    navigation.setOptions({
      header: (props: any) => (
        <NavHeader
          {...props}
          action={
            !!(
              data?.sets[`set_${data?.details.playing_set}`].a_score >=
                data?.details.max_score ||
              data?.sets[`set_${data?.details.playing_set}`].b_score >=
                data?.details.max_score
            ) && finishGame
          }
          title={
            !!(
              data?.sets[`set_${data?.details.playing_set}`].a_score >=
                data?.details.max_score ||
              data?.sets[`set_${data?.details.playing_set}`].b_score >=
                data?.details.max_score
            ) && "Finish Game"
          }
          navigate={() => {
            navigation.navigate("Games")
          }}
        />
      ),
      headerShown: true,
    })
  })

  // Fade Settings
  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [fade])

  // Fetch Game Data
  useEffect(() => {
    const ref = doc(FIRESTORE_DB, "games_test", id)
    const sub = onSnapshot(ref, {
      next: (snapshot) => {
        setData(snapshot.data())
        if (
          snapshot.data().players.team_a.player_2.first_name &&
          snapshot.data().players.team_b.player_2.first_name
        ) {
          setHasPlayer2(true)
        } else {
          setHasPlayer2(false)
        }
        setPageLoading(false)
      },
    })
    setGameRef(ref)

    return () => sub()
  }, [id])

  // Screen Orientation
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE)

    return () => {
      ScreenOrientation.unlockAsync()
    }
  }, [])

  const addScore = async (team: string, scorer: string) => {
    setLoading(true)
    try {
      const current = `set_${data.details.playing_set}`
      const updatedScoreSheet = data.sets[current].scoresheet
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

  const undoScore = async () => {
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

  const changeCurrentSet = async (value: any) => {
    setPageLoading(true)
    try {
      await updateDoc(gameRef, {
        details: { ...data.details, playing_set: value },
      })
    } catch (error: any) {
      console.error(error)
    } finally {
      setPageLoading(false)
    }
  }

  const changeDisplay = async () => {
    try {
      await runTransaction(FIRESTORE_DB, async (transaction) => {
        const snap = await transaction.get(doc(FIRESTORE_DB, "games_test", id))
        const game = snap.data()
        // Game Update
        transaction.update(doc(FIRESTORE_DB, "games_test", id), {
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

  const finishGame = async () => {
    setPageLoading(true)
    try {
      await updateDoc(gameRef, {
        statuses: { current: "finished", active: false },
      })
      navigation.navigate("Games")
    } catch (error: any) {
      console.error(error)
    } finally {
      setPageLoading(false)
    }
  }

  return (
    // <Animated.View style={{ opacity: fade }}>
    //   {pageLoading ? (
    //     <Loading />
    //   ) : (
    //     <ScrollView style={styles.container}>
    //       {data?.details.no_of_sets > 1 && (
    //         <DropDown
    //           label="Playing Set"
    //           visible={showGames}
    //           showDropDown={() => setShowGames(true)}
    //           onDismiss={() => setShowGames(false)}
    //           value={data?.details.playing_set}
    //           mode="outlined"
    //           setValue={(value) => changeCurrentSet(value)}
    //           list={Array.from({ length: data?.details.no_of_sets }).map(
    //             (_, index) => ({
    //               label: `SET ${index + 1}`,
    //               value: index + 1,
    //             })
    //           )}
    //         />
    //       )}
    //       <View
    //         style={{
    //           display: "flex",
    //           width: "100%",
    //           flexDirection: "row",
    //           alignItems: "center",
    //           justifyContent: "space-around",
    //           gap: 2,
    //           padding: 5,
    //         }}
    //       >
    //         <Button
    //           disabled={
    //             loading ||
    //             !(
    //               data?.sets[`set_${data.details.playing_set}`].a_score ||
    //               data?.sets[`set_${data.details.playing_set}`].b_score
    //             )
    //           }
    //           icon={loading ? null : "replay"}
    //           labelStyle={{
    //             fontWeight: "bold",
    //             color: "#FF6961",
    //             display: "flex",
    //             justifyContent: "center",
    //           }}
    //           mode="contained-tonal"
    //           style={{ backgroundColor: "pink", width: "45%" }}
    //           onPress={() => undoScore()}
    //         >
    //           {loading ? <ActivityIndicator size={16} /> : "Undo Last Score"}
    //         </Button>
    //         <Button
    //           mode="contained"
    //           buttonColor={
    //             data?.statuses.active ? "gray" : theme.colors.primary
    //           }
    //           onPress={changeDisplay}
    //           style={{ width: "45%" }}
    //         >
    //           {data?.statuses.active ? "Hide Scoreboard" : "Show Scoreboard"}
    //         </Button>
    //       </View>
    //       {/* Scoreboard */}
    //       <View
    //         style={{
    //           display: "flex",
    //           flexDirection: "row",
    //           justifyContent: "space-around",
    //           width: "100%",
    //           alignItems: "center",
    //         }}
    //       >
    //         <View
    //           style={{
    //             display: "flex",
    //             alignItems: "center",
    //             justifyContent: "center",
    //           }}
    //         >
    //           <Text>{data?.players.team_a.team_name ?? "TEAM A"}</Text>
    //           <Text variant="displayLarge">
    //             {data?.sets[`set_${data.details.playing_set}`].a_score}
    //           </Text>
    //         </View>
    //         <View
    //           style={{
    //             display: "flex",
    //             alignItems: "center",
    //             justifyContent: "center",
    //           }}
    //         >
    //           <Text>{data?.players.team_b.team_name ?? "TEAM B"}</Text>
    //           <Text variant="displayLarge">
    //             {data?.sets[`set_${data.details.playing_set}`].b_score}
    //           </Text>
    //         </View>
    //       </View>
    //       {/* Players */}
    //       <View
    //         style={{
    //           display: "flex",
    //           flexDirection: "row",
    //           justifyContent: "space-around",
    //           alignItems: "center",
    //           width: "100%",
    //         }}
    //       >
    //         {/* Team A */}
    //         <View
    //           style={{
    //             width: "50%",
    //             display: "flex",
    //             flexDirection: "column",
    //             justifyContent: "space-evenly",
    //             borderWidth: 1,
    //             borderColor: "black",
    //           }}
    //         >
    //           <View
    //             style={{
    //               display: "flex",
    //               flexDirection: "row",
    //               alignItems: "center",
    //               paddingHorizontal: 10,
    //             }}
    //           >
    //             <IconButton
    //               icon="plus"
    //               mode="contained"
    //               containerColor="green"
    //               iconColor="white"
    //               size={20}
    //             />
    //             <Text variant="headlineSmall" style={{ fontWeight: "bold" }}>
    //               {data?.players.team_a.player_1.first_name}{" "}
    //               {data?.players.team_a.player_1.last_name} (
    //               {
    //                 data?.sets[
    //                   `set_${data.details.playing_set}`
    //                 ].scoresheet.filter((round: any) => round?.scorer === "a1")
    //                   .length
    //               }
    //               )
    //             </Text>
    //           </View>
    //           {hasPlayer2 && (
    //             <View
    //               style={{
    //                 display: "flex",
    //                 flexDirection: "row",
    //                 alignItems: "center",
    //                 paddingHorizontal: 10,
    //               }}
    //             >
    //               <IconButton
    //                 icon="plus"
    //                 mode="contained"
    //                 containerColor="green"
    //                 iconColor="white"
    //                 size={20}
    //               />
    //               <Text variant="headlineSmall" style={{ fontWeight: "bold" }}>
    //                 {data?.players.team_a.player_2.first_name}{" "}
    //                 {data?.players.team_a.player_2.last_name} (
    //                 {
    //                   data?.sets[
    //                     `set_${data.details.playing_set}`
    //                   ].scoresheet.filter(
    //                     (round: any) => round?.scorer === "a2"
    //                   ).length
    //                 }
    //                 )
    //               </Text>
    //             </View>
    //           )}
    //         </View>
    //         {/* Team B */}
    //         <View
    //           style={{
    //             width: "50%",
    //             display: "flex",
    //             flexDirection: "column",
    //             justifyContent: "space-evenly",
    //             borderLeftWidth: 1,
    //             borderLeftColor: "black",
    //           }}
    //         >
    //           <View
    //             style={{
    //               display: "flex",
    //               flexDirection: "row",
    //               alignItems: "center",
    //               paddingHorizontal: 10,
    //             }}
    //           >
    //             <IconButton
    //               icon="plus"
    //               mode="contained"
    //               containerColor="orange"
    //               iconColor="white"
    //               size={20}
    //             />
    //             <Text variant="headlineSmall" style={{ fontWeight: "bold" }}>
    //               {data?.players.team_b.player_1.first_name}{" "}
    //               {data?.players.team_b.player_1.last_name} (
    //               {
    //                 data?.sets[
    //                   `set_${data.details.playing_set}`
    //                 ].scoresheet.filter((round: any) => round?.scorer === "b1")
    //                   .length
    //               }
    //               )
    //             </Text>
    //           </View>
    //           {hasPlayer2 && (
    //             <View
    //               style={{
    //                 display: "flex",
    //                 flexDirection: "row",
    //                 alignItems: "center",
    //                 paddingHorizontal: 10,
    //               }}
    //             >
    //               <IconButton
    //                 icon="plus"
    //                 mode="contained"
    //                 containerColor="orange"
    //                 iconColor="white"
    //                 size={20}
    //               />
    //               <Text variant="headlineSmall" style={{ fontWeight: "bold" }}>
    //                 {data?.players.team_b.player_2.first_name}{" "}
    //                 {data?.players.team_b.player_2.last_name} (
    //                 {
    //                   data?.sets[
    //                     `set_${data.details.playing_set}`
    //                   ].scoresheet.filter(
    //                     (round: any) => round?.scorer === "b2"
    //                   ).length
    //                 }
    //                 )
    //               </Text>
    //             </View>
    //           )}
    //         </View>
    //       </View>
    //       <Button
    //         mode="outlined"
    //         icon={showScoreSheet ? "arrow-up-thick" : "arrow-down-thick"}
    //         contentStyle={{ flexDirection: "row-reverse" }}
    //         onPress={() => setShowScoreSheet((prev: boolean) => !prev)}
    //       >
    //         {showScoreSheet ? "Hide" : "Show"} Scoresheet
    //       </Button>
    //       {showScoreSheet && (
    //         <>
    //           {/* Scoresheet */}
    //           <View
    //             style={{ display: "flex", flexDirection: "row", width: "100%" }}
    //           >
    //             {/* Players */}
    //             <View style={{ minWidth: "30%" }}>
    //               {/* TEAM A */}
    //               {/* Player 1 */}
    //               <View
    //                 style={{
    //                   display: "flex",
    //                   flexDirection: "row",
    //                   alignItems: "center",
    //                 }}
    //               >
    //                 <IconButton
    //                   disabled={
    //                     loading ||
    //                     data?.sets[`set_${data?.details.playing_set}`]
    //                       .a_score >= data?.details.max_score
    //                   }
    //                   icon="plus"
    //                   size={6}
    //                   mode="contained-tonal"
    //                   iconColor={theme.colors.primary}
    //                   onPress={() => addScore("a", "a1")}
    //                 />
    //                 <Text
    //                   variant="bodyLarge"
    //                   style={{ marginLeft: 5, fontWeight: "bold" }}
    //                 >
    //                   {data?.players.team_a.player_1.first_name[0]}.{" "}
    //                   {data?.players.team_a.player_1.last_name} (
    //                   {
    //                     data?.sets[
    //                       `set_${data.details.playing_set}`
    //                     ].scoresheet.filter(
    //                       (round: any) => round?.scorer === "a1"
    //                     ).length
    //                   }
    //                   )
    //                 </Text>
    //               </View>
    //               {hasPlayer2 && (
    //                 <>
    //                   {/* Player 2 */}
    //                   <View
    //                     style={{
    //                       display: "flex",
    //                       flexDirection: "row",
    //                       alignItems: "center",
    //                     }}
    //                   >
    //                     <IconButton
    //                       disabled={
    //                         loading ||
    //                         data?.sets[`set_${data?.details.playing_set}`]
    //                           .a_score >= data?.details.max_score
    //                       }
    //                       icon="plus"
    //                       size={9}
    //                       mode="contained-tonal"
    //                       iconColor={theme.colors.primary}
    //                       onPress={() => addScore("a", "a2")}
    //                     />
    //                     <Text
    //                       variant="bodyLarge"
    //                       style={{ marginLeft: 5, fontWeight: "bold" }}
    //                     >
    //                       {data?.players.team_a.player_2.first_name[0]}.{" "}
    //                       {data?.players.team_a.player_2.last_name} (
    //                       {
    //                         data?.sets[
    //                           `set_${data.details.playing_set}`
    //                         ].scoresheet.filter(
    //                           (round: any) => round?.scorer === "a2"
    //                         ).length
    //                       }
    //                       )
    //                     </Text>
    //                   </View>
    //                 </>
    //               )}
    //               {/* TEAM B */}
    //               {/* Player 1 */}
    //               <View
    //                 style={{
    //                   display: "flex",
    //                   flexDirection: "row",
    //                   alignItems: "center",
    //                   backgroundColor: "#a6a6a6",
    //                 }}
    //               >
    //                 <IconButton
    //                   disabled={loading}
    //                   icon="plus"
    //                   size={9}
    //                   mode="contained-tonal"
    //                   iconColor={theme.colors.primary}
    //                   onPress={() => addScore("b", "b1")}
    //                 />
    //                 <Text
    //                   variant="bodyLarge"
    //                   style={{ marginLeft: 5, fontWeight: "bold" }}
    //                 >
    //                   {data?.players.team_b.player_1.first_name[0]}.{" "}
    //                   {data?.players.team_b.player_1.last_name} (
    //                   {
    //                     data?.sets[
    //                       `set_${data.details.playing_set}`
    //                     ].scoresheet.filter(
    //                       (round: any) => round?.scorer === "b1"
    //                     ).length
    //                   }
    //                   )
    //                 </Text>
    //               </View>
    //               {hasPlayer2 && (
    //                 <>
    //                   {/* Player 2 */}
    //                   <View
    //                     style={{
    //                       display: "flex",
    //                       flexDirection: "row",
    //                       alignItems: "center",
    //                       backgroundColor: "#a6a6a6",
    //                     }}
    //                   >
    //                     <IconButton
    //                       disabled={loading}
    //                       icon="plus"
    //                       size={9}
    //                       mode="contained-tonal"
    //                       iconColor={theme.colors.primary}
    //                       onPress={() => addScore("b", "b2")}
    //                     />
    //                     <Text
    //                       variant="bodyLarge"
    //                       style={{ marginLeft: 5, fontWeight: "bold" }}
    //                     >
    //                       {data?.players.team_b.player_2.first_name[0]}.{" "}
    //                       {data?.players.team_b.player_2.last_name} (
    //                       {
    //                         data?.sets[
    //                           `set_${data.details.playing_set}`
    //                         ].scoresheet.filter(
    //                           (round: any) => round?.scorer === "b2"
    //                         ).length
    //                       }
    //                       )
    //                     </Text>
    //                   </View>
    //                 </>
    //               )}
    //             </View>
    //             {/* Score */}
    //             <ScrollView
    //               horizontal={true}
    //               style={{
    //                 display: "flex",
    //                 flexDirection: "row",
    //                 width: "60%",
    //               }}
    //             >
    //               <View>
    //                 {hasPlayer2 && (
    //                   <Surface mode="flat" style={styles.a_box} elevation={5}>
    //                     {""}
    //                   </Surface>
    //                 )}
    //                 <Surface mode="flat" style={styles.a_box} elevation={5}>
    //                   <Text variant="bodyLarge" style={styles.score}>
    //                     0
    //                   </Text>
    //                 </Surface>
    //                 <Surface mode="flat" style={styles.b_box} elevation={5}>
    //                   <Text variant="bodyLarge" style={styles.score}>
    //                     0
    //                   </Text>
    //                 </Surface>
    //                 {hasPlayer2 && (
    //                   <Surface mode="flat" style={styles.b_box} elevation={5}>
    //                     {""}
    //                   </Surface>
    //                 )}
    //               </View>
    //               {data?.sets[`set_${data.details.playing_set}`].scoresheet
    //                 .length > 0 && (
    //                 <>
    //                   {data?.sets[
    //                     `set_${data.details.playing_set}`
    //                   ].scoresheet.map((score: any, index: number) => {
    //                     return (
    //                       <View key={index}>
    //                         <Surface
    //                           mode="flat"
    //                           style={styles.a_box}
    //                           elevation={5}
    //                         >
    //                           <Text style={styles.score} variant="bodyLarge">
    //                             {score?.scorer === "a1" &&
    //                               score.current_a_score}
    //                           </Text>
    //                         </Surface>
    //                         {hasPlayer2 && (
    //                           <Surface
    //                             mode="flat"
    //                             style={styles.a_box}
    //                             elevation={5}
    //                           >
    //                             <Text style={styles.score} variant="bodyLarge">
    //                               {score?.scorer === "a2" &&
    //                                 score.current_a_score}
    //                             </Text>
    //                           </Surface>
    //                         )}

    //                         <Surface
    //                           mode="flat"
    //                           style={styles.b_box}
    //                           elevation={5}
    //                         >
    //                           <Text style={styles.score} variant="bodyLarge">
    //                             {score?.scorer === "b1" &&
    //                               score.current_b_score}
    //                           </Text>
    //                         </Surface>
    //                         {hasPlayer2 && (
    //                           <Surface
    //                             mode="flat"
    //                             style={styles.b_box}
    //                             elevation={5}
    //                           >
    //                             <Text style={styles.score} variant="bodyLarge">
    //                               {score?.scorer === "b2" &&
    //                                 score.current_b_score}
    //                             </Text>
    //                           </Surface>
    //                         )}
    //                       </View>
    //                     )
    //                   })}
    //                 </>
    //               )}
    //             </ScrollView>
    //           </View>
    //         </>
    //       )}
    //       <Button onPress={() => setShowMatchDetails((prev: boolean) => !prev)}>
    //         {showScoreSheet ? "Hide" : "Show"} Details
    //       </Button>
    //     </ScrollView>
    //   )}
    // </Animated.View>
    <View>
      <Text>Text</Text>
    </View>
  )
}

const Score = ({ route }) => {
  const [data, setData] = useState<any>(route.params.data)

  return <Text>Score</Text>
}

const Scoresheet = ({ route }) => {
  const [data, setData] = useState<any>(route.params.data)

  return <Text>Scoresheet</Text>
}

const Details = ({ route }) => {
  const { data, hasPlayer2 } = route.params
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
            description={data?.details.category}
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
            description={data.statuses.current}
          />
          <List.Item
            style={{ paddingLeft: 20 }}
            title="Game No."
            description={data?.details.game_no}
          />
          <List.Item
            style={{ paddingLeft: 20 }}
            title="Group No."
            description={data?.details.group_no}
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
              description={`${data.players.team_a.player_1.first_name} ${data.players.team_a.player_1.last_name}`}
            />
            {hasPlayer2 && (
              <List.Item
                style={{ paddingLeft: 40 }}
                title="Player 2"
                description={`${data.players.team_a.player_2.first_name} ${data.players.team_a.player_2.last_name}`}
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
              description={`${data.players.team_b.player_1.first_name} ${data.players.team_b.player_1.last_name}`}
            />
            {hasPlayer2 && (
              <List.Item
                style={{ paddingLeft: 40 }}
                title="Player 2"
                description={`${data.players.team_b.player_2.first_name} ${data.players.team_b.player_2.last_name}`}
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
  const [hasPlayer2, setHasPlayer2] = useState<boolean>(false)

  // Fetch Game Data
  useEffect(() => {
    const ref = doc(FIRESTORE_DB, "games_test", id)
    const sub = onSnapshot(ref, {
      next: (snapshot) => {
        setData(snapshot.data())
      },
    })

    return () => sub()
  }, [id])

  useEffect(() => {
    if (data && !!data.players.team_a.player_2.first_name) {
      setHasPlayer2(true)
    } else {
      setHasPlayer2(false)
    }
  }, [data])

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
          <Tab.Screen
            name="Score"
            component={Score}
            initialParams={{ data, hasPlayer2 }}
          />
          <Tab.Screen
            name="Scoresheet"
            component={Scoresheet}
            initialParams={{ data, hasPlayer2 }}
          />
          <Tab.Screen
            name="Details"
            component={Details}
            initialParams={{ data, hasPlayer2 }}
          />
        </Tab.Navigator>
      ) : (
        <Loading />
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
  a_box: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 36,
    width: 36,
    borderWidth: 1,
    borderColor: "black",
  },
  b_box: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 36,
    width: 36,
    borderWidth: 1,
    borderColor: "black",
    backgroundColor: "#a6a6a6",
  },
  score: {
    fontWeight: "bold",
  },
})
