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

  const reset = async () => {
    setLoading(true)
    try {
      await updateDoc(doc(FIRESTORE_DB, "games", id), {
        sets: {
          ...data.sets,
          [`set_${data.details.playing_set}`]: {
            a_score: 0,
            b_score: 0,
            current_round: 1,
            last_team_scored: "",
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
            shuttles_used: 0,
            winner: "",
          },
        },
        statuses: {
          ...data.statuses,
          focus: Date.now(),
        },
      })
      onClose()
    } catch (error: any) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog visible={open} onDismiss={onClose} dismissable={false}>
      <Dialog.Title>Reset Set</Dialog.Title>
      <Dialog.Content>
        <Text>
          Are you sure you want to proceed? This action will reset both team
          scores to zero (0), clear the scoresheet to its initial values, and
          reset the winner of this set to the beginning. Set{" "}
          {data?.details.playing_set}.
        </Text>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onClose}>Close</Button>
        <Button onPress={reset} textColor="red">
          Reset
        </Button>
      </Dialog.Actions>
    </Dialog>
  )
}

const styles = StyleSheet.create({})
