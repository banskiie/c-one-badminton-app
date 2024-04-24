import { doc, onSnapshot } from "firebase/firestore"
import { List, Text } from "react-native-paper"
import { useEffect, useState } from "react"
import { StyleSheet, ScrollView, View } from "react-native"
import { FIRESTORE_DB } from "../../../firebase"
import { theme } from "../../theme/theme"
import * as ScreenOrientation from "expo-screen-orientation"
import Loading from "../../components/Loading"
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs"
import moment from "moment"

const Tab = createMaterialTopTabNavigator()

const Scoresheet = ({ route }) => {
  const { data, hasPlayer2 } = route.params
  const [scoresheet, setScoresheet] = useState<any[]>([])

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
  const [hasPlayer2, setHasPlayer2] = useState<boolean>(false)

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
          if (snap.details.category.split(".")[1] === "doubles") {
            setHasPlayer2(true)
          } else {
            setHasPlayer2(false)
          }
          setData(snap)
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
        headerShown: true,
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
        <Tab.Screen
          name="Scoresheet"
          component={Scoresheet}
          initialParams={{ id, data, hasPlayer2 }}
        />
        <Tab.Screen name="Details" component={Details} initialParams={{  id, data, hasPlayer2}} />
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
