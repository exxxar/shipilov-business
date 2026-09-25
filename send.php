<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$allowed_origin = $_SERVER['HTTP_HOST'] ?? '';
$origin = $_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? '');
if ($origin && strpos($origin, $allowed_origin) === false) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden']);
    exit;
}

if (!empty($_POST['website'])) {
    echo json_encode(['success' => true]); // Honeypot сработал
    exit;
}

function clean(string $value): string {
    $value = trim($value);
    $value = strip_tags($value);
    return mb_substr($value, 0, 3000);
}

$name = clean($_POST['name'] ?? '');
$contact = clean($_POST['contact'] ?? '');
$email = clean($_POST['email'] ?? '');
$topic = clean($_POST['topic'] ?? '');
$message = clean($_POST['message'] ?? '');
$consent_process = isset($_POST['consent_process']) ? (int)$_POST['consent_process'] : 0;
$consent_transfer = isset($_POST['consent_transfer']) ? (int)$_POST['consent_transfer'] : 0;

if ($name === '' || mb_strlen($name) < 2) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'Укажите имя']); exit; }
if ($contact === '' || mb_strlen($contact) < 3) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'Укажите контакт']); exit; }
if ($message === '' || mb_strlen($message) < 5) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'Напишите сообщение']); exit; }
if ($consent_process !== 1) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'Необходимо согласие на обработку ПДн']); exit; }
if ($consent_transfer !== 1) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'Необходимо согласие на передачу данных третьим лицам']); exit; }
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'Некорректный e-mail']); exit; }

// --- Обработка файла ---
$fileName = 'Нет';
if (isset($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['attachment'];
    $maxSize = 10 * 1024 * 1024; // 10 МБ
    $allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'];

    if ($file['size'] > $maxSize) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Файл слишком большой (макс. 10 МБ)']);
        exit;
    }
    if (!in_array($file['type'], $allowedMimes)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Недопустимый формат файла']);
        exit;
    }

    $uploadDir = __DIR__ . '/uploads/';
    if (!is_dir($uploadDir)) { mkdir($uploadDir, 0755, true); }

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $newName = uniqid('req_', true) . '.' . $ext;
    $dest = $uploadDir . $newName;

    if (move_uploaded_file($file['tmp_name'], $dest)) {
        $fileName = $newName . ' (сохранён на сервере)';
    } else {
        error_log('[Shipilov] Failed to move uploaded file');
        $fileName = 'Ошибка загрузки файла';
    }
}

// --- Отправка письма ---
$to = 'exxxar@vk.com'; // ЗАМЕНИТЕ НА РЕАЛЬНЫЙ EMAIL
$from = 'noreply@' . ($_SERVER['HTTP_HOST'] ?? 'site');
$subject = 'Новая заявка с сайта — ' . ($topic ?: 'без темы');

$body = "Имя: {$name}\n"
    . "Контакт: {$contact}\n"
    . "E-mail: " . ($email ?: 'не указан') . "\n"
    . "Тема: {$topic}\n"
    . "Сообщение:\n{$message}\n\n"
    . "Прикреплённый файл: {$fileName}\n\n"
    . "=== ЮРИДИЧЕСКАЯ ИНФОРМАЦИЯ ===\n"
    . "Согласие на обработку ПДн: ПОЛУЧЕНО (1)\n"
    . "Согласие на передачу 3-м лицам: ПОЛУЧЕНО (1)\n"
    . "Согласие на рассылку: " . (isset($_POST['consent_marketing']) && $_POST['consent_marketing'] == 1 ? 'ПОЛУЧЕНО (1)' : 'НЕ ПОЛУЧЕНО (0)') . "\n"
    . "Время: " . date('Y-m-d H:i:s') . "\n"
    . "IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n"
    . "User-Agent: " . ($_SERVER['HTTP_USER_AGENT'] ?? 'unknown') . "\n";

$headers = [
    'From' => $from,
    'Reply-To' => $email ?: $from,
    'Content-Type' => 'text/plain; charset=UTF-8',
    'X-Mailer' => 'ShipilovSite'
];
$headerLines = [];
foreach ($headers as $k => $v) $headerLines[] = "{$k}: {$v}";

try {
    $ok = @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headerLines));
    if ($ok) {
        echo json_encode(['success' => true, 'message' => 'Спасибо! Заявка отправлена. Мы свяжемся с вами.']);
    } else {
        http_response_code(500);
        error_log('[Shipilov] mail() failed');
        echo json_encode(['success' => false, 'message' => 'Не удалось отправить заявку. Попробуйте ещё раз.']);
    }
} catch (\Throwable $e) {
    http_response_code(500);
    error_log('[Shipilov] ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Внутренняя ошибка сервера']);
}