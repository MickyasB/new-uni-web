<?php
// Automatic deployment extractor
$dir = __DIR__;

$log = [];

// Extract Player App
if (file_exists($dir . '/player-app-dist.zip')) {
    $zip = new ZipArchive;
    if ($zip->open($dir . '/player-app-dist.zip') === TRUE) {
        $zip->extractTo($dir . '/');
        $zip->close();
        $log[] = "Player App extracted successfully.";
        unlink($dir . '/player-app-dist.zip');
    } else {
        $log[] = "Failed to open player-app-dist.zip";
    }
}

// Extract Admin App
if (!file_exists($dir . '/admin')) {
    mkdir($dir . '/admin', 0755, true);
}

if (file_exists($dir . '/admin-app-dist.zip')) {
    $zip = new ZipArchive;
    if ($zip->open($dir . '/admin-app-dist.zip') === TRUE) {
        $zip->extractTo($dir . '/admin/');
        $zip->close();
        $log[] = "Admin App extracted successfully to /admin.";
        unlink($dir . '/admin-app-dist.zip');
    } else {
        $log[] = "Failed to open admin-app-dist.zip";
    }
}

// Clean up unzip.php itself
@unlink(__FILE__);

header('Content-Type: application/json');
echo json_encode(['status' => 'ok', 'log' => $log]);
?>
