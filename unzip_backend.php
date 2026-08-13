<?php
$dir = dirname(__DIR__); // /home/gymtragh

$log = [];

$targetDirs = [
    $dir . '/backend',
    $dir . '/bingo.gymtradingplc.com'
];

foreach ($targetDirs as $targetDir) {
    if (!file_exists($targetDir)) {
        mkdir($targetDir, 0755, true);
    }
    
    $zipPath = __DIR__ . '/backend-full.zip';
    if (file_exists($zipPath)) {
        $zip = new ZipArchive;
        if ($zip->open($zipPath) === TRUE) {
            $zip->extractTo($targetDir . '/');
            $zip->close();
            $log[] = "Extracted to " . $targetDir;
        }
    }
}

header('Content-Type: application/json');
echo json_encode(['status' => 'ok', 'log' => $log]);
?>
