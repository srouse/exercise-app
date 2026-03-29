/**
 * Preset exercises for the log-exercise picker (grouped, large-touch UI).
 * Order matches your routine; labels are stored as logged on the server.
 */
export type ExercisePresetGroup = {
  label: string
  exercises: readonly string[]
}

export const EXERCISE_PRESET_GROUPS: readonly ExercisePresetGroup[] = [
  {
    label: 'STRETCH',
    exercises: [
      'Chair Rotation',
      'Overhead Arm Reach',
      'Shoulder Roll',
      'Down Dog to Up Dog',
      'Neck Stretches',
      'Back shoulder press',
    ],
  },
  {
    label: 'UPPER',
    exercises: [
      'Push Ups',
      'Rear Delts',
      'Bicep Arm Curls',
      'Skull Crusher',
      'Wrist Curl',
    ],
  },
  {
    label: 'LOWER',
    exercises: ['Superman', 'Bird-dog', 'Glute Bridge', 'Squats', 'Jackknife'],
  },
] as const
