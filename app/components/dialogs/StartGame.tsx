import { StyleSheet } from "react-native"
import { useEffect, useState } from "react"
import { Button, Dialog, Text } from "react-native-paper"
import { doc, getDoc, onSnapshot, runTransaction } from "firebase/firestore"
import { FIRESTORE_DB } from "../../../firebase"
import moment from "moment"

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

  const start = async () => {
    setLoading(true)
    try {
      await runTransaction(FIRESTORE_DB, async (transaction) => {
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
              focus: Date.now(),
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
      onClose()
    }
  }

  return (
    <Dialog visible={open} onDismiss={onClose} dismissable={false}>
      <Dialog.Title>Start Game</Dialog.Title>
      <Dialog.Content>
        <Text>Are you sure you want to start the game?</Text>
      </Dialog.Content>
      <Dialog.Actions>
        <Button loading={loading} onPress={onClose}>
          Close
        </Button>
        <Button loading={loading} onPress={start} textColor="red">
          Start
        </Button>
      </Dialog.Actions>
    </Dialog>
  )
}

const styles = StyleSheet.create({})
