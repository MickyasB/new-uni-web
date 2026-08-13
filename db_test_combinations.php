<?php
header('Content-Type: application/json');

$passwords = ['Gym@2026', 'gymtragh', 'Gymtragh@2026', 'bingo2026', 'Bingo@2026'];
$users = ['gymtragh_bingo', 'gymtragh', 'gymtragh_root', 'gymtragh_admin'];
$databases = ['gymtragh_bingo', 'gymtragh_db', 'gymtragh_bingodb'];

$results = [];

foreach ($users as $u) {
    foreach ($passwords as $p) {
        foreach ($databases as $d) {
            try {
                $conn = @new mysqli('127.0.0.1', $u, $p, $d);
                if (!$conn->connect_error) {
                    $res = $conn->query("SHOW TABLES");
                    $tables = [];
                    while ($row = $res->fetch_array()) {
                        $tables[] = $row[0];
                    }
                    $results['SUCCESS'][] = [
                        'user' => $u,
                        'pass' => $p,
                        'db' => $d,
                        'tables' => $tables
                    ];
                    $conn->close();
                }
            } catch (Exception $e) {
                // ignore
            }
        }
    }
}

if (empty($results)) {
    $results['status'] = 'No valid combination found with tested parameters.';
}

echo json_encode($results, JSON_PRETTY_PRINT);
?>
