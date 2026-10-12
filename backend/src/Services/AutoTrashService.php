<?php

namespace SmartPrint\Services;

class AutoTrashService
{
    public static function cleanupExpiredFiles(): array
    {
        $db = DatabaseService::getInstance();
        $jobs = $db->findMany('print_jobs');
        $now = time();
        $trashedCount = 0;
        $trashedIds = [];

        foreach ($jobs as $job) {
            // Check if job completed and retention passed
            if (!empty($job['trashed_at'])) {
                continue;
            }

            $createdTime = strtotime($job['created_at']);
            $retentionHours = (int)($job['retention_hours'] ?? 24);
            $expireThreshold = $createdTime + ($retentionHours * 3600);

            // Also allow manual purge if status is completed
            if ($now > $expireThreshold || ($job['job_status'] === 'completed' && ($now - $createdTime > 7200))) {
                if (!empty($job['file_path']) && file_exists($job['file_path'])) {
                    @unlink($job['file_path']);
                }

                $db->update('print_jobs', ['id' => $job['id']], [
                    'file_path' => null,
                    'trashed_at' => date('Y-m-d H:i:s'),
                    'job_status' => ($job['job_status'] === 'completed') ? 'completed' : 'trashed',
                    'updated_at' => date('Y-m-d H:i:s')
                ]);

                $trashedCount++;
                $trashedIds[] = $job['id'];
            }
        }

        return [
            'cleaned' => $trashedCount,
            'job_ids' => $trashedIds,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
}
