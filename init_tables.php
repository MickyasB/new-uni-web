<?php
header('Content-Type: application/json');

$host = '127.0.0.1';
$user = 'gymtragh_bingo';
$pass = 'Gym@2026';
$dbName = 'gymtragh_bingo';

$log = [];

// 1. Connect
$mysqli = @new mysqli($host, $user, $pass, $dbName);
if ($mysqli->connect_error) {
    echo json_encode(['error' => $mysqli->connect_error]);
    exit;
}
$log[] = "Connected successfully to MySQL!";

// 2. Load schema SQL
$sqlFile = '/home/gymtragh/bingo.gymtradingplc.com/shared/schema_mysql.sql';
if (!file_exists($sqlFile)) {
    echo json_encode(['error' => "Schema file not found at $sqlFile"]);
    exit;
}

$sql = file_get_contents($sqlFile);
$statements = array_filter(array_map('trim', explode(';', $sql)));

foreach ($statements as $stmt) {
    if (empty($stmt)) continue;
    if ($mysqli->query($stmt)) {
        $log[] = "Executed statement successfully";
    } else {
        $log[] = "Query error: " . $mysqli->error;
    }
}

// 3. Show tables
$res = $mysqli->query("SHOW TABLES");
$tables = [];
while ($row = $res->fetch_array()) {
    $tables[] = $row[0];
}

$log[] = "Tables in database: " . implode(', ', $tables);

echo json_encode(['status' => 'ok', 'log' => $log], JSON_PRETTY_PRINT);
?>
