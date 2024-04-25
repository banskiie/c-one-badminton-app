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
  Icon,
  IconButton,
  List,
  Portal,
  Text,
  TouchableRipple,
} from "react-native-paper"
import { useEffect, useState } from "react"
import { StyleSheet, ScrollView, View } from "react-native"
import { FIRESTORE_DB } from "../../../firebase"
import { theme } from "../../theme/theme"
import * as ScreenOrientation from "expo-screen-orientation"
import Loading from "../../components/Loading"
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs"
import moment from "moment"
import Timer from "../../components/Timer"
import { Dropdown } from "react-native-element-dropdown"
import ForceWin from "../../components/dialogs/ForceWin"
import ResetSet from "../../components/dialogs/ResetSet"
import StartGame from "../../components/dialogs/StartGame"

const Tab = createMaterialTopTabNavigator()

const Score = ({ route, navigation }) => {
  // Loading
  const [loading, setLoading] = useState<boolean>(false)
  const [changingSet, setChangingSet] = useState<boolean>(false)
  // Dialogs
  const [openStartGame, setOpenStartGame] = useState<boolean>(false)
  const { id } = route.params
  const [data, setData] = useState<any>()
  const [gameRef, setGameRef] = useState<any>()
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
          setGameRef(ref)
          setData(snap)
        }
      },
    })

    return () => sub()
  }, [id])

  useEffect(() => {
    if (data) {
      const switch_score = Math.ceil(data.details.max_score / 2)
      if (
        !!(
          data.sets[`set_${data.details.playing_set}`].a_score ===
            switch_score ||
          data.sets[`set_${data.details.playing_set}`].b_score === switch_score
        ) &&
        !data.sets[`set_${data.details.playing_set}`].switch
      ) {
        switchSide()
      }
    }
  }, [data])

  const switchSide = async () => {
    setLoading(true)
    try {
      await updateDoc(gameRef, {
        sets: {
          ...data.sets,
          [`set_${data.details.playing_set}`]: {
            ...data.sets[`set_${data.details.playing_set}`],
            switch: !data.sets[`set_${data.details.playing_set}`].switch,
          },
        },
      })
    } catch (error: any) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartGame = () => {
    setOpenStartGame((prev: boolean) => !prev)
  }

  const detectWinner = (
    a_score: number,
    b_score: number,
    winning_score: number,
    plus_two_rule: boolean,
    max_score: number
  ) => {
    switch (plus_two_rule) {
      case true:
        if (
          a_score === max_score ||
          (a_score >= winning_score && a_score - b_score == 2)
        ) {
          return "a"
        } else if (
          b_score === max_score ||
          (b_score >= winning_score && b_score - a_score == 2)
        ) {
          return "b"
        }
        break
      case false:
        if (a_score === winning_score) {
          return "a"
        } else if (b_score === winning_score) {
          return "b"
        }
        break
    }
    return ""
  }

  const score = async (scorer: string) => {
    setLoading(true)
    try {
      const current = `set_${data.details.playing_set}`
      const updatedScoreSheet = data.sets[current].scoresheet
      const team = scorer[0]
      updatedScoreSheet[data.sets[current].current_round - 1] = {
        team_scored: team,
        scored_at: Date.now(),
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
                winner: detectWinner(
                  data.sets[current].a_score + 1,
                  data.sets[current].b_score,
                  data.details.max_score,
                  data.details.plus_two_rule,
                  data.details.plus_two_score
                ),
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
                winner: detectWinner(
                  data.sets[current].a_score,
                  data.sets[current].b_score + 1,
                  data.details.max_score,
                  data.details.plus_two_rule,
                  data.details.plus_two_score
                ),
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

  const checkWinner = (sets: number) => {
    switch (sets) {
      case 1:
        return Object.values(data.sets).filter((set: any) => set.winner === "a")
          .length
          ? "a"
          : Object.values(data.sets).filter((set: any) => set.winner === "b")
              .length
          ? "b"
          : ""
      case 3:
        return Object.values(data.sets).filter((set: any) => set.winner === "a")
          .length >= 2
          ? "a"
          : Object.values(data.sets).filter((set: any) => set.winner === "b")
              .length >= 2
          ? "b"
          : ""
    }
  }

  const finish = async () => {
    setLoading(true)
    try {
      await updateDoc(gameRef, {
        details: {
          ...data.details,
          game_winner: checkWinner(data.details.no_of_sets),
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

  // return (
  //   <>
  //     <Portal>
  //       <StartGame open={openStartGame} onClose={handleStartGame} id={id} />
  //     </Portal>
  //     {!!data?.time.start ? (
  //       <ScrollView>
  //         <View style={{ flex: 1, padding: 12, gap: 8 }}>
  //           {data?.details.no_of_sets > 1 && (
  //             <Dropdown
  //               style={styles.dropdown}
  //               selectedTextStyle={{ textAlign: "center" }}
  //               placeholderStyle={{ textAlign: "center" }}
  //               data={Array.from({
  //                 length:
  //                   Object.values(data?.sets).filter(
  //                     (set: any) => set.winner === "a"
  //                   ).length === 2 ||
  //                   Object.values(data?.sets).filter(
  //                     (set: any) => set.winner === "b"
  //                   ).length === 2
  //                     ? Object.values(data?.sets).filter(
  //                         (set: any) => set.winner
  //                       ).length
  //                     : Object.values(data?.sets).filter(
  //                         (set: any) => set.winner
  //                       ).length + 1,
  //               }).map((_, index) => ({
  //                 label: `SET ${index + 1}`,
  //                 value: index + 1,
  //               }))}
  //               value={!changingSet ? data.details.playing_set : ""}
  //               mode="default"
  //               labelField="label"
  //               valueField="value"
  //               placeholder=""
  //               onChange={(item: any) => changeSet(item.value)}
  //             />
  //           )}
  //           {!!(
  //             !!(
  //               data?.details.no_of_sets === 1 &&
  //               data.sets[`set_${data.details.playing_set}`].winner
  //             ) ||
  //             !!(
  //               data?.details.no_of_sets === 3 &&
  //               (Object.values(data.sets).filter(
  //                 (set: any) => set.winner == "a"
  //               ).length == 2 ||
  //                 Object.values(data.sets).filter(
  //                   (set: any) => set.winner == "b"
  //                 ).length == 2)
  //             )
  //           ) && (
  //             <Button mode="contained" onPress={finish}>
  //               Finish
  //             </Button>
  //           )}
  //           {!!(!!data?.time.start && !data?.time.end) && (
  //             <Timer start={data?.time.start} />
  //           )}

  //           {/* Team Name and Score */}
  //           <View
  //             style={{
  //               display: "flex",
  //               flexDirection: data.sets[`set_${data.details.playing_set}`]
  //                 .switch
  //                 ? "row-reverse"
  //                 : "row",
  //               justifyContent: "space-between",
  //             }}
  //           >
  //             <View
  //               style={{
  //                 backgroundColor: "#FAC898",
  //                 width: "49.5%",
  //                 display: "flex",
  //                 alignItems: "center",
  //                 borderRadius: 8,
  //               }}
  //             >
  //               {data.sets[`set_${data.details.playing_set}`].winner ===
  //                 "a" && (
  //                 <Text
  //                   style={{
  //                     fontWeight: "bold",
  //                     textTransform: "uppercase",
  //                     position: "absolute",
  //                     marginTop: -24,
  //                   }}
  //                 >
  //                   Winner ♛
  //                 </Text>
  //               )}
  //               <Text>
  //                 {!!data.players.team_a.team_name
  //                   ? data.players.team_a.team_name
  //                   : "Team A"}{" "}
  //               </Text>
  //               <Text variant="displayLarge">
  //                 {data.sets[`set_${data.details.playing_set}`].a_score}
  //               </Text>
  //             </View>
  //             <View
  //               style={{
  //                 backgroundColor: "#ddf6dd",
  //                 width: "49.5%",
  //                 display: "flex",
  //                 alignItems: "center",
  //                 borderRadius: 8,
  //               }}
  //             >
  //               {data.sets[`set_${data.details.playing_set}`].winner ===
  //                 "b" && (
  //                 <Text
  //                   style={{
  //                     fontWeight: "bold",
  //                     textTransform: "uppercase",
  //                     position: "absolute",
  //                     marginTop: -24,
  //                   }}
  //                 >
  //                   Winner ♛
  //                 </Text>
  //               )}
  //               <Text>
  //                 {!!data.players.team_b.team_name
  //                   ? data.players.team_b.team_name
  //                   : "Team B"}{" "}
  //               </Text>
  //               <Text variant="displayLarge">
  //                 {data.sets[`set_${data.details.playing_set}`].b_score}
  //               </Text>
  //             </View>
  //           </View>
  //           {/* Players */}
  //           <View
  //             style={{
  //               display: "flex",
  //               flexDirection: data.sets[`set_${data.details.playing_set}`]
  //                 .switch
  //                 ? "row-reverse"
  //                 : "row",
  //               justifyContent: "space-between",
  //             }}
  //           >
  //             <View
  //               style={{
  //                 backgroundColor: "#FAC898",
  //                 width: "49.5%",
  //                 display: "flex",
  //                 justifyContent: "center",
  //                 paddingRight: 8,
  //                 borderRadius: 8,
  //                 height: 120,
  //               }}
  //             >
  //               <View
  //                 style={{
  //                   display: "flex",
  //                   flexDirection: data.sets[`set_${data.details.playing_set}`]
  //                     .switch
  //                     ? "row-reverse"
  //                     : "row",
  //                   alignItems: "center",
  //                   justifyContent: "space-between",
  //                 }}
  //               >
  //                 <View
  //                   style={{
  //                     display: "flex",
  //                     flexDirection: data.sets[
  //                       `set_${data.details.playing_set}`
  //                     ].switch
  //                       ? "row-reverse"
  //                       : "row",
  //                     alignItems: "center",
  //                   }}
  //                 >
  //                   <IconButton
  //                     icon="plus"
  //                     size={24}
  //                     mode="contained-tonal"
  //                     containerColor="#ddf6dd"
  //                     onPress={() => score("a1")}
  //                     loading={loading}
  //                     disabled={
  //                       loading ||
  //                       !!data.sets[`set_${data.details.playing_set}`].winner
  //                     }
  //                   />
  //                   <Text
  //                     style={{
  //                       fontSize: 30,
  //                       fontWeight: "bold",
  //                     }}
  //                   >
  //                     {data?.players.team_a.player_1.use_nickname
  //                       ? data?.players.team_a.player_1.nickname
  //                       : `${data?.players.team_a.player_1.first_name} ${data?.players.team_a.player_1.last_name}`}
  //                   </Text>
  //                 </View>
  //                 <Text style={{ fontSize: 30, fontWeight: "bold" }}>
  //                   {
  //                     data?.sets[
  //                       `set_${data.details.playing_set}`
  //                     ].scoresheet.filter(
  //                       (round: any) => round?.scorer === "a1"
  //                     ).length
  //                   }
  //                 </Text>
  //               </View>
  //               {hasPlayer2 && (
  //                 <View
  //                   style={{
  //                     display: "flex",
  //                     flexDirection: data.sets[
  //                       `set_${data.details.playing_set}`
  //                     ].switch
  //                       ? "row-reverse"
  //                       : "row",
  //                     alignItems: "center",
  //                     justifyContent: "space-between",
  //                   }}
  //                 >
  //                   <View
  //                     style={{
  //                       display: "flex",
  //                       flexDirection: data.sets[
  //                         `set_${data.details.playing_set}`
  //                       ].switch
  //                         ? "row-reverse"
  //                         : "row",
  //                       alignItems: "center",
  //                     }}
  //                   >
  //                     <IconButton
  //                       icon="plus"
  //                       size={24}
  //                       mode="contained-tonal"
  //                       containerColor="#ddf6dd"
  //                       onPress={() => score("a2")}
  //                       loading={loading}
  //                       disabled={
  //                         loading ||
  //                         !!data.sets[`set_${data.details.playing_set}`].winner
  //                       }
  //                     />
  //                     <Text style={{ fontSize: 30, fontWeight: "bold" }}>
  //                       {data?.players.team_a.player_2.use_nickname
  //                         ? data?.players.team_a.player_2.nickname
  //                         : `${data?.players.team_a.player_2.first_name} ${data?.players.team_a.player_2.last_name}`}
  //                     </Text>
  //                   </View>
  //                   <Text style={{ fontSize: 30, fontWeight: "bold" }}>
  //                     {
  //                       data?.sets[
  //                         `set_${data.details.playing_set}`
  //                       ].scoresheet.filter(
  //                         (round: any) => round?.scorer === "a2"
  //                       ).length
  //                     }
  //                   </Text>
  //                 </View>
  //               )}
  //             </View>
  //             <View
  //               style={{
  //                 backgroundColor: "#ddf6dd",
  //                 width: "49.5%",
  //                 display: "flex",
  //                 justifyContent: "center",
  //                 paddingRight: 8,
  //                 borderRadius: 8,
  //                 height: 120,
  //               }}
  //             >
  //               <View
  //                 style={{
  //                   display: "flex",
  //                   flexDirection: data.sets[`set_${data.details.playing_set}`]
  //                     .switch
  //                     ? "row-reverse"
  //                     : "row",
  //                   alignItems: "center",
  //                   justifyContent: "space-between",
  //                 }}
  //               >
  //                 <Text style={{ fontSize: 30, fontWeight: "bold" }}>
  //                   {
  //                     data?.sets[
  //                       `set_${data.details.playing_set}`
  //                     ].scoresheet.filter(
  //                       (round: any) => round?.scorer === "b1"
  //                     ).length
  //                   }
  //                 </Text>
  //                 <View
  //                   style={{
  //                     display: "flex",
  //                     flexDirection: data.sets[
  //                       `set_${data.details.playing_set}`
  //                     ].switch
  //                       ? "row-reverse"
  //                       : "row",
  //                     alignItems: "center",
  //                   }}
  //                 >
  //                   <Text style={{ fontSize: 30, fontWeight: "bold" }}>
  //                     {data?.players.team_b.player_1.use_nickname
  //                       ? data?.players.team_b.player_1.nickname
  //                       : `${data?.players.team_b.player_1.first_name} ${data?.players.team_b.player_1.last_name}`}
  //                   </Text>
  //                   <IconButton
  //                     icon="plus"
  //                     size={24}
  //                     mode="contained-tonal"
  //                     containerColor="#FAC898"
  //                     onPress={() => score("b1")}
  //                     loading={loading}
  //                     disabled={
  //                       loading ||
  //                       !!data.sets[`set_${data.details.playing_set}`].winner
  //                     }
  //                   />
  //                 </View>
  //               </View>
  //               {hasPlayer2 && (
  //                 <View
  //                   style={{
  //                     display: "flex",
  //                     flexDirection: data.sets[
  //                       `set_${data.details.playing_set}`
  //                     ].switch
  //                       ? "row-reverse"
  //                       : "row",
  //                     alignItems: "center",
  //                     justifyContent: "space-between",
  //                   }}
  //                 >
  //                   <Text style={{ fontSize: 30, fontWeight: "bold" }}>
  //                     {
  //                       data?.sets[
  //                         `set_${data.details.playing_set}`
  //                       ].scoresheet.filter(
  //                         (round: any) => round?.scorer === "b2"
  //                       ).length
  //                     }
  //                   </Text>
  //                   <View
  //                     style={{
  //                       display: "flex",
  //                       flexDirection: data.sets[
  //                         `set_${data.details.playing_set}`
  //                       ].switch
  //                         ? "row-reverse"
  //                         : "row",
  //                       alignItems: "center",
  //                     }}
  //                   >
  //                     <Text style={{ fontSize: 30, fontWeight: "bold" }}>
  //                       {data?.players.team_b.player_2.use_nickname
  //                         ? data?.players.team_b.player_2.nickname
  //                         : `${data?.players.team_b.player_2.first_name} ${data?.players.team_b.player_2.last_name}`}
  //                     </Text>
  //                     <IconButton
  //                       icon="plus"
  //                       size={24}
  //                       mode="contained-tonal"
  //                       containerColor="#FAC898"
  //                       onPress={() => score("b2")}
  //                       loading={loading}
  //                       disabled={
  //                         loading ||
  //                         !!data.sets[`set_${data.details.playing_set}`].winner
  //                       }
  //                     />
  //                   </View>
  //                 </View>
  //               )}
  //             </View>
  //           </View>
  //           {/* Action Buttons */}
  //           <View
  //             style={{
  //               width: "100%",
  //               flex: 1,
  //               flexDirection: "row",
  //               justifyContent: "space-evenly",
  //             }}
  //           >
  //             {data?.sets[`set_${data.details.playing_set}`].scoresheet.length >
  //               0 && (
  //               <>
  //                 <Button
  //                   loading={loading}
  //                   buttonColor="#F7CAC9"
  //                   style={{ width: "30%" }}
  //                   mode="contained"
  //                   icon="undo-variant"
  //                   textColor="red"
  //                   onPress={undo}
  //                   disabled={loading}
  //                 >
  //                   Undo Score
  //                 </Button>
  //               </>
  //             )}
  //           </View>
  //         </View>
  //       </ScrollView>
  //     ) : (
  //       <View
  //         style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
  //       >
  //         <TouchableRipple
  //           style={{
  //             ...styles.touch,
  //             backgroundColor: "#B4D3B2",
  //           }}
  //           disabled={loading}
  //           onPress={handleStartGame}
  //         >
  //           <>
  //             {loading ? (
  //               <ActivityIndicator color="darkgreen" size={56} />
  //             ) : (
  //               <Icon color="darkgreen" source="star" size={56} />
  //             )}
  //             <Text style={{ color: "darkgreen" }}>Start</Text>
  //           </>
  //         </TouchableRipple>
  //       </View>
  //     )}
  //   </>
  // )
  return (
    <>
      {data && (
        <>
          <Portal>
            <StartGame open={openStartGame} onClose={handleStartGame} id={id} />
          </Portal>
          <View
            style={{
              height: "100%",
              width: "100%",
              flexDirection: data.sets[`set_${data.details.playing_set}`].switch
                ? "row-reverse"
                : "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {data?.time.start ? (
              <View
                style={{
                  position: "absolute",
                  zIndex: 50,
                  top: 0,
                  backgroundColor: "white",
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  paddingHorizontal: 2,
                  paddingVertical: 4,
                  borderBottomLeftRadius: 16,
                  borderBottomEndRadius: 16,
                  elevation: loading ? 0 : 4,
                }}
              >
                <IconButton
                  icon="flag-checkered"
                  iconColor="green"
                  loading={loading}
                  disabled={
                    !(
                      (data?.details.no_of_sets === 1 &&
                        data.sets[`set_${data.details.playing_set}`].winner) ||
                      (data?.details.no_of_sets === 3 &&
                        (Object.values(data.sets).filter(
                          (set: any) => set.winner == "a"
                        ).length == 2 ||
                          Object.values(data.sets).filter(
                            (set: any) => set.winner == "b"
                          ).length == 2))
                    )
                  }
                  onPress={finish}
                />
                <Timer start={data?.time.start} />
                <IconButton
                  icon="undo-variant"
                  iconColor="red"
                  disabled={
                    data?.sets[`set_${data.details.playing_set}`].scoresheet
                      .length <= 0
                  }
                  loading={loading}
                  onPress={undo}
                />
              </View>
            ) : (
              <IconButton
                style={{
                  position: "absolute",
                  zIndex: 50,
                  backgroundColor: "white",
                }}
                icon="play"
                size={150}
                animated={true}
                onPress={handleStartGame}
              />
            )}
            <View
              style={{
                height: "100%",
                width: "50%",
                backgroundColor: "#FAC898",
                justifyContent: "center",
                alignItems: "center",
                gap: -15,
                paddingBottom: 40,
              }}
            >
              <Text style={{ fontSize: 32 }}>
                <Text>
                  {data.sets[`set_${data.details.playing_set}`].winner == "a" &&
                    "👑"}
                </Text>
                {!!data?.players.team_a.team_name
                  ? data?.players.team_a.team_name
                  : "Team A"}
              </Text>
              <Text style={{ fontSize: 105, fontWeight: "bold" }}>
                {data.sets[`set_${data.details.playing_set}`].a_score}
              </Text>
            </View>
            <View
              style={{
                height: "100%",
                width: "50%",
                backgroundColor: "#ddf6dd",
                justifyContent: "center",
                alignItems: "center",
                gap: -15,
                paddingBottom: 40,
              }}
            >
              <Text style={{ fontSize: 32 }}>
                <Text>
                  {data.sets[`set_${data.details.playing_set}`].winner == "b" &&
                    "👑"}
                </Text>
                {!!data?.players.team_b.team_name
                  ? data?.players.team_b.team_name
                  : "Team B"}
              </Text>
              <Text style={{ fontSize: 105, fontWeight: "bold" }}>
                {data.sets[`set_${data.details.playing_set}`].b_score}
              </Text>
            </View>
            {data?.time.start && (
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  width: "100%",
                  backgroundColor: "white",
                  height: 80,
                  flexDirection: data.sets[`set_${data.details.playing_set}`]
                    .switch
                    ? "row-reverse"
                    : "row",
                }}
              >
                <View
                  style={{
                    width: "50%",
                    flexDirection: "row",
                    justifyContent: "space-evenly",
                    paddingTop: 8,
                    paddingLeft: 5,
                    paddingRight: 2.5,
                    gap: 5,
                  }}
                >
                  <TouchableRipple
                    style={{
                      alignItems: "center",
                      justifyContent: "center",
                      width: hasPlayer2 ? "49%" : "98%",
                      borderTopLeftRadius: 16,
                      borderTopEndRadius: 16,
                      backgroundColor:
                        loading ||
                        data.sets[`set_${data.details.playing_set}`].winner !==
                          ""
                          ? "#d3d3d3"
                          : "#ffcc99",
                      elevation: loading ? 0 : 4,
                    }}
                    disabled={
                      loading ||
                      data.sets[`set_${data.details.playing_set}`].winner !== ""
                    }
                    onPress={() => score("a1")}
                  >
                    {loading ? (
                      <ActivityIndicator />
                    ) : (
                      <Text style={{ fontSize: 20, fontWeight: "bold" }}>
                        +{" "}
                        {data?.players.team_a.player_1.use_nickname
                          ? data?.players.team_a.player_1.nickname
                          : `${data?.players.team_a.player_1.first_name} ${data?.players.team_a.player_1.last_name}`}
                      </Text>
                    )}
                  </TouchableRipple>
                  {hasPlayer2 && (
                    <TouchableRipple
                      style={{
                        alignItems: "center",
                        justifyContent: "center",
                        width: "49%",
                        borderTopLeftRadius: 16,
                        borderTopEndRadius: 16,
                        backgroundColor:
                          loading ||
                          data.sets[`set_${data.details.playing_set}`]
                            .winner !== ""
                            ? "#d3d3d3"
                            : "#ffcc99",
                        elevation: loading ? 0 : 4,
                      }}
                      disabled={
                        loading ||
                        data.sets[`set_${data.details.playing_set}`].winner !==
                          ""
                      }
                      onPress={() => score("a2")}
                    >
                      {loading ? (
                        <ActivityIndicator />
                      ) : (
                        <Text style={{ fontSize: 20, fontWeight: "bold" }}>
                          +{" "}
                          {data?.players.team_a.player_2.use_nickname
                            ? data?.players.team_a.player_2.nickname
                            : `${data?.players.team_a.player_2.first_name} ${data?.players.team_a.player_2.last_name}`}
                        </Text>
                      )}
                    </TouchableRipple>
                  )}
                </View>
                <View
                  style={{
                    width: "50%",
                    flexDirection: "row",
                    justifyContent: "space-evenly",
                    paddingTop: 8,
                    paddingRight: 5,
                    paddingLeft: 2.5,
                    gap: 5,
                    elevation: loading ? 0 : 4,
                  }}
                >
                  <TouchableRipple
                    style={{
                      alignItems: "center",
                      justifyContent: "center",
                      width: hasPlayer2 ? "49%" : "98%",
                      borderTopLeftRadius: 16,
                      borderTopEndRadius: 16,
                      backgroundColor:
                        loading ||
                        data.sets[`set_${data.details.playing_set}`].winner !==
                          ""
                          ? "#d3d3d3"
                          : "#ddf6dd",
                      elevation: loading ? 0 : 4,
                    }}
                    disabled={
                      loading ||
                      data.sets[`set_${data.details.playing_set}`].winner !== ""
                    }
                    onPress={() => score("b1")}
                  >
                    {loading ? (
                      <ActivityIndicator />
                    ) : (
                      <Text style={{ fontSize: 20, fontWeight: "bold" }}>
                        +{" "}
                        {data?.players.team_b.player_1.use_nickname
                          ? data?.players.team_b.player_1.nickname
                          : `${data?.players.team_b.player_1.first_name} ${data?.players.team_b.player_1.last_name}`}
                      </Text>
                    )}
                  </TouchableRipple>
                  {hasPlayer2 && (
                    <TouchableRipple
                      style={{
                        alignItems: "center",
                        justifyContent: "center",
                        width: "49%",
                        borderTopLeftRadius: 16,
                        borderTopEndRadius: 16,
                        backgroundColor:
                          loading ||
                          data.sets[`set_${data.details.playing_set}`]
                            .winner !== ""
                            ? "#d3d3d3"
                            : "#ddf6dd",
                        elevation: loading ? 0 : 4,
                      }}
                      disabled={
                        loading ||
                        data.sets[`set_${data.details.playing_set}`].winner !==
                          ""
                      }
                      onPress={() => score("b2")}
                    >
                      {loading ? (
                        <ActivityIndicator />
                      ) : (
                        <Text style={{ fontSize: 20, fontWeight: "bold" }}>
                          +{" "}
                          {data?.players.team_b.player_2.use_nickname
                            ? data?.players.team_b.player_2.nickname
                            : `${data?.players.team_b.player_2.first_name} ${data?.players.team_b.player_2.last_name}`}
                        </Text>
                      )}
                    </TouchableRipple>
                  )}
                </View>
              </View>
            )}
            <View
              style={{
                position: "absolute",
                top: data?.time.start ? "18%" : 0,
                backgroundColor: "white",
                flexDirection: data.sets[`set_${data.details.playing_set}`]
                  .switch
                  ? "row-reverse"
                  : "row",
                paddingHorizontal: 15,
                borderRadius: 16,
                gap: 32,
              }}
            >
              <Text style={{ fontSize: 38, fontWeight: "bold" }}>
                {
                  Object.values(data?.sets).filter(
                    (set: any) => set.winner === "a"
                  ).length
                }
              </Text>
              <Text style={{ fontSize: 38, fontWeight: "bold" }}>
                {
                  Object.values(data?.sets).filter(
                    (set: any) => set.winner === "b"
                  ).length
                }
              </Text>
            </View>
          </View>
        </>
      )}
    </>
  )
}

const Settings = ({ route, navigation }) => {
  const { id } = route.params
  const [data, setData] = useState<any>()
  const [gameRef, setGameRef] = useState<any>()
  const [loading, setLoading] = useState<boolean>(false)
  const [openForceWin, setOpenForceWin] = useState<boolean>(false)
  const [openResetSet, setOpenResetSet] = useState<boolean>(false)

  // Fetch Game Data
  useEffect(() => {
    const ref = doc(FIRESTORE_DB, "games", id)
    const sub = onSnapshot(ref, {
      next: (snapshot) => {
        if (snapshot.exists()) {
          const snap = snapshot.data()
          setGameRef(ref)
          setData(snap)
        }
      },
    })

    return () => sub()
  }, [id])

  const switchSide = async () => {
    setLoading(true)
    try {
      await updateDoc(gameRef, {
        sets: {
          ...data.sets,
          [`set_${data.details.playing_set}`]: {
            ...data.sets[`set_${data.details.playing_set}`],
            switch: !data.sets[`set_${data.details.playing_set}`].switch,
          },
        },
      })
    } catch (error: any) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleScoreboard = async () => {
    setLoading(true)
    try {
      if (gameRef) {
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
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleForceWin = () => {
    setOpenForceWin((prev: boolean) => !prev)
  }

  const handleResetSet = () => {
    setOpenResetSet((prev: boolean) => !prev)
  }

  // return (
  //   <View style={styles.settings}>
  //     <Portal>
  //       <ForceWin open={openForceWin} onClose={handleForceWin} id={id} />
  //       <ResetSet open={openResetSet} onClose={handleResetSet} id={id} />
  //     </Portal>
  //     <TouchableRipple
  //       style={{
  //         ...styles.touch,
  //         backgroundColor: data?.statuses.active ? "#AEC6CF" : "#91B2BE",
  //       }}
  //       disabled={loading}
  //       onPress={handleScoreboard}
  //     >
  //       <>
  //         {loading ? (
  //           <ActivityIndicator size={56} color="#273B42" />
  //         ) : (
  //           <Icon
  //             source={data?.statuses.active ? "eye" : "eye-outline"}
  //             size={56}
  //             color="#273B42"
  //           />
  //         )}
  //         <Text variant="labelLarge" style={{ color: "#273B42" }}>
  //           {data?.statuses.active ? "Hide" : "Show"} Scoreboard
  //         </Text>
  //       </>
  //     </TouchableRipple>
  //     {data?.time?.start && (
  //       <>
  //         <TouchableRipple
  //           style={{
  //             ...styles.touch,
  //             backgroundColor: "#D7CFC7",
  //           }}
  //           disabled={loading}
  //           onPress={switchSide}
  //         >
  //           <>
  //             {loading ? (
  //               <ActivityIndicator color="black" size={56} />
  //             ) : (
  //               <View
  //                 style={{
  //                   width: "100%",
  //                   flexDirection: "row",
  //                   alignItems: "center",
  //                   justifyContent: "center",
  //                 }}
  //               >
  //                 <Text
  //                   variant="displaySmall"
  //                   style={{
  //                     color: data?.sets[`set_${data.details.playing_set}`]
  //                       .switch
  //                       ? "darkgreen"
  //                       : "#FF8C00",
  //                     fontWeight: "bold",
  //                   }}
  //                 >
  //                   {data?.sets[`set_${data.details.playing_set}`].switch
  //                     ? "B"
  //                     : "A"}
  //                 </Text>
  //                 <Icon color="black" source="swap-horizontal" size={56} />
  //                 <Text
  //                   variant="displaySmall"
  //                   style={{
  //                     color: data?.sets[`set_${data.details.playing_set}`]
  //                       .switch
  //                       ? "#FF8C00"
  //                       : "darkgreen",
  //                     fontWeight: "bold",
  //                   }}
  //                 >
  //                   {data?.sets[`set_${data.details.playing_set}`].switch
  //                     ? "A"
  //                     : "B"}
  //                 </Text>
  //               </View>
  //             )}
  //             <Text variant="labelLarge" style={{ color: "black" }}>
  //               Switch Team Sides
  //             </Text>
  //           </>
  //         </TouchableRipple>
  //         {!!(
  //           data?.sets[`set_${data.details.playing_set}`].scoresheet.length >
  //             0 || data?.sets[`set_${data.details.playing_set}`].winner
  //         ) && (
  //           <TouchableRipple
  //             style={{
  //               ...styles.touch,
  //               backgroundColor: "pink",
  //             }}
  //             disabled={loading}
  //             onPress={handleResetSet}
  //           >
  //             <>
  //               {loading ? (
  //                 <ActivityIndicator color="red" size={56} />
  //               ) : (
  //                 <Icon color="red" source="restore-alert" size={56} />
  //               )}
  //               <Text variant="labelLarge" style={{ color: "red" }}>
  //                 Reset Set
  //               </Text>
  //             </>
  //           </TouchableRipple>
  //         )}
  //         {!data?.sets[`set_${data.details.playing_set}`].winner && (
  //           <TouchableRipple
  //             style={{
  //               ...styles.touch,
  //               backgroundColor: "#B4D3B2",
  //             }}
  //             disabled={loading}
  //             onPress={handleForceWin}
  //           >
  //             <>
  //               {loading ? (
  //                 <ActivityIndicator color="darkgreen" size={56} />
  //               ) : (
  //                 <Icon color="darkgreen" source="star" size={56} />
  //               )}
  //               <Text variant="labelLarge" style={{ color: "darkgreen" }}>
  //                 Force Win Set
  //               </Text>
  //             </>
  //           </TouchableRipple>
  //         )}
  //       </>
  //     )}
  //     <TouchableRipple
  //       style={{
  //         ...styles.touch,
  //         backgroundColor: "#fff192",
  //       }}
  //       disabled={loading}
  //       onPress={() => {
  //         navigation.navigate("Add Game", { data, id })
  //       }}
  //     >
  //       <>
  //         {loading ? (
  //           <ActivityIndicator color="#8B8000" size={56} />
  //         ) : (
  //           <Icon color="#8B8000" source="clipboard-edit-outline" size={56} />
  //         )}
  //         <Text style={{ color: "#8B8000" }}>Edit Game</Text>
  //       </>
  //     </TouchableRipple>
  //   </View>
  // )
  return (
    <>
      <Portal>
        <ForceWin open={openForceWin} onClose={handleForceWin} id={id} />
        <ResetSet open={openResetSet} onClose={handleResetSet} id={id} />
      </Portal>
      <View
        style={{
          width: "100%",
          flexDirection: "row",
          justifyContent: "space-evenly",
          gap: 2,
          paddingVertical: 24,
          paddingHorizontal: 12,
        }}
      >
        <TouchableRipple
          style={{
            height: 200,
            gap: 3,
            width: "15%",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#D6E2E7",
            elevation: loading ? 0 : 4,
            borderRadius: 16,
          }}
          disabled={loading}
          onPress={handleScoreboard}
        >
          <>
            {loading ? (
              <ActivityIndicator size={56} />
            ) : (
              <Icon
                source={data?.statuses.active ? "eye" : "eye-outline"}
                size={56}
                color="#273B42"
              />
            )}
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>
              {data?.statuses.active ? "Hide" : "Show"} Scoreboard
            </Text>
          </>
        </TouchableRipple>
        <TouchableRipple
          style={{
            height: 200,
            gap: 3,
            width: "15%",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#C6CFAE",
            elevation: loading ? 0 : 4,
            borderRadius: 16,
          }}
          disabled={loading}
          onPress={() => {
            navigation.navigate("Add Game", { data, id })
          }}
        >
          <>
            {loading ? (
              <ActivityIndicator size={56} />
            ) : (
              <Icon source="clipboard-edit-outline" size={56} color="#273B42" />
            )}
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>Edit Game</Text>
          </>
        </TouchableRipple>
        {data?.time.start && (
          <>
            <TouchableRipple
              style={{
                height: 200,
                gap: 3,
                width: "15%",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#CAB3E5",
                elevation: loading ? 0 : 4,
                borderRadius: 16,
              }}
              disabled={loading}
              onPress={switchSide}
            >
              <>
                {loading ? (
                  <ActivityIndicator size={56} />
                ) : (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 40,
                        fontWeight: "bold",
                        color: data?.sets[`set_${data.details.playing_set}`]
                          .switch
                          ? "#FF8C00"
                          : "darkgreen",
                      }}
                    >
                      {data?.sets[`set_${data.details.playing_set}`].switch
                        ? "B"
                        : "A"}
                    </Text>
                    <Icon source="swap-horizontal" size={56} color="#273B42" />
                    <Text
                      style={{
                        fontSize: 40,
                        fontWeight: "bold",

                        color: data?.sets[`set_${data.details.playing_set}`]
                          .switch
                          ? "darkgreen"
                          : "#FF8C00",
                      }}
                    >
                      {data?.sets[`set_${data.details.playing_set}`].switch
                        ? "A"
                        : "B"}
                    </Text>
                  </View>
                )}
                <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                  Switch Sides
                </Text>
              </>
            </TouchableRipple>
            {data?.sets[`set_${data.details.playing_set}`].scoresheet.length >
              0 && (
              <TouchableRipple
                style={{
                  height: 200,
                  gap: 3,
                  width: "15%",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#F7BEC0",
                  elevation: loading ? 0 : 4,
                  borderRadius: 16,
                }}
                disabled={loading}
                onPress={handleResetSet}
              >
                <>
                  {loading ? (
                    <ActivityIndicator size={56} />
                  ) : (
                    <Icon color="red" source="restore-alert" size={56} />
                  )}
                  <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                    Reset Set
                  </Text>
                </>
              </TouchableRipple>
            )}
            {!data?.sets[`set_${data.details.playing_set}`].winner && (
              <TouchableRipple
                style={{
                  height: 200,
                  gap: 3,
                  width: "15%",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#FFFAA0",
                  elevation: loading ? 0 : 4,
                  borderRadius: 16,
                }}
                disabled={loading}
                onPress={switchSide}
              >
                <>
                  {loading ? (
                    <ActivityIndicator size={56} />
                  ) : (
                    <Icon source="star" size={56} />
                  )}
                  <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                    Force Win Set
                  </Text>
                </>
              </TouchableRipple>
            )}
          </>
        )}
      </View>
    </>
  )
}

const Scoresheet = ({ route }) => {
  const { id } = route.params
  const [data, setData] = useState<any>()
  const [hasPlayer2, setHasPlayer2] = useState<boolean>(false)
  const [scoresheet, setScoresheet] = useState<any[]>([])

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

  useEffect(() => {
    if (data?.sets[`set_${data.details.playing_set}`].scoresheet.length > 0) {
      setScoresheet(
        data?.sets[`set_${data.details.playing_set}`].scoresheet.reverse()
      )
    } else {
      setScoresheet([])
    }
  }, [data])

  return (
    <View style={{ height: "100%", padding: 20 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        {/* TEAM A NAMES */}
        <View
          style={{
            width: "40%",
            justifyContent: "space-evenly",
            flexDirection: "row",
          }}
        >
          <View style={{ width: "40%" }}>
            <Text
              style={{
                textAlign: "center",
                fontSize: 21,

                paddingVertical: 20,
              }}
            >
              {data?.players.team_a.player_1.use_nickname
                ? data?.players.team_a.player_1.nickname
                : `${data?.players.team_a.player_1.first_name[0]}. ${data?.players.team_a.player_1.last_name}`}
            </Text>
          </View>
          {hasPlayer2 && (
            <View style={{ width: "40%" }}>
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 21,
                  paddingVertical: 20,
                }}
              >
                {data?.players.team_a.player_2.use_nickname
                  ? data?.players.team_a.player_2.nickname
                  : `${data?.players.team_a.player_2.first_name[0]}. ${data?.players.team_a.player_2.last_name}`}
              </Text>
            </View>
          )}
        </View>
        <View
          style={{
            width: "40%",
            justifyContent: "space-evenly",
            flexDirection: "row",
          }}
        >
          <View style={{ width: "40%" }}>
            <Text
              style={{
                textAlign: "center",
                fontSize: 21,
                paddingVertical: 20,
              }}
            >
              {data?.players.team_b.player_1.use_nickname
                ? data?.players.team_b.player_1.nickname
                : `${data?.players.team_b.player_1.first_name[0]}. ${data?.players.team_b.player_1.last_name}`}
            </Text>
          </View>
          {hasPlayer2 && (
            <View style={{ width: "40%" }}>
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 21,
                  paddingVertical: 20,
                }}
              >
                {data?.players.team_b.player_2.use_nickname
                  ? data?.players.team_b.player_2.nickname
                  : `${data?.players.team_b.player_2.first_name[0]}. ${data?.players.team_b.player_2.last_name}`}
              </Text>
            </View>
          )}
        </View>
      </View>
      <ScrollView>
        {scoresheet?.length > 0 &&
          scoresheet.map((score: any, index: number) => (
            <View
              key={index}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <View
                style={{
                  width: "40%",
                  justifyContent: "space-evenly",
                  flexDirection: "row",
                }}
              >
                <View style={{ width: "40%" }}>
                  <Text
                    style={{
                      textAlign: "center",
                      fontSize: 21,
                      borderWidth: 1,
                      paddingVertical: 20,
                    }}
                  >
                    {score?.scorer === "a1" && score.current_a_score}
                  </Text>
                </View>
                {hasPlayer2 && (
                  <View style={{ width: "40%" }}>
                    <Text
                      style={{
                        textAlign: "center",
                        fontSize: 21,
                        borderWidth: 1,
                        paddingVertical: 20,
                      }}
                    >
                      {score?.scorer === "a2" && score.current_b_score}
                    </Text>
                  </View>
                )}
              </View>
              {data.time.start && (
                <View
                  style={{
                    width: "20%",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      fontSize: 21,
                      paddingVertical: 20,
                    }}
                  >
                    {String(
                      moment(score.scored_at).diff(
                        moment(
                          data.time.start.seconds * 1000 +
                            data.time.start.nanoseconds / 1000000
                        ),
                        "minutes"
                      )
                    ).padStart(2, "0")}
                    :
                    {String(
                      moment(score.scored_at).diff(
                        moment(
                          data.time.start.seconds * 1000 +
                            data.time.start.nanoseconds / 1000000
                        ),
                        "seconds"
                      ) % 60
                    ).padStart(2, "0")}
                  </Text>
                </View>
              )}
              <View
                style={{
                  width: "40%",
                  justifyContent: "space-evenly",
                  flexDirection: "row",
                }}
              >
                <View style={{ width: "40%" }}>
                  <Text
                    style={{
                      textAlign: "center",
                      fontSize: 21,
                      borderWidth: 1,
                      paddingVertical: 20,
                    }}
                  >
                    {score?.scorer === "b1" && score.current_b_score}
                  </Text>
                </View>
                {hasPlayer2 && (
                  <View style={{ width: "40%" }}>
                    <Text
                      style={{
                        textAlign: "center",
                        fontSize: 21,
                        borderWidth: 1,
                        paddingVertical: 20,
                      }}
                    >
                      {score?.scorer === "b2" && score.current_b_score}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          {/* TEAM A NAMES */}
          <View
            style={{
              width: "40%",
              justifyContent: "space-evenly",
              flexDirection: "row",
              marginBottom: 3,
            }}
          >
            <View style={{ width: "40%" }}>
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 21,
                  borderWidth: 1,
                  paddingVertical: 20,
                }}
              >
                0
              </Text>
            </View>
            {hasPlayer2 && (
              <View style={{ width: "40%" }}>
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 21,
                    borderWidth: 1,
                    paddingVertical: 20,
                  }}
                >
                  0
                </Text>
              </View>
            )}
          </View>
          <View
            style={{
              width: "40%",
              justifyContent: "space-evenly",
              flexDirection: "row",
            }}
          >
            <View style={{ width: "40%" }}>
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 21,
                  borderWidth: 1,
                  paddingVertical: 20,
                }}
              >
                0
              </Text>
            </View>
            {hasPlayer2 && (
              <View style={{ width: "40%" }}>
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 21,
                    borderWidth: 1,
                    paddingVertical: 20,
                  }}
                >
                  0
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const Details = ({ route }) => {
  const { id } = route.params
  const [data, setData] = useState<any>()
  const [hasPlayer2, setHasPlayer2] = useState<boolean>(false)

  // Expandables
  const [showDetails, setShowDetails] = useState<boolean>(true)
  const [showPlayers, setShowPlayers] = useState<boolean>(false)
  const [showTimes, setShowTimes] = useState<boolean>(false)

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
  const [loading, setLoading] = useState<boolean>(true)
  const [data, setData] = useState<any>()

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
          setData(snapshot.data())
          setLoading(false)
        }
      },
    })

    return () => sub()
  }, [id])

  // Navigation Header
  useEffect(() => {
    if (data) {
      navigation.setOptions({
        title: `${data.details.category.split(".")[0]} (${
          data.details.category.split(".")[1]
        }) ${
          data.details.game_no && " | " + data.details.game_no
        }`.toUpperCase(),
        tabBarStyle: {
          display: "none",
        },
      })
    }
  }, [data])

  if (loading) {
    return <Loading />
  }

  return (
    <>
      <Tab.Navigator
        initialRouteName="Score"
        screenOptions={{
          tabBarIndicatorStyle: { backgroundColor: theme.colors.primary },
        }}
      >
        <Tab.Screen name="Score" component={Score} initialParams={{ id }} />
        <Tab.Screen
          name="Settings"
          component={Settings}
          initialParams={{ id }}
        />
        <Tab.Screen
          name="Scoresheet"
          component={Scoresheet}
          initialParams={{ id }}
        />
        <Tab.Screen name="Details" component={Details} initialParams={{ id }} />
      </Tab.Navigator>
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
  settings: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly",
    gap: 8,
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  button: {
    width: "20%",
    height: 180,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  touch: {
    width: "20%",
    height: 180,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    gap: 8,
  },
})
