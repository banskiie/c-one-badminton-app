import { StyleSheet, View } from "react-native"
import { useEffect, useState } from "react"
import { Button, Dialog, Text } from "react-native-paper"
import { doc, onSnapshot, updateDoc } from "firebase/firestore"
import { FIRESTORE_DB } from "../../../firebase"

type DialogProps = { open: boolean; onClose: () => void; id: string }

export default ({ open, onClose, id }: DialogProps) => {
  const [data, setData] = useState<any>()
  const [loading, setLoading] = useState<boolean>(false)

  // Fetch Game Data
  useEffect(() => {
    const game = doc(FIRESTORE_DB, "games", id)
    const sub = onSnapshot(game, {
      next: (snapshot) => {
        if (snapshot.exists()) {
          setData(snapshot.data())
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
        <Button
          mode="contained-tonal"
          style={styles.button}
          onPress={() => forceWin("a")}
          loading={loading}
        >
          <Text variant="displaySmall">Team A</Text>
        </Button>
        <Button
          mode="contained-tonal"
          style={styles.button}
          onPress={() => forceWin("b")}
          loading={loading}
        >
          <Text variant="displaySmall">Team B</Text>
        </Button>
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
