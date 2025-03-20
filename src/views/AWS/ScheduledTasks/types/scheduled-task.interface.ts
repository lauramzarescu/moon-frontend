export interface ScheduledTaskInterface {
    name: string
    cron: string
    command: string
    status: 'ENABLED' | 'DISABLED'
    eventBusName: string
    arn: string
    readableCron?: string
    nextRun?: string
    nextRuns?: string[]
}

export type ScheduledTaskEventInterface = Pick<ScheduledTaskInterface, 'readableCron' | 'nextRuns'>
