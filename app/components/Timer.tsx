import moment from "moment"
import { useState, useEffect } from "react"
import { Text } from "react-native-paper"

export default ({ start }) => {
  const [duration, setDuration] = useState(moment.duration(0))

  useEffect(() => {
    let interval
    if (start) {
      interval = setInterval(() => {
        const game = moment(start.seconds * 1000 + start.nanoseconds / 1000000)
        const now = moment()
        const elapsed = moment.duration(now.diff(game))
        setDuration(elapsed)
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [start])

  return (
    <Text variant="displaySmall" style={{ textAlign: "center" }}>
      {`${
        duration.hours() > 0
          ? duration.hours().toString().padStart(2, "0") + "h"
          : ""
      } ${duration.minutes().toString().padStart(2, "0")}m ${duration
        .seconds()
        .toString()
        .padStart(2, "0")}s`}
    </Text>
  )
}
