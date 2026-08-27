<?php
/**
 * Sincronização manual inicial do backup offline do Prumo.
 * Recebe um JSON e o guarda como snapshot no MySQL.
 * Nesta fase não altera as tabelas relacionais nem apaga dados.
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Use POST para enviar um backup.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'message' => 'Configuração ausente. Crie api/config.php.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) === 0 || strlen($raw) > 20 * 1024 * 1024) {
    http_response_code(413);
    echo json_encode(['ok' => false, 'message' => 'Backup vazio ou maior que 20 MB.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$payload = json_decode($raw, true);
if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'O corpo recebido não é um JSON válido.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$config = require $configPath;
try {
    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $config['host'], $config['port'], $config['database']);
    $pdo = new PDO($dsn, $config['username'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $hash = hash('sha256', $raw);
    $statement = $pdo->prepare('INSERT IGNORE INTO sync_snapshots (id, payload_json, payload_hash, source) VALUES (:id, :payload, :hash, :source)');
    $statement->execute(['id' => $hash, 'payload' => $raw, 'hash' => $hash, 'source' => 'prumo-offline']);
    $saved = $statement->rowCount() > 0;
    $count = static function (string $key) use ($payload): int {
        return isset($payload[$key]) && is_array($payload[$key]) ? count($payload[$key]) : 0;
    };
    echo json_encode([
        'ok' => true,
        'saved' => $saved,
        'snapshot' => $hash,
        'message' => $saved ? 'Backup enviado ao MySQL como snapshot.' : 'Este backup já havia sido enviado.',
        'summary' => [
            'vistorias' => $count('vistorias'),
            'fotos' => $count('fotos'),
            'avaliacoes' => $count('avaliacoesMercadologicas'),
            'checklists' => $count('checklists'),
        ],
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'message' => 'Não foi possível gravar o snapshot no MySQL.'], JSON_UNESCAPED_UNICODE);
}
