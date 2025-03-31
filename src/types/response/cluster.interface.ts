import type { ClusterInterface } from '@/views/AWS/Clusters/types/cluster.interface.ts'
import type { InstanceInterface } from '@/views/AWS/Services/types/service.interface.ts'

export interface ClusterResponseInterface {
    clusters: {
        clusters: ClusterInterface[]
    }
    ec2Instances: {
        instances: InstanceInterface[]
    }
    updatedOn: Date
}
