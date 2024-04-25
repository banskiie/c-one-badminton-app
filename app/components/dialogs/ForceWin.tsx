import { StyleSheet, View } from "react-native"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Button,
  Dialog,
  Text,
  TouchableRipple,
} from "react-native-paper"
import { doc, onSnapshot, updateDoc } from "firebase/firestore"
import { FIRESTORE_DB } from "../../../firebase"

type DialogProps = { open: boolean; onClose: () => void; id: string }

export default ({ open, onClose, id }: DialogProps) => {
  const [data, setData] = useState<any>()
  const [loading, setLoading] = useState<boolean>(false)
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

  const forceWin = async (team: string) => {
    setLoading(true)
    try {
      const ref = doc(FIRESTORE_DB, "games", id)
      const current = `set_${data.details.playing_set}`

      switch (team) {
        case "a":
          await updateDoc(ref, {
            sets: {
              ...data.sets,
              [`set_${data.details.playing_set}`]: {
                ...data.sets[current],
                winner: team,
              },
            },
          })
          break
        case "b":
          await updateDoc(ref, {
            sets: {
              ...data.sets,
              [`set_${data.details.playing_set}`]: {
                ...data.sets[current],
                winner: team,
              },
            },
          })
          break
      }

      onClose()
    } catch (error: any) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog visible={open} onDismiss={onClose} dismissable={false}>
      <Dialog.Title style={{ textAlign: "center" }}>Force Win</Dialog.Title>
      <Dialog.Content style={styles.content}>
        <TouchableRipple
          style={{
            backgroundColor: "#FAC898",
            width: "48%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
          disabled={loading}
          onPress={() => forceWin("a")}
        >
          <>
            {loading ? (
              <ActivityIndicator />
            ) : (
              <>
                <Text style={{ fontSize: 40, fontWeight: "bold" }}>
                  {!!data?.players.team_a.team_name
                    ? data?.players.team_a.team_name
                    : "Team A"}
                </Text>
                <Text style={{ fontSize: 28 }}>
                  {data?.players.team_a.player_1.use_nickname
                    ? data?.players.team_a.player_1.nickname
                    : `${data?.players.team_a.player_1.first_name} ${data?.players.team_a.player_1.last_name}`}
                </Text>
                {hasPlayer2 && (
                  <Text style={{ fontSize: 28 }}>
                    {data?.players.team_a.player_2.use_nickname
                      ? data?.players.team_a.player_2.nickname
                      : `${data?.players.team_a.player_2.first_name} ${data?.players.team_a.player_2.last_name}`}
                  </Text>
                )}
              </>
            )}
          </>
        </TouchableRipple>
        <TouchableRipple
          style={{
            backgroundColor: "#ddf6dd",
            width: "48%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
          disabled={loading}
          onPress={() => forceWin("b")}
        >
          <>
            {loading ? (
              <ActivityIndicator />
            ) : (
              <>
                <Text style={{ fontSize: 40, fontWeight: "bold" }}>
                  {!!data?.players.team_b.team_name
                    ? data?.players.team_b.team_name
                    : "Team B"}
                </Text>
                <Text style={{ fontSize: 28 }}>
                  {data?.players.team_b.player_1.use_nickname
                    ? data?.players.team_b.player_1.nickname
                    : `${data?.players.team_b.player_1.first_name} ${data?.players.team_b.player_1.last_name}`}
                </Text>
                {hasPlayer2 && (
                  <Text style={{ fontSize: 28 }}>
                    {data?.players.team_b.player_2.use_nickname
                      ? data?.players.team_b.player_2.nickname
                      : `${data?.players.team_b.player_2.first_name} ${data?.players.team_b.player_2.last_name}`}
                  </Text>
                )}
              </>
            )}
          </>
        </TouchableRipple>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onClose}>Close</Button>
      </Dialog.Actions>
    </Dialog>
  )
}

const styles = StyleSheet.create({
  content: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    gap: 10,
  },
  button: {
    width: 360,
    height: 180,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
})
