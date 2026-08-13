<?php
header('Content-Type: application/json');

$backendDir = '/home/gymtragh/bingo.gymtradingplc.com';
$logFile = '/home/gymtragh/logs/node_runner.log';

$possiblePaths = [
    '/opt/alt/alt-nodejs20/root/usr/bin/node',
    '/opt/cpanel/ea-nodejs20/bin/node',
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

// Kill any existing running process on port 4000
shell_exec("fuser -k 4000/tcp 2>/dev/null || pkill -f 'node app.js' 2>/dev/null");

sleep(1);

// Start Node server with DB_HOST=127.0.0.1 (local MySQL inside cPanel)
$cmd = "CDPATH= cd $backendDir && NODE_ENV=production PORT=4000 DB_HOST=127.0.0.1 DB_USER=gymtragh_bingo DB_PASS=Gym@2026 DB_NAME=gymtragh_bingo DB_PORT=3306 JWT_SECRET=bingo_secret_key_2026 nohup $nodeExec app.js > $logFile 2>&1 &";
shell_exec($cmd);

sleep(2);

// Check health
$ch = curl_init('http://127.0.0.1:4000/health');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 3);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$logTail = file_exists($logFile) ? implode('', array_slice(file($logFile), -30)) : 'No log file';

echo json_encode([
    'status' => ($httpCode === 200 ? 'started_successfully' : 'starting_failed'),
    'httpCode' => $httpCode,
    'nodeExec' => $nodeExec,
    'logTail' => $logTail,
    'health' => json_decode($response, true)
], JSON_PRETTY_PRINT);
?>
