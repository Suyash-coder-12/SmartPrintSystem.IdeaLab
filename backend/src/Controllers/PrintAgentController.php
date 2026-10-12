<?php

namespace SmartPrint\Controllers;

use SmartPrint\Services\DatabaseService;
use SmartPrint\Services\AutoTrashService;

class PrintAgentController
{
    private DatabaseService $db;

    public function __construct()
    {
        $this->db = DatabaseService::getInstance();
    }

    // Agent handshake & registration
    public function handshake(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $centerCode = $input['center_code'] ?? 'XC-89412';

        $center = $this->db->findOne('centers', ['center_code' => strtoupper($centerCode)])
               ?: $this->db->findOne('centers', ['id' => 'cnt_01']);

        if (!$center) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Center not found for agent handshake']);
            return;
        }

        $printers = $this->db->findMany('printers', ['center_id' => $center['id']]);

        echo json_encode([
            'success' => true,
            'agent_status' => 'connected',
            'session_id' => 'agt_sess_' . bin2hex(random_bytes(6)),
            'center' => [
                'id' => $center['id'],
                'code' => $center['center_code'],
                'name' => $center['name']
            ],
            'printers' => $printers,
            'polling_interval_sec' => 3,
            'message' => 'Secure print agent channel established'
        ]);
    }

    // Agent polls for pending approved jobs
    public function getPendingJobs(): void
    {
        $centerCode = $_GET['center_code'] ?? 'XC-89412';
        $center = $this->db->findOne('centers', ['center_code' => strtoupper($centerCode)])
               ?: $this->db->findOne('centers', ['id' => 'cnt_01']);

        $jobs = $this->db->findMany('print_jobs', [
            'center_id' => $center['id'],
            'payment_status' => 'paid'
        ]);

        $approvedJobs = array_values(array_filter($jobs, function ($j) {
            return in_array($j['job_status'], ['queued', 'spooling']);
        }));

        echo json_encode([
            'success' => true,
            'center_code' => $center['center_code'],
            'queue_length' => count($approvedJobs),
            'jobs' => $approvedJobs
        ]);
    }

    // Agent updates print status (spooling -> printing -> completed)
    public function updatePrintStatus(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $jobId = $input['job_id'] ?? '';
        $newStatus = $input['status'] ?? 'printing'; // 'spooling', 'printing', 'completed', 'failed'
        $printerId = $input['printer_id'] ?? null;

        $job = $this->db->findOne('print_jobs', ['id' => $jobId]);
        if (!$job) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Job not found']);
            return;
        }

        $update = [
            'job_status' => $newStatus,
            'updated_at' => date('Y-m-d H:i:s')
        ];
        if ($printerId) {
            $update['assigned_printer_id'] = $printerId;
        }

        $this->db->update('print_jobs', ['id' => $jobId], $update);

        echo json_encode([
            'success' => true,
            'message' => "Job $jobId updated to $newStatus",
            'job_id' => $jobId,
            'status' => $newStatus
        ]);
    }

    // Trigger auto trash cleanup
    public function triggerAutoTrash(): void
    {
        $result = AutoTrashService::cleanupExpiredFiles();
        echo json_encode([
            'success' => true,
            'message' => 'Auto-trash purge process completed',
            'result' => $result
        ]);
    }
}
