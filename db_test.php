<?php
header('Content-Type: application/json');

$pass = 'Gym@2026';
$user = 'gymtragh_bingo';
$db   = 'gymtragh_bingo';

$hosts = ['127.0.0.1', 'localhost', '162.244.95.11'];
$results = [];

foreach ($hosts as $host) {
    try {
        $mysqli = @new mysqli($host, $user, $pass, $db);
        if ($mysqli->connect_error) {
            $results[$host] = 'Error: ' . $mysqli->connect_error;
        } else {
            $res = $mysqli->query("SHOW TABLES");
            $tables = [];
            while ($row = $res->fetch_array()) {
                $tables[] = $row[0];
            }
            $results[$host] = [
                'status' => 'connected',
                'tables' => $tables
            ];
            $mysqli->close();
        }
    } catch (Exception $e) {
        $results[$host] = 'Exception: ' . $e->getMessage();
    }
}

echo json_encode($results, JSON_PRETTY_PRINT);
?>
