<?php
header('Content-Type: application/json');

$backendDir = '/home/gymtragh/bingo.gymtradingplc.com';
$logFile = '/home/gymtragh/logs/node_runner.log';

// Find node binary on cPanel
$possiblePaths = [
    '/opt/cpanel/ea-nodejs20/bin/node',
    '/opt/cpanel/ea-nodejs18/bin/node',
    '/opt/cpanel/ea-nodejs16/bin/node',
    '/opt/alt/alt-nodejs20/root/usr/bin/node',
    '/opt/alt/alt-nodejs18/root/usr/bin/node',
    '/usr/local/bin/node',
    '/usr/bin/node',
    'node'
];

$nodeExec = null;
foreach ($possiblePaths as $path) {
    if (file_exists($path) && is_executable($path)) {
        $nodeExec = $path;
        break;
    }
}

if (!$nodeExec) {
    // Try finding via shell 'which' or 'find'
    $findOut = trim(@shell_exec("which node 2>/dev/null || find /opt -name node 2>/dev/null | head -n 1"));
    if ($findOut) {
        $nodeExec = $findOut;
    }
}

if (!$nodeExec) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Node.js binary not found on server.',
        'searched' => $possiblePaths
    ], JSON_PRETTY_PRINT);
    exit;
}

// Check health
$ch = curl_init('http://127.0.0.1:4000/health');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 2);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo json_encode([
        'status' => 'online',
        'nodeExec' => $nodeExec,
        'message' => 'Node.js backend server is running and healthy on port 4000.',
        'health' => json_decode($response, true)
    ], JSON_PRETTY_PRINT);
    exit;
}

// Start Node server
$cmd = "CDPATH= cd $backendDir && NODE_ENV=production PORT=4000 DB_HOST=162.244.95.11 DB_USER=gymtragh_bingo DB_PASS=Gym@2026 DB_NAME=gymtragh_bingo DB_PORT=3306 JWT_SECRET=bingo_secret_key_2026 nohup $nodeExec app.js > $logFile 2>&1 &";
shell_exec($cmd);

sleep(2);

$ch = curl_init('http://127.0.0.1:4000/health');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 3);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$logTail = file_exists($logFile) ? implode('', array_slice(file($logFile), -30)) : 'No log file';

echo json_encode([
    'status' => ($httpCode === 200 ? 'started' : 'starting_failed'),
    'httpCode' => $httpCode,
    'nodeExec' => $nodeExec,
    'logTail' => $logTail,
    'health' => json_decode($response, true)
], JSON_PRETTY_PRINT);
?>
