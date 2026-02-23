import { db, type Job } from './db';

let counter = 0;

export function delay(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms));
}

export function createJob(
  type: string,
  execute: (updateProgress: (pct: number, log?: string) => void) => Promise<void>,
): Job {
  const job: Job = {
    id: `job-${++counter}-${Date.now()}`,
    type,
    status: 'queued',
    progress: 0,
    logs: [`[${new Date().toISOString()}] Job created: ${type}`],
    createdAt: new Date().toISOString(),
  };
  db.upsertJob(job);

  setTimeout(async () => {
    job.status = 'running';
    job.logs.push(`[${new Date().toISOString()}] Started`);
    db.upsertJob({ ...job });
    try {
      await execute((pct, log) => {
        job.progress = pct;
        if (log) job.logs.push(`[${new Date().toISOString()}] ${log}`);
        db.upsertJob({ ...job });
      });
      job.status = 'success';
      job.progress = 100;
      job.finishedAt = new Date().toISOString();
      job.logs.push(`[${new Date().toISOString()}] Completed`);
    } catch (e: any) {
      job.status = 'failed';
      job.finishedAt = new Date().toISOString();
      job.logs.push(`[${new Date().toISOString()}] Failed: ${e.message}`);
    }
    db.upsertJob({ ...job });
  }, 50);

  return job;
}

export function getJobs() { return db.getJobs(); }
export function getJob(id: string) { return db.getJobs().find(j => j.id === id); }
