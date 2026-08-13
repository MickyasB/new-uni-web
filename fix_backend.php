<?php
header('Content-Type: application/json');
set_time_limit(300);
$log = [];
$dir = '/home/gymtragh/bingo.gymtradingplc.com';

function fixDirectoryRecursive($dirPath, &$log, &$fixedCount) {
    if (!is_dir($dirPath)) return;
    
    $items = array_diff(scandir($dirPath), ['.', '..']);
    foreach ($items as $item) {
        $fullPath = $dirPath . '/' . $item;
        
        if (strpos($item, '\\') !== false) {
            $fixedRelPath = str_replace('\\', '/', $item);
            $fixedFullPath = $dirPath . '/' . $fixedRelPath;
            $parentDir = dirname($fixedFullPath);
            if (!is_dir($parentDir)) {
                mkdir($parentDir, 0755, true);
            }
            if (rename($fullPath, $fixedFullPath)) {
                $fixedCount++;
                if ($fixedCount <= 20) {
                    $log[] = "Fixed: $item -> $fixedRelPath";
                }
            }
        } else if (is_dir($fullPath)) {
            fixDirectoryRecursive($fullPath, $log, $fixedCount);
        }
    }
}

$fixedCount = 0;
fixDirectoryRecursive($dir, $log, $fixedCount);

$log[] = "Total fixed files: $fixedCount";

$expressExists = is_dir($dir . '/node_modules/express') || file_exists($dir . '/node_modules/express/index.js');
$log[] = "Express module check: " . ($expressExists ? "✓ FOUND" : "✗ NOT FOUND");

echo json_encode(['status' => 'ok', 'log' => $log], JSON_PRETTY_PRINT);
?>
