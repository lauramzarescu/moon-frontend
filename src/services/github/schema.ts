import { z } from 'zod';

export const githubRepositorySchema = z.object({
    id: z.number(),
    name: z.string(),
    full_name: z.string(),
    private: z.boolean(),
    owner: z.string(),
    default_branch: z.string(),
    html_url: z.string().url(),
});

export type GithubRepository = z.infer<typeof githubRepositorySchema>;

export const serviceRepositoryRecordSchema = z.object({
    id: z.string(),
    serviceArn: z.string(),
    owner: z.string(),
    repo: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    organizationId: z.string(),
});

export type ServiceRepositoryRecord = z.infer<typeof serviceRepositoryRecordSchema>;

export const latestCommitResponseSchema = z.object({
    sha: z.string(),
    message: z.string(),
    authorName: z.string().nullable(),
    authorEmail: z.string().nullable(),
    date: z.string().nullable(),
    url: z.string().url(),
});

export type LatestCommitResponse = z.infer<typeof latestCommitResponseSchema>;

export const githubBranchSchema = z.object({
    name: z.string(),
    commit: z.object({
        sha: z.string(),
        url: z.string().url(),
    }),
});

export type GithubBranch = z.infer<typeof githubBranchSchema>;

export const githubPullRequestUserSchema = z.object({
    login: z.string().nullable(),
    avatar_url: z.string().nullable(),
});

export const githubPullRequestRefSchema = z.object({
    ref: z.string(),
    sha: z.string(),
});

export const githubPullRequestSchema = z.object({
    id: z.number(),
    number: z.number(),
    title: z.string(),
    head: githubPullRequestRefSchema,
    base: githubPullRequestRefSchema,
    state: z.literal('open'),
    created_at: z.string(),
    updated_at: z.string(),
    html_url: z.string(),
    user: githubPullRequestUserSchema,
});

export const linkServiceRepositoryRequestSchema = z.object({
    repo: z.string().min(1, 'Repository name is required'),
    serviceArn: z.string().min(1, 'Service ARN is required'),
});

export type LinkServiceRepositoryRequest = z.infer<typeof linkServiceRepositoryRequestSchema>;

export const githubRepositoryListSchema = z.array(githubRepositorySchema);
export const serviceRepositoryRecordListSchema = z.array(serviceRepositoryRecordSchema);
export const githubBranchListSchema = z.array(githubBranchSchema);
export const githubPullRequestListSchema = z.object({
    openPullRequests: z.array(githubPullRequestSchema),
    branches: z.array(githubBranchSchema),
});

export type GithubPullRequest = z.infer<typeof githubPullRequestSchema>;

export type GithubRepositoryList = z.infer<typeof githubRepositoryListSchema>;
export type ServiceRepositoryRecordList = z.infer<typeof serviceRepositoryRecordListSchema>;
export type GithubBranchList = z.infer<typeof githubBranchListSchema>;
export type GithubPullRequestList = z.infer<typeof githubPullRequestListSchema>;
