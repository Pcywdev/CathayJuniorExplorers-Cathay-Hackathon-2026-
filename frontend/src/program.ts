import program from '@shared/program.json'

// Every displayed number comes from here (or from the API).
export { program }

export const formatNumber = (n: number) => n.toLocaleString('en-US')

export const missionById = (id: string) => {
  const mission = program.missions.find((m) => m.id === id)
  if (!mission) throw new Error(`Unknown mission: ${id}`)
  return mission
}
