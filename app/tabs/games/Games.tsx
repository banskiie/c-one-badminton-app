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
import { Card, IconButton, Text } from "react-native-paper"
import { FlashList } from "@shopify/flash-list"
import { theme } from "../../theme/theme"
import moment from "moment"
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
    const fetchGames = async () => {
      try {
        const ref = collection(FIRESTORE_DB, "games_test")
        const q = currentCourt
          ? query(
              ref,
              where("details.court", "==", currentCourt),
              orderBy("time.slot", "asc")
            )
          : query(ref, orderBy("created_date", "asc"))
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
  }, [currentCourt])

  const pickStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "slategray"
      case "on going":
        return "red"
      case "finished":
        return "green"
      default:
        return theme.colors.primary
    }
  }

  return (
    <Animated.View style={{ ...styles.container, opacity: fade }}>
      {loading ? (
        <Loading />
      ) : (
        <>
          <Text style={{ textAlign: "center" }}>
            Total Games: {games.length}
          </Text>
          <FlashList
            data={games}
            renderItem={({ item }) => (
              <Card key={item.id} style={styles.card}>
                <Card.Title
                  title={item.details.category}
                  titleVariant="titleMedium"
                  titleStyle={styles.title}
                  subtitle={
                    <View style={styles.subtitle}>
                      <Text>{`${moment(item.time.slot.toDate()).format(
                        "h:mA"
                      )} | ${item.details.game_no}`}</Text>
                      <Text
                        style={{
                          ...styles.subtitle_status,
                          backgroundColor: pickStatusColor(
                            item.statuses.current
                          ),
                        }}
                      >
                        {item.statuses.current}
                      </Text>
                    </View>
                  }
                  subtitleStyle={{ color: "slategray" }}
                />
                <Card.Content>
                  <View style={styles.content}>
                    <Text style={{ ...styles.team_name, textAlign: "left" }}>
                      {item.players.team_a.team_name}
                    </Text>
                    <Text style={styles.set_number}>
                      Set {item.details.playing_set}
                    </Text>
                    <Text
                      style={{
                        ...styles.team_name,
                        textAlign: "right",
                      }}
                    >
                      {item.players.team_b.team_name}
                    </Text>
                  </View>
                  <View style={styles.scoreboard}>
                    <View
                      style={{
                        width: "35%",
                        height: "100%",
                      }}
                    >
                      <View style={styles.scoreboard}>
                        <Text variant="titleMedium" style={styles.team_a}>
                          {item.players.team_a.player_1.first_name[0]}.{" "}
                          {item.players.team_a.player_1.last_name}{" "}
                        </Text>
                      </View>
                      {!!item.players.team_a.player_2.first_name && (
                        <View style={styles.scoreboard}>
                          <Text
                            variant="titleMedium"
                            style={{ textAlign: "left", fontWeight: "bold" }}
                          >
                            {item.players.team_a.player_2.first_name[0]}.{" "}
                            {item.players.team_a.player_2.last_name}{" "}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.score_container}>
                      <View
                        style={{
                          width: "40%",
                        }}
                      >
                        <Text variant="displayMedium" style={styles.score}>
                          {item.sets[`set_${item.details.playing_set}`].a_score}
                        </Text>
                      </View>
                      <View
                        style={{
                          width: "20%",
                        }}
                      >
                        <Text variant="displayMedium" style={styles.score}>
                          -
                        </Text>
                      </View>

                      <View
                        style={{
                          width: "40%",
                        }}
                      >
                        <Text variant="displayMedium" style={styles.score}>
                          {item.sets[`set_${item.details.playing_set}`].b_score}
                        </Text>
                      </View>
                    </View>
                    <View style={{ width: "35%", height: "100%" }}>
                      <View
                        style={{
                          ...styles.scoreboard,
                          justifyContent: "flex-end",
                        }}
                      >
                        <Text variant="titleMedium" style={styles.team_b}>
                          {" "}
                          {item.players.team_b.player_1.first_name[0]}.{" "}
                          {item.players.team_b.player_1.last_name}
                        </Text>
                      </View>
                      {!!item.players.team_b.player_2.first_name && (
                        <View
                          style={{
                            ...styles.scoreboard,
                            justifyContent: "flex-end",
                          }}
                        >
                          <Text variant="titleMedium" style={styles.team_b}>
                            {" "}
                            {item.players.team_b.player_2.first_name[0]}.{" "}
                            {item.players.team_b.player_2.last_name}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Card.Content>
                <Card.Actions>
                  {!(
                    item.statuses.current === "finished" ||
                    item.statuses.current === "no match" ||
                    item.statuses.current === "forfeit"
                  ) && (
                    <IconButton
                      icon="badminton"
                      mode="contained"
                      containerColor={theme.colors.secondary}
                      size={14}
                      onPress={() =>
                        navigation.navigate("Score Game", { ...item })
                      }
                    />
                  )}
                </Card.Actions>
              </Card>
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
    justifyContent: "center",
  },
  subtitle_status: {
    fontSize: 10,
    paddingVertical: 1.75,
    fontWeight: "bold",
    paddingHorizontal: 7,
    borderRadius: 16,
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
  team_name: { width: "40%", color: "gray" },
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
  team_a: { textAlign: "left", fontWeight: "bold" },
  team_b: { textAlign: "right", fontWeight: "bold" },
})
