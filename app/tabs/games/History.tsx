import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore"
import { useEffect, useRef, useState } from "react"
import { StyleSheet, View, Animated } from "react-native"
import { FIREBASE_AUTH, FIRESTORE_DB } from "../../../firebase"
import { onAuthStateChanged } from "firebase/auth"
import {
  Button,
  Divider,
  Surface,
  Text,
  TouchableRipple,
} from "react-native-paper"
import { FlashList } from "@shopify/flash-list"
import Loading from "../../components/Loading"

export default ({ navigation }: any) => {
  const [currentCourt, setCurrentCourt] = useState<string>("")
  const [games, setGames] = useState<any[]>([])
  // Loading Animation
  const [loading, setLoading] = useState<boolean>(true)
  const fade = useRef(new Animated.Value(0)).current

  // Fade Settings
  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [fade])

  // Check Current Court
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      if (user.displayName) {
        setCurrentCourt(user.displayName)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // Fetch All Games (Per Court)
  useEffect(() => {
    if (currentCourt) {
      const fetchGames = async () => {
        try {
          const ref = collection(FIRESTORE_DB, "games")
          const q = query(
            ref,
            where("details.court", "==", currentCourt),
            where("statuses.current", "==", "finished"),
            orderBy("time.end", "desc"),
            orderBy("details.created_date", "asc")
          )
          onSnapshot(q, {
            next: (snapshot) => {
              setGames(
                snapshot.docs.map((doc: any) => ({
                  id: doc.id,
                  ...doc.data(),
                }))
              )
              setLoading(false)
            },
            error: (error: any) => {
              console.error(error)
            },
          })
        } catch (error: any) {
          console.error(error)
        }
      }

      fetchGames()
    }
  }, [currentCourt])

  const statusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "#273B42"
      case "current":
        return "green"
      case "finished":
        return "blue"
    }
  }

  return (
    <Animated.View style={{ ...styles.container, opacity: fade }}>
      {loading ? (
        <Loading />
      ) : (
        <>
          <FlashList
            data={games}
            renderItem={({ item }) => (
              <TouchableRipple
                style={{
                  marginVertical: 5,
                  marginHorizontal: 8,
                  backgroundColor: "white",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 12,
                  height: 240,
                }}
                onPress={() => navigation.navigate("View Game", { ...item })}
              >
                <>
                  <View
                    style={{
                      height: "20%",
                      width: "100%",
                      flexDirection: "row",
                      padding: 5,
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ textTransform: "uppercase", fontSize: 16 }}>
                      {item.details.category.split(".")[0]}{" "}
                      {item.details.category.split(".")[1]}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "flex-end",
                        gap: 8,
                      }}
                    >
                      {Array.from({ length: item.details.no_of_sets }).map(
                        (_, index) => {
                          if (index + 1 <= item.details.playing_set) {
                            return (
                              <View key={index} style={{ width: 45 }}>
                                <Text
                                  style={{
                                    textTransform: "uppercase",
                                    textAlign: "center",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {index + 1}
                                </Text>
                              </View>
                            )
                          }
                        }
                      )}
                    </View>
                  </View>
                  <View
                    style={{
                      height: "60%",
                      padding: 5,
                      flexDirection: "row",
                      justifyContent: "center",
                    }}
                  >
                    <View
                      style={{
                        height: "100%",
                        gap: 5,
                      }}
                    >
                      <View
                        style={{
                          width: "100%",
                          height: "49%",
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <View
                          style={{
                            gap: 2,
                            flexDirection: "column",
                            justifyContent: "center",
                          }}
                        >
                          <Text
                            style={{ fontSize: 18, textTransform: "uppercase" }}
                          >
                            {item.players.team_a.player_1.use_nickname
                              ? item.players.team_a.player_1.nickname
                              : `${item.players.team_a.player_1.first_name} ${item.players.team_a.player_1.last_name}`}
                          </Text>
                          {item.details.category.split(".")[1] ===
                            "doubles" && (
                            <Text
                              style={{
                                fontSize: 18,
                                textTransform: "uppercase",
                              }}
                            >
                              {item.players.team_a.player_2.use_nickname
                                ? item.players.team_a.player_2.nickname
                                : `${item.players.team_a.player_2.first_name} ${item.players.team_a.player_2.last_name}`}
                            </Text>
                          )}
                        </View>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                          <Surface
                            elevation={0}
                            style={{
                              width: 45,
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "#E6E6E6",
                              marginRight: 15,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 28,
                                fontWeight: "bold",
                              }}
                            >
                              {
                                Object.values(item?.sets).filter(
                                  (set: any) => set.winner === "a"
                                ).length
                              }
                            </Text>
                          </Surface>

                          {Array.from({ length: item.details.no_of_sets }).map(
                            (_, index) => {
                              const set = item?.sets[`set_${index + 1}`]

                              if (index + 1 <= item.details.playing_set) {
                                return (
                                  <Surface
                                    elevation={0}
                                    key={index}
                                    style={{
                                      width: 45,
                                      alignItems: "center",
                                      justifyContent: "center",
                                      backgroundColor:
                                        set?.winner === "a"
                                          ? "#ed6c02"
                                          : "#E6E6E6",
                                      borderWidth:
                                        index + 1 == item.details.playing_set
                                          ? 1
                                          : 0,
                                      borderColor:
                                        index + 1 == item.details.playing_set
                                          ? "#ed6c02"
                                          : "transparent",
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 28,
                                        fontWeight: "bold",
                                        color:
                                          set?.winner === "a"
                                            ? "white"
                                            : "black",
                                      }}
                                    >
                                      {item.sets[`set_${index + 1}`].a_score}
                                    </Text>
                                  </Surface>
                                )
                              }
                            }
                          )}
                        </View>
                      </View>
                      <Divider />
                      <View
                        style={{
                          height: "49%",
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <View
                          style={{
                            gap: 2,
                            flexDirection: "column",
                            justifyContent: "center",
                          }}
                        >
                          <Text
                            style={{ fontSize: 18, textTransform: "uppercase" }}
                          >
                            {item.players.team_b.player_1.use_nickname
                              ? item.players.team_b.player_1.nickname
                              : `${item.players.team_b.player_1.first_name} ${item.players.team_b.player_1.last_name}`}
                          </Text>
                          {item.details.category.split(".")[1] ===
                            "doubles" && (
                            <Text
                              style={{
                                fontSize: 18,
                                textTransform: "uppercase",
                              }}
                            >
                              {item.players.team_b.player_2.use_nickname
                                ? item.players.team_b.player_2.nickname
                                : `${item.players.team_b.player_2.first_name} ${item.players.team_a.player_2.last_name}`}
                            </Text>
                          )}
                        </View>

                        <View style={{ flexDirection: "row", gap: 8 }}>
                          <Surface
                            elevation={0}
                            style={{
                              width: 45,
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "#E6E6E6",
                              marginRight: 15,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 28,
                                fontWeight: "bold",
                              }}
                            >
                              {
                                Object.values(item?.sets).filter(
                                  (set: any) => set.winner === "b"
                                ).length
                              }
                            </Text>
                          </Surface>
                          {Array.from({ length: item.details.no_of_sets }).map(
                            (_, index) => {
                              const set = item?.sets[`set_${index + 1}`]

                              if (index + 1 <= item.details.playing_set) {
                                return (
                                  <Surface
                                    elevation={0}
                                    key={index}
                                    style={{
                                      width: 45,
                                      alignItems: "center",
                                      justifyContent: "center",
                                      backgroundColor:
                                        set?.winner === "b"
                                          ? "#1F7D1F"
                                          : "#E6E6E6",
                                      borderWidth:
                                        index + 1 == item.details.playing_set
                                          ? 1
                                          : 0,
                                      borderColor:
                                        index + 1 == item.details.playing_set
                                          ? "#1F7D1F"
                                          : "transparent",
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 28,
                                        fontWeight: "bold",
                                        color:
                                          set?.winner === "b"
                                            ? "white"
                                            : "black",
                                      }}
                                    >
                                      {item.sets[`set_${index + 1}`].b_score}
                                    </Text>
                                  </Surface>
                                )
                              }
                            }
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                  <View
                    style={{
                      height: "20%",
                      width: "100%",
                      paddingTop: 6,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ textTransform: "uppercase" }}>
                      Best of {item.details.no_of_sets}
                    </Text>
                    <View
                      style={{
                        backgroundColor: statusColor(item.statuses.current),
                        padding: 2,
                        borderRadius: 6,
                        width: 100,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          textTransform: "uppercase",
                          color: "white",
                          textAlign: "center",
                          fontWeight: "bold",
                        }}
                      >
                        {item.statuses.current}
                      </Text>
                    </View>
                  </View>
                </>
              </TouchableRipple>
            )}
            estimatedItemSize={200}
          />
        </>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: "100%",
    display: "flex",
    alignContent: "center",
    justifyContent: "center",
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: "#E6E6E6",
  },
  list: {
    width: "100%",
    height: "100%",
  },
  card: {
    marginVertical: 6,
    marginHorizontal: 8,
    backgroundColor: "white",
  },
  title: {
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  subtitle: {
    display: "flex",
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    backgroundColor: "yellow",
    justifyContent: "space-between",
  },
  subtitle_status: {
    fontSize: 10,
    paddingVertical: 1.75,
    fontWeight: "bold",
    paddingHorizontal: 7,
    borderRadius: 16,
    marginTop: 2,
    color: "white",
    textTransform: "uppercase",
  },
  content: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  set_number: {
    width: "20%",
    textAlign: "center",
    color: "gray",
  },
  scoreboard: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
  },
  score_container: {
    width: "30%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  score: {
    fontWeight: "bold",
    textAlign: "center",
  },
  team_name: {
    width: "40%",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  winner: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    color: "white",
    textTransform: "uppercase",
    borderRadius: 12,
    fontSize: 9,
    fontWeight: "bold",
    alignContent: "center",
    backgroundColor: "green",
  },
  team_a: { textAlign: "left" },
  team_b: { textAlign: "right" },
})
