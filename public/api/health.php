<?php
/**
 * Diagnóstico opcional da conexão MySQL do Prumo no XAMPP.
 * Copie config.example.php para config.php e ajuste apenas localmente.
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
    http_response_code(503);
    echo json_encode([
        'ok' => false,
        'message' => 'Configuração ausente. Copie api/config.example.php para api/config.php.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$config = require $configPath;
try {
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        $config['host'],
        $config['port'],
        $config['database']
    );
    $pdo = new PDO($dsn, $config['username'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $tables = (int) $pdo->query("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = " . $pdo->quote($config['database']))->fetchColumn();
    echo json_encode([
        'ok' => true,
        'database' => $config['database'],
        'tables' => $tables,
        'message' => 'Conexão MySQL do Prumo funcionando.',
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    http_response_code(503);
    echo json_encode([
        'ok' => false,
        'message' => 'Não foi possível conectar ao MySQL.',
    ], JSON_UNESCAPED_UNICODE);
}
